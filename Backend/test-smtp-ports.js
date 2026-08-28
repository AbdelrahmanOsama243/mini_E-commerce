require('dotenv').config();
const nodemailer = require('nodemailer');

const portsToTest = [
  { port: 587, secure: false, name: "Port 587 (STARTTLS - Recommended)" },
  { port: 465, secure: true,  name: "Port 465 (SSL/TLS)" },
  { port: 2525, secure: false, name: "Port 2525 (Alternative)" },
  { port: 25, secure: false, name: "Port 25 (Standard)" },
];

async function testAllPorts() {
  console.log("==================================================");
  console.log("🔍 Testing Mailtrap connection on different ports...");
  console.log("Host:", process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io");
  console.log("User:", process.env.SMTP_USER);
  console.log("==================================================\n");

  for (const item of portsToTest) {
    process.stdout.write(`Testing ${item.name}... `);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: item.port,
      secure: item.secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 7000,
    });

    try {
      await transporter.verify();
      console.log(`✅ SUCCESS! Connected on port ${item.port}`);
    } catch (err) {
      console.log(`❌ FAILED (${err.code || err.message})`);
    }
  }

  console.log("\n==================================================");
  console.log("💡 Tip: Use whichever port has ✅ SUCCESS in your .env file as SMTP_PORT");
  console.log("==================================================");
}

testAllPorts();
