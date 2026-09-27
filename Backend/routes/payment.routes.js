const express = require('express');
const router = express.Router();
const paymentController = require('../Controllers/payment.controller');
const { authentication } = require('../Middlewares/auth.middleware');
const { authorize } = require('../Middlewares/authorize.middleware');
const { validateZod } = require('../Middlewares/zodValidator');
const { z } = require('zod');
const { validateObjectId } = require('../Middlewares/validateObjectId');
const { paymentLimiter } = require('../Middlewares/rateLimiter');

// Note: Zod schemas are defined here for simplicity or can be imported from zodValidator.js
// I'll define them here if they are not in zodValidator, but we updated zodValidator earlier.
// Wait, we didn't add all payment schemas to zodValidator, let me define them here.

const paymentSchemas = {
  initiatePayment: {
    body: z.object({
      paymentMethod: z.enum(['card', 'wallet', 'kiosk', 'valu']),
      shippingAddress: z.string().min(5, "Shipping address must be at least 5 characters"),
      billingData: z.object({
        firstName: z.string().min(2, "First name must be at least 2 characters"),
        lastName: z.string().min(2, "Last name must be at least 2 characters"),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().regex(/^(010|011|012|015)[0-9]{8}$/, "Valid 11-digit Egyptian phone number required (e.g. 01012345678)"),
        city: z.string().optional().default('Cairo'),
        street: z.string().optional().default('NA')
      }),
      walletPhone: z.string().optional()
    }).refine(
      data => data.paymentMethod !== 'wallet' || (data.walletPhone && /^(010|011|012|015)[0-9]{8}$/.test(data.walletPhone)),
      { message: "Valid 11-digit wallet phone is required for wallet payments" }
    )
  },
  initiateCOD: {
    body: z.object({
      shippingAddress: z.string().min(5, "Shipping address must be at least 5 characters"),
      billingData: z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        phone: z.string().regex(/^(010|011|012|015)[0-9]{8}$/).optional(),
        city: z.string().optional(),
        street: z.string().optional()
      }).optional()
    })
  },
  refundPayment: {
    body: z.object({
      orderId: z.string().min(1, "Order ID is required"),
      amountCents: z.number().positive().optional()
    })
  },
  recordTransaction: {
    body: z.object({
      orderId: z.string().min(1, "Order ID is required"),
      transactionId: z.union([z.string(), z.number()]).optional(),
      paymobOrderId: z.union([z.string(), z.number()]).optional()
    })
  },
  voidPayment: {
    body: z.object({
      orderId: z.string().min(1, "Order ID is required")
    })
  }
};

// 🔓 Public — Paymob Webhook
router.post('/callback', paymentController.handleCallback);

// 🔒 Protected Routes
router.use(authentication);
router.use(paymentLimiter);

router.post('/initiate',
  validateZod(paymentSchemas.initiatePayment),
  paymentController.initiatePayment
);

router.post('/cod',
  validateZod(paymentSchemas.initiateCOD),
  paymentController.initiateCOD
);

router.post('/record-transaction',
  validateZod(paymentSchemas.recordTransaction),
  paymentController.recordTransaction
);

router.get('/status/:orderId',
  validateObjectId(['orderId'], 'params'),
  paymentController.getPaymentStatus
);

router.get('/methods', paymentController.getSavedMethods);

// 🔒 Admin Only
router.post('/refund',
  validateZod(paymentSchemas.refundPayment),
  paymentController.refundPayment
);

router.post('/void',
  authorize('admin'),
  validateZod(paymentSchemas.voidPayment),
  paymentController.voidPayment
);

module.exports = router;
