const { Worker } = require("bullmq");
const emailService = require("../Utils/emailService");
const logger = require("../Config/logger");
const { createTrackedBullMQConnection } = require("../Config/ioredis");

let emailWorker;

const startEmailWorker = () => {
  emailWorker = new Worker(
    "emailQueue",
    async (job) => {
      const { to, token, payload } = job.data;
      const type = job.name;
      const data = payload !== undefined ? payload : token;

      logger.info({ jobId: job.id, type, to, attempt: job.attemptsMade + 1 }, "Processing email job");

      switch (type) {
        case "verification":
          await emailService.sendVerificationEmail(to, typeof data === "string" ? data : data?.token);
          break;
        case "forgetPassword":
          await emailService.sendForgetPasswordEmail(to, typeof data === "string" ? data : data?.token);
          break;
        case "paymentInvoice":
        case "invoice":
          await emailService.sendPaymentInvoiceEmail(to, data);
          break;
        default:
          logger.warn({ jobId: job.id, type }, "Unknown email job type");
          throw new Error(`Unknown email job type: ${type}`);
      }
    },
    {
      connection: createTrackedBullMQConnection(),
      concurrency: 3, // معالجة 3 إيميلات في نفس الوقت
    }
  );

  // Event listeners
  emailWorker.on("completed", (job) => {
    logger.info({ jobId: job.id, type: job.name }, "Email job completed successfully");
  });

  emailWorker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, type: job?.name, to: job?.data?.to, err: err.message, attempts: job?.attemptsMade },
      "Email job failed"
    );
  });

  emailWorker.on("error", (err) => {
    // هذا يحدث عادةً لو Redis غير متصل — لا نوقف الخادم
    logger.warn({ err: err.message }, "Email worker connection error");
  });

  logger.info("Email worker started and listening for jobs");

  return emailWorker;
};

const stopEmailWorker = async () => {
  if (emailWorker) {
    await emailWorker.close();
    logger.info("Email worker stopped");
  }
};

module.exports = { startEmailWorker, stopEmailWorker };
