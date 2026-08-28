// Config/paymob.js — All Paymob integration credentials
module.exports = {
  API_KEY: process.env.PAYMOB_API_KEY,
  HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
  BASE_URL: 'https://accept.paymob.com/api',
  
  // Integration IDs
  INTEGRATIONS: {
    CARD:   parseInt(process.env.PAYMOB_CARD_INTEGRATION_ID || '0', 10),
    WALLET: parseInt(process.env.PAYMOB_WALLET_INTEGRATION_ID || '0', 10),
    KIOSK:  parseInt(process.env.PAYMOB_KIOSK_INTEGRATION_ID || '0', 10),
    VALU:   parseInt(process.env.PAYMOB_VALU_INTEGRATION_ID || '0', 10),
  },
  
  IFRAME_ID: process.env.PAYMOB_IFRAME_ID,
  VALU_IFRAME_ID: process.env.PAYMOB_VALU_IFRAME_ID,
};
