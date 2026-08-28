const { Queue } = require("bullmq");
const logger = require("../Config/logger");
const { createTrackedBullMQConnection } = require("../Config/ioredis");

const queueConnection = createTrackedBullMQConnection();

const emailQueue = new Queue("emailQueue", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,              // إعادة المحاولة 3 مرات لو فشل
    backoff: {
      type: "exponential",    // الانتظار يتضاعف بين كل محاولة
      delay: 3000,            // 3 ثوانٍ → 6 ثوانٍ → 12 ثانية
    },
    removeOnComplete: true,   // حذف المهمة من الطابور بعد النجاح
    removeOnFail: false,      // الاحتفاظ بالمهام الفاشلة للمراجعة
  },
});

/**
 * إضافة مهمة إرسال إيميل للطابور
 * @param {'verification' | 'forgetPassword' | 'paymentInvoice'} type - نوع الإيميل
 * @param {string} to - عنوان البريد الإلكتروني
 * @param {string | object} payload - التوكن أو بيانات الفاتورة
 */
const addEmailJob = async (type, to, payload) => {
  try {
    const job = await emailQueue.add(
      type,
      { to, payload, token: typeof payload === "string" ? payload : payload?.token },
      {
        priority: type === "forgetPassword" ? 1 : type === "paymentInvoice" ? 2 : 3,
      }
    );
    logger.info({ jobId: job.id, type, to }, "Email job added to queue");
    return job;
  } catch (error) {
    // Fallback: إذا كان Redis غير متصل، أرسل الإيميل مباشرة
    logger.warn({ err: error, type, to }, "Queue unavailable — falling back to direct send");
    const emailService = require("../Utils/emailService");
    if (type === "verification") {
      await emailService.sendVerificationEmail(to, typeof payload === "string" ? payload : payload?.token);
    } else if (type === "forgetPassword") {
      await emailService.sendForgetPasswordEmail(to, typeof payload === "string" ? payload : payload?.token);
    } else if (type === "paymentInvoice") {
      await emailService.sendPaymentInvoiceEmail(to, payload);
    }
  }
};

module.exports = { emailQueue, addEmailJob, queueConnection };
