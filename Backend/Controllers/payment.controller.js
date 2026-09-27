const paymentService = require('../Services/paymob.service');
const OrdersRepository = require('../Repos/orders.Repo');
const CartsRepository = require('../Repos/Carts.Repo');
const PaymentMethodRepo = require('../Repos/PaymentMethod.Repo');
const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const { sendSuccess } = require('../Utils/response');
const { addOrderJob } = require('../Jobs/order.queue');
const { addEmailJob } = require('../Jobs/email.queue');
const paymobConfig = require('../Config/paymob');
const logger = require('../Config/logger');

const initiatePayment = asyncHandler(async (req, res, next) => {
  const { paymentMethod, billingData, walletPhone, shippingAddress } = req.body;
  const userId = req.user._id;

  // 1. Fetch Cart
  const cart = await CartsRepository.getCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    return next(new ApiError(400, "Cart is empty"));
  }

  // 1.5. Validate all products exist and have sufficient stock
  for (const item of cart.items) {
    if (!item.productId) {
      return next(new ApiError(400, "One or more products in your cart are no longer available"));
    }
    if (item.quantity > item.productId.stock) {
      return next(new ApiError(400, `Insufficient stock for "${item.productId.name}". Available: ${item.productId.stock}, Requested: ${item.quantity}`));
    }
  }

  // 2. Calculate Total Price
  const totalPrice = cart.items.reduce((total, item) => {
    return total + item.quantity * (item.productId.price || 0);
  }, 0);
  
  const amountCents = Math.round(totalPrice * 100);

  // 3. Select Integration ID
  let integrationId;
  switch (paymentMethod) {
    case 'card': integrationId = paymobConfig.INTEGRATIONS.CARD; break;
    case 'wallet': integrationId = paymobConfig.INTEGRATIONS.WALLET; break;
    case 'kiosk': integrationId = paymobConfig.INTEGRATIONS.KIOSK; break;
    case 'valu': integrationId = paymobConfig.INTEGRATIONS.VALU; break;
    default: return next(new ApiError(400, "Invalid online payment method"));
  }

  // 4. Auth & Create Order with Paymob
  const authToken = await paymentService.getAuthToken();
  const paymobOrderId = await paymentService.createOrder(
    authToken, 
    amountCents, 
    cart.items.map(i => ({ 
      name: i.productId.name, 
      amount_cents: Math.round(i.productId.price * 100),
      description: i.productId.description || 'Product',
      quantity: i.quantity 
    })), 
    `ORDER_${Date.now()}_${userId}` // merchant_order_id
  );

  // 5. Build Complete Billing Data (automatically uses logged in user's email)
  const user = req.user;
  const nameParts = (user?.name || '').trim().split(' ');
  const defaultFirstName = nameParts[0] || 'Customer';
  const defaultLastName = nameParts.slice(1).join(' ') || 'User';

  const completeBillingData = {
    firstName: billingData?.firstName || defaultFirstName,
    lastName: billingData?.lastName || defaultLastName,
    email: user?.email || billingData?.email || 'customer@example.com',
    phone: billingData?.phone || '01000000000',
    city: billingData?.city || 'Cairo',
    street: billingData?.street || shippingAddress || 'NA',
  };

  // Generate Payment Key
  const paymentToken = await paymentService.createPaymentKey(
    authToken,
    amountCents,
    paymobOrderId,
    completeBillingData,
    integrationId
  );

  // 6. Handle Specific Payment Flows
  let iframeUrl, redirectUrl, fawryReferenceNumber;
  
  if (paymentMethod === 'card') {
    iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymobConfig.IFRAME_ID}?payment_token=${paymentToken}`;
  } else if (paymentMethod === 'valu') {
    iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymobConfig.VALU_IFRAME_ID}?payment_token=${paymentToken}`;
  } else if (paymentMethod === 'wallet') {
    if (!walletPhone) return next(new ApiError(400, "Wallet phone is required"));
    redirectUrl = await paymentService.payWithWallet(paymentToken, walletPhone);
  } else if (paymentMethod === 'kiosk') {
    fawryReferenceNumber = await paymentService.payWithKiosk(paymentToken);
  }

  // 7. Create Pending Order in DB
  const orderItems = cart.items.map((item) => ({
    productId: item.productId._id || item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.productId.price || 0,
  }));

  const order = await OrdersRepository.create({
    userId,
    items: orderItems,
    shippingAddress,
    totalPrice,
    paymentMethod,
    status: 'pending',
    paymentStatus: 'pending',
    paymobOrderId,
    fawryRef: fawryReferenceNumber ? fawryReferenceNumber.toString() : undefined
  });

  // 8. Clear Cart
  await CartsRepository.updateCart(cart._id, []);

  // Note: Stock is NOT deducted yet. It waits for the webhook.

  return sendSuccess(res, {
    orderId: order._id,
    paymobOrderId,
    paymentToken,
    clientSecret: paymentToken,
    publicKey: process.env.PAYMOB_PUBLIC_KEY || process.env.PAYMOB_API_KEY,
    iframeUrl,
    redirectUrl,
    fawryReferenceNumber
  }, "Payment initiated successfully", 201);
});

