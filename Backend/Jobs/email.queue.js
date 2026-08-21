/**
 * Email Queue — BullMQ
 * 
 * العمليات التي يتم تشغيلها في الخلفية:
 * 
 * 1. إرسال بريد تفعيل الحساب (sendVerificationEmail)
 *    السبب: الاتصال بخوادم SMTP خارجية قد يستغرق 1-5 ثوانٍ.
 *    نقلها للخلفية يجعل استجابة /register فورية للمستخدم.
 * 
 * 2. إرسال بريد استعادة كلمة المرور (sendForgetPasswordEmail)
 *    السبب: نفس السبب — اتصال خارجي بطيء + إمكانية إعادة المحاولة
 *    تلقائياً لو فشل الإرسال (مثلاً لو خادم SMTP مشغول).
 * 
 * 3. إعادة إرسال بريد التفعيل (resendVerificationEmail)
 *    السبب: نسخة مكررة من العملية الأولى بنفس الأسباب.
 * 
 * لماذا هذه العمليات بالذات؟
 * - لأنها عمليات I/O خارجية (External Network Call) لا تؤثر على نتيجة الطلب.
 * - المستخدم لا يحتاج أن ينتظر نجاح الإرسال ليرى رسالة "تم التسجيل".
 * - لو فشلت، BullMQ يعيد المحاولة تلقائياً (3 مرات) بدون تدخل.
 * - تفريغ الخادم من العمليات الثقيلة يحسن الأداء بشكل كبير.
 */

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
 * @param {'verification' | 'forgetPassword'} type - نوع الإيميل
 * @param {string} to - عنوان البريد الإلكتروني
 * @param {string} token - التوكن المرفق بالرابط
 */
const addEmailJob = async (type, to, token) => {
  try {
    const job = await emailQueue.add(type, { to, token }, {
      priority: type === "forgetPassword" ? 1 : 2, // إعادة كلمة المرور أولوية أعلى
    });
    logger.info({ jobId: job.id, type, to }, "Email job added to queue");
    return job;
  } catch (error) {
    // Fallback: إذا كان Redis غير متصل، أرسل الإيميل مباشرة
    logger.warn({ err: error, type, to }, "Queue unavailable — falling back to direct send");
    const emailService = require("../Utils/emailService");
    if (type === "verification") {
      await emailService.sendVerificationEmail(to, token);
    } else if (type === "forgetPassword") {
      await emailService.sendForgetPasswordEmail(to, token);
    }
  }
};

module.exports = { emailQueue, addEmailJob, queueConnection };
