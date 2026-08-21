const nodemailer = require("nodemailer");
const logger = require("../Config/logger");
require("dotenv").config();

const createTransporter = async () => {
  let transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback for development using Ethereal Email
    logger.info("No SMTP credentials found in .env, generating ethereal test account...");
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
};

const sendVerificationEmail = async (userEmail, token) => {
  try {
    const transporter = await createTransporter();

    const verificationLink = `http://localhost:4200/verify-email/${token}`; // Adjust port to match Angular

    const mailOptions = {
      from: '"Koshk Store" <noreply@koshkstore.com>',
      to: userEmail,
      subject: "Verify your Koshk Store Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2ddd4; border-radius: 8px;">
          <h2 style="color: #ffb4aa; text-transform: uppercase;">Welcome to Koshk Store!</h2>
          <p style="color: #1a1a1a;">Thank you for registering. Please confirm your email address by clicking the button below:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px;">Verify Email</a>
          <p style="color: #1a1a1a;">This link will expire in 24 hours.</p>
          <p style="color: #4a4a4a; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ to: userEmail }, "Verification email sent successfully");

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

    const resetLink = `http://localhost:4200/reset-password/${token}`; // Adjust port to match Angular

    const mailOptions = {
      from: '"Koshk Store" <noreply@koshkstore.com>',
      to: userEmail,
      subject: "Reset your Koshk Store Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2ddd4; border-radius: 8px;">
          <h2 style="color: #ffb4aa; text-transform: uppercase;">Reset Your Password</h2>
          <p style="color: #1a1a1a;">We received a request to reset your password. Please click the button below to choose a new password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px;">Reset Password</a>
          <p style="color: #1a1a1a;">This link will expire in 1 hour.</p>
          <p style="color: #4a4a4a; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ to: userEmail }, "Password reset email sent successfully");

    if (!process.env.SMTP_USER) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Ethereal preview URL");
    }

    return true;
  } catch (error) {
    logger.error({ err: error, to: userEmail }, "Error sending password reset email");
    throw new Error("Failed to send password reset email.");
  }
};

module.exports = {
  sendVerificationEmail,
  sendForgetPasswordEmail,
};
