const nodemailer = require("nodemailer");
const logger = require("../Config/logger");
require("dotenv").config();

let cachedTransporter = null;

const createTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const isSecure = port === 465;

    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: port,
      secure: isSecure,
      pool: true, // Reuse SMTP connection pool for fast instant sending
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
    });
  } else {
    // Fallback for development using Ethereal Email
    logger.info("No SMTP credentials found in .env, generating ethereal test account...");
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return cachedTransporter;
};

const sendVerificationEmail = async (userEmail, token) => {
  try {
    const transporter = await createTransporter();
    const clientUrl = process.env.FRONTEND_URL || "http://localhost:4200";
    const verificationLink = `${clientUrl}/verify-email/${token}`;

    const mailOptions = {
      from: '"Koshk Store" <noreply@koshkstore.com>',
      to: userEmail,
      subject: "Verify your Koshk Store Account | تأكيد حسابك في كشك ستور",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #fcfcfc; border: 2px solid #000; box-shadow: 4px 4px 0px #000; border-radius: 4px;">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #000; font-size: 26px; font-weight: 900; text-transform: uppercase; margin: 0;">Koshk Store</h1>
            <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">كشك ستور — بوابتك للتسوق العصري</p>
          </div>
          <h2 style="color: #000; font-size: 20px; font-weight: 800; text-transform: uppercase;">Welcome to Koshk Store! / أهلاً بك معنا</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">Thank you for registering. Please confirm your email address by clicking the button below:</p>
          <p style="color: #333; font-size: 15px; line-height: 1.6; direction: rtl; text-align: right;">شكراً لتسجيلك. يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background-color: #000; color: #fff; text-decoration: none; font-weight: 900; font-size: 16px; text-transform: uppercase; border: 2px solid #000; box-shadow: 3px 3px 0px #e11d48;">Verify Email / تأكيد الحساب</a>
          </div>
          
          <p style="color: #666; font-size: 13px; margin-top: 24px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ to: userEmail, messageId: info.messageId }, "Verification email sent successfully");

    if (!process.env.SMTP_USER) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Ethereal preview URL");
    }

    return true;
  } catch (error) {
    logger.error({ err: error, to: userEmail }, "Error sending verification email");
    throw new Error("Failed to send verification email.");
  }
};

const sendForgetPasswordEmail = async (userEmail, token) => {
  try {
    const transporter = await createTransporter();
    const clientUrl = process.env.FRONTEND_URL || "http://localhost:4200";
    const resetLink = `${clientUrl}/reset-password/${token}`;

    const mailOptions = {
      from: '"Koshk Store" <noreply@koshkstore.com>',
      to: userEmail,
      subject: "Reset your Koshk Store Password | استعادة كلمة المرور",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #fcfcfc; border: 2px solid #000; box-shadow: 4px 4px 0px #000; border-radius: 4px;">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #000; font-size: 26px; font-weight: 900; text-transform: uppercase; margin: 0;">Koshk Store</h1>
          </div>
          <h2 style="color: #000; font-size: 20px; font-weight: 800; text-transform: uppercase;">Reset Your Password / استعادة كلمة المرور</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #000; color: #fff; text-decoration: none; font-weight: 900; font-size: 16px; text-transform: uppercase; border: 2px solid #000; box-shadow: 3px 3px 0px #2563eb;">Reset Password / تغيير كلمة المرور</a>
          </div>
          
          <p style="color: #666; font-size: 13px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ to: userEmail, messageId: info.messageId }, "Password reset email sent successfully");

    if (!process.env.SMTP_USER) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Ethereal preview URL");
    }

    return true;
  } catch (error) {
    logger.error({ err: error, to: userEmail }, "Error sending password reset email");
    throw new Error("Failed to send password reset email.");
  }
};

/**
 * Send Payment Invoice / Receipt Email (فاتورة دفع)
 * @param {string} userEmail - Recipient email
 * @param {object} invoiceData - Invoice & Order details
 */
