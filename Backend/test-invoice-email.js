require('dotenv').config();
const { sendPaymentInvoiceEmail, sendVerificationEmail } = require('./Utils/emailService');

async function runTest() {
  console.log("Testing Mailtrap connection & Payment Invoice Email...");
  console.log("SMTP Config:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
  });

  const mockInvoiceData = {
    orderId: "67bc954f9a1e0b0012345678",
    customerName: "Abdelrahman Osama",
    items: [
      {
        name: "Vintage Brutalist T-Shirt",
        quantity: 2,
        priceAtPurchase: 450,
      },
      {
        name: "Minimalist Leather Wallet",
        quantity: 1,
        priceAtPurchase: 350,
      },
    ],
    totalPrice: 1250,
    shippingAddress: "Nasr City, Cairo, Egypt",
    paymentMethod: "card",
    paymentStatus: "paid",
    transactionId: "TRX_987654321",
    createdAt: new Date(),
  };

  try {
    const result = await sendPaymentInvoiceEmail("customer@example.com", mockInvoiceData);
    console.log("✅ Payment Invoice Email sent successfully to Mailtrap!", result);
  } catch (err) {
    console.error("❌ Error sending test invoice email:", err);
  }
}

runTest();
