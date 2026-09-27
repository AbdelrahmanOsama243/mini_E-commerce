const axios = require('axios');
const paymobConfig = require('../Config/paymob');
const logger = require('../Config/logger');
const crypto = require('crypto');
const ApiError = require('../Utils/ApiError');

/**
 * Paymob Service - Handles all integrations with Paymob Accept APIs
 */
class PaymobService {
  /**
   * Step 1: Authentication - Get auth token from Paymob
   */
  async getAuthToken() {
    try {
      const response = await axios.post(`${paymobConfig.BASE_URL}/auth/tokens`, {
        api_key: paymobConfig.API_KEY,
      });
      return response.data.token;
    } catch (error) {
      logger.error(`Paymob getAuthToken Error: ${error.response?.data?.message || error.message}`);
      throw new ApiError(502, 'Payment Gateway Authentication Failed');
    }
  }

  /**
   * Step 2: Order Registration
   */
  async createOrder(authToken, amountCents, items, merchantOrderId) {
    try {
      const response = await axios.post(`${paymobConfig.BASE_URL}/ecommerce/orders`, {
        auth_token: authToken,
        delivery_needed: 'false',
        amount_cents: amountCents.toString(),
        currency: 'EGP',
        merchant_order_id: merchantOrderId,
        items: items, // Array of { name, amount_cents, description, quantity }
      });
      return response.data.id; // Paymob Order ID
    } catch (error) {
      logger.error(`Paymob createOrder Error: ${error.response?.data?.message || error.message}`);
      throw new ApiError(502, 'Failed to register order with Payment Gateway');
    }
  }

  /**
   * Step 3: Payment Key Generation
   */
  async createPaymentKey(authToken, amountCents, paymobOrderId, billingData, integrationId) {
    try {
      const response = await axios.post(`${paymobConfig.BASE_URL}/acceptance/payment_keys`, {
        auth_token: authToken,
        amount_cents: amountCents.toString(),
        expiration: 3600, // 1 hour
        order_id: paymobOrderId,
        billing_data: {
          first_name: billingData.firstName || 'NA',
          last_name: billingData.lastName || 'NA',
          email: billingData.email || 'na@test.com',
          phone_number: billingData.phone || '01000000000',
          apartment: 'NA',
          floor: 'NA',
          street: billingData.street || 'NA',
          building: 'NA',
          shipping_method: 'PKG',
          postal_code: 'NA',
          city: billingData.city || 'Cairo',
          country: 'EG',
          state: 'NA'
        },
        currency: 'EGP',
        integration_id: integrationId,
      });
      return response.data.token;
    } catch (error) {
      logger.error(`Paymob createPaymentKey Error: ${error.response?.data?.message || error.message}`);
      throw new ApiError(502, 'Failed to generate payment key');
    }
  }

  /**
   * Pay with Wallet - Step 4 for Mobile Wallets
   */
  async payWithWallet(paymentToken, walletPhone) {
    try {
      const response = await axios.post(`${paymobConfig.BASE_URL}/acceptance/payments/pay`, {
        source: {
          identifier: walletPhone,
          subtype: 'WALLET'
        },
        payment_token: paymentToken
      });
      // Returns iframe_url which actually redirects to wallet payment
      return response.data.redirect_url || response.data.iframe_url; 
    } catch (error) {
      logger.error(`Paymob payWithWallet Error: ${error.response?.data?.message || error.message}`);
      throw new ApiError(502, 'Failed to initiate wallet payment');
    }
  }

  /**
   * Pay with Kiosk/Fawry - Step 4 for Cash
   */
  async payWithKiosk(paymentToken) {
    try {
      const response = await axios.post(`${paymobConfig.BASE_URL}/acceptance/payments/pay`, {
        source: {
          identifier: 'AGGREGATOR',
          subtype: 'AGGREGATOR'
        },
        payment_token: paymentToken
      });
      
      // Kiosk response contains bill_reference
      if (response.data.data && response.data.data.bill_reference) {
        return response.data.data.bill_reference;
      } else if (response.data.pending === 'true') {
         // Fallback if structured differently
         return response.data.id; 
      }
      throw new Error('No bill_reference in response');
    } catch (error) {
      logger.error(`Paymob payWithKiosk Error: ${error.response?.data?.message || error.message}`);
      throw new ApiError(502, 'Failed to initiate Kiosk/Fawry payment');
    }
  }

  /**
   * Refund Transaction
   */
  async refundTransaction(authToken, transactionId, amountCents) {
    try {
      const response = await axios.post(`${paymobConfig.BASE_URL}/acceptance/void_refund/refund`, {
        auth_token: authToken,
        transaction_id: transactionId,
        amount_cents: amountCents
      });
      return response.data;
    } catch (error) {
      logger.error(`Paymob refundTransaction Error: ${error.response?.data?.message || error.message}`);
      throw new ApiError(502, 'Failed to refund transaction');
    }
  }

  /**
   * Void Transaction (Before Settlement)
   */
  async voidTransaction(authToken, transactionId) {
    try {
      const response = await axios.post(`${paymobConfig.BASE_URL}/acceptance/void_refund/void`, {
        auth_token: authToken,
        transaction_id: transactionId
      });
      return response.data;
    } catch (error) {
      logger.error(`Paymob voidTransaction Error: ${error.response?.data?.message || error.message}`);
      throw new ApiError(502, 'Failed to void transaction');
    }
  }

  /**
   * Inquire Transactions for a Paymob Order
   */
  async getTransactionsForOrder(authToken, paymobOrderId) {
    try {
      const response = await axios.post(`${paymobConfig.BASE_URL}/ecommerce/orders/transaction_inquiry`, {
        auth_token: authToken,
        order_id: paymobOrderId
      });
      return response.data;
    } catch (error) {
      logger.warn(`Paymob getTransactionsForOrder Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  /**
   * Verify HMAC signature for Webhooks
   */
  verifyHMAC(queryString, hmacHeader) {
    const secret = paymobConfig.HMAC_SECRET;
    
    // Sort keys alphabetically
    const keys = [
      'amount_cents', 'created_at', 'currency', 'error_occured',
      'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
      'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
      'is_voided', 'order', 'owner', 'pending', 'source_data.pan',
      'source_data.sub_type', 'source_data.type', 'success'
    ].sort();

    // Concatenate values based on sorted keys
    let concatenatedString = '';
    
    // queryString here is actually the obj in the callback body (req.body.obj)
    const obj = queryString; 
    
    keys.forEach(key => {
      // Handle nested keys like source_data.pan
      const keyParts = key.split('.');
      let val = obj;
      for (const part of keyParts) {
        if (val) val = val[part];
      }
      
      // Paymob concatenates even boolean false or 0, but as strings
      if (val !== undefined && val !== null) {
        concatenatedString += val.toString();
      }
    });

    const hash = crypto.createHmac('sha512', secret).update(concatenatedString).digest('hex');
    
    return hash === hmacHeader;
  }
}

module.exports = new PaymobService();