const sendPaymentInvoiceEmail = async (userEmail, invoiceData = {}) => {
  try {
    const transporter = await createTransporter();
    const clientUrl = process.env.FRONTEND_URL || "http://localhost:4200";

    const {
      orderId = "N/A",
      customerName = "Customer",
      items = [],
      totalPrice = 0,
      paymentMethod = "card",
      paymentStatus = "paid",
      shippingAddress = "N/A",
      transactionId = null,
      fawryRef = null,
      createdAt = new Date(),
    } = invoiceData;

    const formattedDate = new Date(createdAt).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const paymentMethodMap = {
      card: "بطاقة بنكية (Credit / Debit Card)",
      wallet: "محفظة إلكترونية (E-Wallet)",
      kiosk: "أمان / فوري (Fawry / Kiosk)",
      valu: "شراء بالتقسيط (valU)",
      cod: "الدفع عند الاستلام (Cash on Delivery)",
    };

    const isPaid = paymentStatus === "paid";
    const statusBadgeText = isPaid ? "مدفوع بنجاح / Paid" : "قيد التنفيذ / Pending";
    const statusBadgeBg = isPaid ? "#16a34a" : "#ca8a04";

    const safeItems = Array.isArray(items) ? items : [];
    const itemsRows = safeItems
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-weight: bold; color: #1f2937;">${item?.name || item?.productId?.name || "Product"}</td>
          <td style="padding: 12px 8px; text-align: center; color: #4b5563;">x${item?.quantity || 1}</td>
          <td style="padding: 12px 8px; text-align: right; color: #4b5563;">${(item?.priceAtPurchase || item?.price || 0).toLocaleString()} EGP</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #111827;">${(((item?.priceAtPurchase || item?.price || 0)) * (item?.quantity || 1)).toLocaleString()} EGP</td>
        </tr>
      `
      )
      .join("");

    const orderIdStr = orderId.toString();
    const displayOrderId = orderIdStr.length > 6 ? orderIdStr.slice(-6).toUpperCase() : orderIdStr;

    const mailOptions = {
      from: '"Koshk Store" <billing@koshkstore.com>',
      to: userEmail,
      subject: `🧾 فاتورة دفع طلبك #${displayOrderId} | Koshk Store Invoice`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 3px solid #000; box-shadow: 6px 6px 0px #000; border-radius: 6px;">
          
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000; padding-bottom: 18px; margin-bottom: 20px;">
            <div>
              <h1 style="color: #000; font-size: 26px; font-weight: 900; text-transform: uppercase; margin: 0;">Koshk Store</h1>
              <p style="color: #555; font-size: 13px; margin: 4px 0 0 0;">فاتورة شراء وإشعار استلام دفع</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background-color: ${statusBadgeBg}; color: #ffffff; padding: 6px 14px; font-weight: 800; font-size: 13px; text-transform: uppercase; border-radius: 3px; border: 1px solid #000;">
                ${statusBadgeText}
              </span>
            </div>
          </div>

          <!-- Greeting & Order Info -->
          <div style="margin-bottom: 20px;">
            <p style="font-size: 16px; color: #111827; margin: 0 0 8px 0;">مرحباً <strong>${customerName}</strong>،</p>
            <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px 0; line-height: 1.5;">
              شكراً لتسوقك من كشك ستور! تم تسجيل طلبك بنجاح وهذه هي الفاتورة الرسمية لطلبك.
            </p>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 14px; margin-bottom: 20px;">
              <table style="width: 100%; font-size: 13px; line-height: 1.8;">
                <tr>
                  <td style="color: #6b7280; width: 40%;">رقم الطلب (Order ID):</td>
                  <td style="font-weight: 800; color: #111827; font-family: monospace;">#${orderIdStr}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">تاريخ الفاتورة (Date):</td>
                  <td style="color: #111827;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">طريقة الدفع (Payment Method):</td>
                  <td style="font-weight: 600; color: #111827;">${paymentMethodMap[paymentMethod] || paymentMethod}</td>
                </tr>
                ${
                  transactionId
                    ? `<tr>
                    <td style="color: #6b7280;">رقم المعاملة (Transaction ID):</td>
                    <td style="font-family: monospace; color: #111827;">${transactionId}</td>
                  </tr>`
                    : ""
                }
                ${
                  fawryRef
                    ? `<tr>
                    <td style="color: #6b7280;">رقم مرجع فوري (Fawry Ref):</td>
                    <td style="font-weight: 800; font-size: 15px; color: #2563eb; font-family: monospace;">${fawryRef}</td>
                  </tr>`
                    : ""
                }
                <tr>
                  <td style="color: #6b7280;">عنوان التوصيل (Shipping):</td>
                  <td style="color: #111827;">${shippingAddress}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <thead>
              <tr style="background-color: #f3f4f6; border-bottom: 2px solid #000; text-align: left;">
                <th style="padding: 10px 8px; font-weight: 800; color: #000;">المنتج (Item)</th>
                <th style="padding: 10px 8px; text-align: center; font-weight: 800; color: #000;">الكمية (Qty)</th>
                <th style="padding: 10px 8px; text-align: right; font-weight: 800; color: #000;">السعر (Unit)</th>
                <th style="padding: 10px 8px; text-align: right; font-weight: 800; color: #000;">الإجمالي (Total)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
            <table style="width: 280px; font-size: 14px; line-height: 2;">
              <tr>
                <td style="color: #6b7280;">المجموع الفرعي:</td>
                <td style="text-align: right; font-weight: 600; color: #111827;">${Number(totalPrice).toLocaleString()} EGP</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">الشحن:</td>
                <td style="text-align: right; font-weight: 600; color: #16a34a;">مجاني (Free)</td>
              </tr>
              <tr style="border-top: 2px solid #000;">
                <td style="font-weight: 900; font-size: 16px; color: #000;">الإجمالي النهائي:</td>
                <td style="text-align: right; font-weight: 900; font-size: 18px; color: #000;">${Number(totalPrice).toLocaleString()} EGP</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="${clientUrl}/orders/${orderIdStr}" style="display: inline-block; padding: 14px 30px; background-color: #000000; color: #ffffff; text-decoration: none; font-weight: 900; font-size: 15px; text-transform: uppercase; border: 2px solid #000; box-shadow: 4px 4px 0px #16a34a;">
              متابعة حالة الطلب / View Order Details
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0 0 4px 0;">إذا كان لديك أي استفسار، تواصل مع فريق الدعم عبر support@koshkstore.com</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Koshk Store. All rights reserved.</p>
          </div>

        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ to: userEmail, orderId: orderIdStr, messageId: info.messageId }, "Payment invoice email sent successfully");

    if (!process.env.SMTP_USER) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Ethereal preview URL");
    }

    return true;
  } catch (error) {
    logger.error({ err: error, to: userEmail, orderId: invoiceData?.orderId }, "Error sending payment invoice email");
    throw new Error("Failed to send payment invoice email.");
  }
};

module.exports = {
  createTransporter,
  sendVerificationEmail,
  sendForgetPasswordEmail,
  sendPaymentInvoiceEmail,
};