const initiateCOD = asyncHandler(async (req, res, next) => {
  const { shippingAddress } = req.body;
  const userId = req.user._id;

  // 1. Check if user has saved payment methods
  const hasMethod = await PaymentMethodRepo.hasAnyMethod(userId);
  if (!hasMethod) {
    return next(new ApiError(403, "Cash on Delivery requires at least one saved payment method (Card/Wallet)."));
  }

  // 2. Fetch Cart
  const cart = await CartsRepository.getCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    return next(new ApiError(400, "Cart is empty"));
  }

  // 2.5. Validate all products exist and have sufficient stock
  for (const item of cart.items) {
    if (!item.productId) {
      return next(new ApiError(400, "One or more products in your cart are no longer available"));
    }
    if (item.quantity > item.productId.stock) {
      return next(new ApiError(400, `Insufficient stock for "${item.productId.name}". Available: ${item.productId.stock}, Requested: ${item.quantity}`));
    }
  }

  const totalPrice = cart.items.reduce((total, item) => total + item.quantity * (item.productId.price || 0), 0);

  const orderItems = cart.items.map((item) => ({
    productId: item.productId._id || item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.productId.price || 0,
  }));

  // 3. Create Order
  const order = await OrdersRepository.create({
    userId,
    items: orderItems,
    shippingAddress,
    totalPrice,
    paymentMethod: 'cod',
    status: 'processing', // Since COD, it immediately starts processing
    paymentStatus: 'pending' // Paid upon delivery
  });

  // 4. Clear Cart
  await CartsRepository.updateCart(cart._id, []);

  // 5. Deduct Stock immediately
  const queueData = {
    orderId: order._id,
    userId,
    cartItems: orderItems
  };
  await addOrderJob(queueData);

  // 6. Send Payment Invoice / Receipt Email in Background
  if (req.user?.email) {
    const invoiceData = {
      orderId: order._id,
      customerName: req.user.name || "Customer",
      items: cart.items.map((i) => ({
        name: i.productId?.name || "Product",
        quantity: i.quantity,
        priceAtPurchase: i.productId?.price || 0,
      })),
      totalPrice: order.totalPrice,
      shippingAddress: order.shippingAddress,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      createdAt: order.createdAt,
    };
    await addEmailJob('paymentInvoice', req.user.email, invoiceData);
  }

  return sendSuccess(res, { orderId: order._id }, "Order placed successfully via COD", 201);
});

const handleCallback = asyncHandler(async (req, res, next) => {
  const hmac = req.query.hmac;
  const data = req.body?.obj || req.query;
  
  if (!data || Object.keys(data).length === 0) {
    if (req.method === 'GET') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      return res.redirect(`${frontendUrl}/payment/failed`);
    }
    return res.status(400).send('No data object');
  }

  // Verify HMAC — mandatory for all callbacks
  if (!hmac) {
    logger.warn("Payment callback received without HMAC signature");
    return res.status(401).json({ success: false, message: "HMAC signature is required" });
  }

  const isValid = paymentService.verifyHMAC(req.query, hmac);
  if (!isValid) {
    logger.warn({ hmac }, "Invalid HMAC signature received for payment callback");
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  const paymobOrderId = data.order?.id || data.order || req.query.order;
  const success = data.success === true || data.success === 'true' || req.query.success === 'true';
  const isRefunded = data.is_refunded === true || data.is_refunded === 'true';
  const isVoided = data.is_voided === true || data.is_voided === 'true';
  const transactionId = data.id || req.query.id;

  // Find Order with flexible type matching
  const order = await OrdersRepository.model.findOne({
    $or: [
      { paymobOrderId: paymobOrderId },
      { paymobOrderId: Number(paymobOrderId) || 0 }
    ]
  });

  if (order) {
    if (isRefunded) {
      await OrdersRepository.update(order._id, { 
        status: 'refunded', 
        paymentStatus: 'refunded',
        refundedAmount: (data.amount_cents || req.query.amount_cents || 0) / 100 
      });
    } else if (isVoided) {
      await OrdersRepository.update(order._id, { 
        status: 'cancelled', 
        paymentStatus: 'refunded' 
      });
    } else if (success) {
      const isFirstSuccess = order.paymentStatus !== 'paid';

      // Payment Successful
      await OrdersRepository.update(order._id, { 
        status: 'paid', 
        paymentStatus: 'paid',
        transactionId: transactionId || order.transactionId 
      });

      // Save payment method for future COD allowed
      try {
        await PaymentMethodRepo.createFromTransaction(order.userId, data);
      } catch (e) {}

      // Deduct stock only on first success confirmation
      if (isFirstSuccess) {
        const queueData = {
          orderId: order._id,
          userId: order.userId,
          cartItems: order.items
        };
        await addOrderJob(queueData);
      }

      // Send Payment Invoice Email in Background
      try {
        const fullOrder = await OrdersRepository.model
          .findById(order._id)
          .populate('userId')
          .populate('items.productId');

        if (fullOrder && fullOrder.userId?.email) {
          const invoiceData = {
            orderId: fullOrder._id,
            customerName: fullOrder.userId.name || "Customer",
            items: (fullOrder.items || []).map((i) => ({
              name: i.productId?.name || i.name || "Product",
              quantity: i.quantity || 1,
              priceAtPurchase: i.priceAtPurchase || i.productId?.price || 0,
            })),
            totalPrice: fullOrder.totalPrice || 0,
            shippingAddress: fullOrder.shippingAddress || "N/A",
            paymentMethod: fullOrder.paymentMethod || "card",
            paymentStatus: 'paid',
            transactionId: transactionId || fullOrder.transactionId,
            fawryRef: fullOrder.fawryRef,
            createdAt: fullOrder.createdAt || new Date(),
          };

          await addEmailJob('paymentInvoice', fullOrder.userId.email, invoiceData);
          logger.info(`✅ Queued invoice email for order ${fullOrder._id} to ${fullOrder.userId.email}`);
        }
      } catch (emailErr) {
        logger.error({ err: emailErr.message }, "Failed to queue invoice email");
      }

    } else {
      // Payment Failed
      await OrdersRepository.update(order._id, { 
        status: 'payment_failed', 
        paymentStatus: 'failed' 
      });
    }
  }

  // Handle Response based on request type
  if (req.method === 'GET') {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    return res.redirect(`${frontendUrl}/payment/${success ? 'success' : 'failed'}`);
  }

  return res.status(200).send('OK');
});

const getPaymentStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const order = await OrdersRepository.findById(orderId);
  if (!order) return next(new ApiError(404, "Order not found"));

  const orderUserId = (order.userId?._id || order.userId)?.toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user)?.toString();

  if (orderUserId !== currentUserId && req.user?.role !== 'admin') {
    return next(new ApiError(403, "Forbidden"));
  }

  // If order is pending or missing transactionId, attempt inquiry with Paymob
  if (order.paymobOrderId && (!order.transactionId || order.paymentStatus !== 'paid')) {
    try {
      const authToken = await paymentService.getAuthToken();
      const inquiry = await paymentService.getTransactionsForOrder(authToken, order.paymobOrderId);
      const txns = inquiry?.transactions || (Array.isArray(inquiry) ? inquiry : []);
      if (txns && txns.length > 0) {
        const successfulTxn = txns.find(t => t.success === true || t.success === 'true') || txns[0];
        if (successfulTxn?.id) {
          const isSuccess = successfulTxn.success === true || successfulTxn.success === 'true';
          const updateData = {
            transactionId: successfulTxn.id.toString(),
            ...(isSuccess && {
              status: 'paid',
              paymentStatus: 'paid'
            })
          };
          await OrdersRepository.update(order._id, updateData);
          order.transactionId = successfulTxn.id.toString();
          if (isSuccess) {
            order.status = 'paid';
            order.paymentStatus = 'paid';
          }
        }
      }
    } catch (e) {
      logger.warn(`Could not sync payment inquiry for order ${orderId}: ${e.message}`);
    }
  }
  
  return sendSuccess(res, {
    status: order.paymentStatus,
    orderStatus: order.status,
    transactionId: order.transactionId,
    fawryRef: order.fawryRef
  });
});

const getSavedMethods = asyncHandler(async (req, res, next) => {
  const methods = await PaymentMethodRepo.findByUserId(req.user.id);
  return sendSuccess(res, methods);
});

const recordTransaction = asyncHandler(async (req, res, next) => {
  const { orderId, transactionId, paymobOrderId } = req.body;
  const order = await OrdersRepository.findById(orderId);
  if (!order) return next(new ApiError(404, "Order not found"));

  const orderUserId = (order.userId?._id || order.userId)?.toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user)?.toString();

  if (orderUserId !== currentUserId && req.user?.role !== 'admin') {
    return next(new ApiError(403, "Forbidden"));
  }

  const isFirstSuccess = order.paymentStatus !== 'paid';

  const updateData = {
    status: 'paid',
    paymentStatus: 'paid',
  };

  if (transactionId) {
    updateData.transactionId = transactionId.toString();
  }
  if (paymobOrderId) {
    updateData.paymobOrderId = paymobOrderId.toString();
  }

  const updated = await OrdersRepository.update(orderId, updateData);

  // Deduct stock if first time marked paid
  if (isFirstSuccess) {
    const queueData = {
      orderId: order._id,
      userId: order.userId,
      cartItems: order.items
    };
    await addOrderJob(queueData);

    // Send invoice email in background
    try {
      const fullOrder = await OrdersRepository.model
        .findById(order._id)
        .populate('userId')
        .populate('items.productId');

      if (fullOrder && fullOrder.userId?.email) {
        const invoiceData = {
          orderId: fullOrder._id,
          customerName: fullOrder.userId.name || "Customer",
          items: (fullOrder.items || []).map((i) => ({
            name: i.productId?.name || i.name || "Product",
            quantity: i.quantity || 1,
            priceAtPurchase: i.priceAtPurchase || i.productId?.price || 0,
          })),
          totalPrice: fullOrder.totalPrice || 0,
          shippingAddress: fullOrder.shippingAddress || "N/A",
          paymentMethod: fullOrder.paymentMethod || "card",
          paymentStatus: 'paid',
          transactionId: updateData.transactionId || fullOrder.transactionId,
          fawryRef: fullOrder.fawryRef,
          createdAt: fullOrder.createdAt || new Date(),
        };
        await addEmailJob('paymentInvoice', fullOrder.userId.email, invoiceData);
      }
    } catch (emailErr) {
      logger.error(`Error queuing invoice email: ${emailErr.message}`);
    }
  }

  return sendSuccess(res, updated, "Transaction recorded successfully");
});

const refundPayment = asyncHandler(async (req, res, next) => {
  const { orderId, amountCents } = req.body;
  const order = await OrdersRepository.findById(orderId);
  if (!order) return next(new ApiError(404, "Order not found"));

  // Validate refund amount doesn't exceed order total
  if (amountCents && amountCents > Math.round(order.totalPrice * 100)) {
    return next(new ApiError(400, "Refund amount cannot exceed order total"));
  }

  const orderUserId = (order.userId?._id || order.userId)?.toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user)?.toString();

  if (orderUserId !== currentUserId && req.user?.role !== 'admin') {
    return next(new ApiError(403, "Forbidden: You can only refund your own orders"));
  }

  // 1. Cash on Delivery handling
  if (order.paymentMethod === 'cod') {
    const refundAmount = amountCents ? amountCents / 100 : order.totalPrice;
    const updated = await OrdersRepository.update(orderId, {
      status: 'refunded',
      paymentStatus: 'refunded',
      refundedAmount: refundAmount
    });
    return sendSuccess(res, updated, "Cash on Delivery order refunded successfully");
  }

  // 2. If transactionId missing, auto-recover from Paymob if possible
  if (!order.transactionId && order.paymobOrderId) {
    try {
      const authToken = await paymentService.getAuthToken();
      const inquiry = await paymentService.getTransactionsForOrder(authToken, order.paymobOrderId);
      const txns = inquiry?.transactions || (Array.isArray(inquiry) ? inquiry : []);
      const successfulTxn = txns.find(t => t.success === true || t.success === 'true') || txns[0];
      if (successfulTxn?.id) {
        order.transactionId = successfulTxn.id.toString();
        order.paymentStatus = 'paid';
        await OrdersRepository.update(orderId, {
          transactionId: order.transactionId,
          paymentStatus: 'paid'
        });
      }
    } catch (e) {
      logger.warn(`Paymob recovery inquiry error: ${e.message}`);
    }
  }

  const refundAmount = amountCents || Math.round(order.totalPrice * 100);

  // 3. Attempt Paymob Gateway Refund if transactionId exists
  if (order.transactionId) {
    try {
      const authToken = await paymentService.getAuthToken();
      await paymentService.refundTransaction(authToken, order.transactionId, refundAmount);
    } catch (gatewayError) {
      logger.warn(`Paymob refund API call error: ${gatewayError.response?.data?.message || gatewayError.message}`);
      // If gateway rejects (e.g. sandbox or settlement window not reached), allow admin or fallback
      if (req.user?.role !== 'admin' && process.env.NODE_ENV === 'production') {
        return next(new ApiError(502, `Gateway Refund Failed: ${gatewayError.response?.data?.message || gatewayError.message}`));
      }
    }
  } else {
    // If still no transactionId, allow admin or dev fallback rather than blocking
    if (req.user?.role !== 'admin' && process.env.NODE_ENV === 'production') {
      return next(new ApiError(400, "Order is missing transaction ID and cannot be refunded through Paymob"));
    }
  }

  const updated = await OrdersRepository.update(orderId, {
    status: amountCents ? 'partially_refunded' : 'refunded',
    paymentStatus: 'refunded',
    refundedAmount: refundAmount / 100
  });

  return sendSuccess(res, updated, "Refund processed successfully");
});

const voidPayment = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await OrdersRepository.findById(orderId);
  if (!order) return next(new ApiError(404, "Order not found"));
  if (order.paymentStatus !== 'paid' || !order.transactionId) {
    return next(new ApiError(400, "Order is not paid or missing transaction ID"));
  }
  // Cannot void orders that have already been shipped or delivered
  if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
    return next(new ApiError(400, `Cannot void an order with status "${order.status}"`));
  }

  const authToken = await paymentService.getAuthToken();
  await paymentService.voidTransaction(authToken, order.transactionId);
  
  const updated = await OrdersRepository.update(orderId, {
    status: 'cancelled',
    paymentStatus: 'refunded'
  });
  
  return sendSuccess(res, updated, "Void initiated");
});

module.exports = {
  initiatePayment,
  initiateCOD,
  handleCallback,
  getPaymentStatus,
  getSavedMethods,
  recordTransaction,
  refundPayment,
  voidPayment
};
