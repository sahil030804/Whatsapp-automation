const { Queue, Worker } = require("bullmq");
const Redis = require("ioredis");
const { redis: redisConfig, bullmq } = require("../config");
const { logger } = require("../lib/logger");

const connection = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password || undefined,
  db: redisConfig.db,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("error", (err) => {
  logger.error({ err }, "BullMQ Redis connection error");
});

const QUEUES = {
  documentProcessing: {
    name: "document-processing",
    concurrency: bullmq.concurrencyDocument,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  },
  messageProcessing: {
    name: "message-processing",
    concurrency: bullmq.concurrencyMessage,
    defaultJobOptions: {
      attempts: 1,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  },
  tokenRefresh: {
    name: "token-refresh",
    concurrency: 1,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "fixed", delay: 60000 },
      removeOnComplete: true,
      removeOnFail: 50,
    },
  },
};

function createQueue(config) {
  return new Queue(config.name, {
    connection,
    defaultJobOptions: config.defaultJobOptions,
  });
}

function createWorker(queueName, processor, concurrency) {
  return new Worker(queueName, processor, {
    connection,
    concurrency,
    limiter: {
      max: queueName === "document-processing" ? 2 : 30,
      duration: 60000,
    },
  });
}

const queues = {};

for (const [key, config] of Object.entries(QUEUES)) {
  queues[key] = createQueue(config);
}

async function startWorkers() {
  const workers = {};

  try {
    const processor = require("./workers/document-processing.worker");
    const worker = createWorker(
      "document-processing",
      processor,
      QUEUES.documentProcessing.concurrency,
    );
    worker.on("active", (job) => {
      logger.info(
        { jobId: job.id, data: job.data },
        "Document processing job started",
      );
    });
    worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Document processing job completed");
    });
    worker.on("failed", (job, err) => {
      logger.error({ err, jobId: job.id }, "Document processing job failed");
    });
    workers.documentProcessingWorker = worker;
  } catch (err) {
    logger.error({ err }, "Failed to start document-processing worker");
  }

  try {
    const processor = require("./workers/message-processing.worker");
    const worker = createWorker(
      "message-processing",
      processor,
      QUEUES.messageProcessing.concurrency,
    );
    worker.on("active", (job) => {
      logger.info(
        { jobId: job.id, data: job.data },
        "Message processing job started",
      );
    });
    worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Message processing job completed");
    });
    worker.on("failed", (job, err) => {
      logger.error({ err, jobId: job.id }, "Message processing job failed");
    });
    workers.messageProcessingWorker = worker;
  } catch (err) {
    logger.error({ err }, "Failed to start message-processing worker");
  }

  try {
    const processor = require("./workers/token-refresh.worker");
    const worker = createWorker(
      "token-refresh",
      processor,
      QUEUES.tokenRefresh.concurrency,
    );
    worker.on("active", (job) => {
      logger.info(
        { jobId: job.id, name: job.name },
        "Token refresh job started",
      );
    });
    worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Token refresh job completed");
    });
    worker.on("failed", (job, err) => {
      logger.error({ err, jobId: job.id }, "Token refresh job failed");
    });
    workers.tokenRefreshWorker = worker;
  } catch (err) {
    logger.error({ err }, "Failed to start token-refresh worker");
  }

  logger.info("BullMQ workers started");

  return workers;
}

async function registerRepeatableJobs() {
  const tokenQueue = queues.tokenRefresh;
  const repeatableJobs = await tokenQueue.getRepeatableJobs();

  const exists = repeatableJobs.some((j) => j.name === "refresh-all-tokens");

  if (!exists) {
    await tokenQueue.add(
      "refresh-all-tokens",
      {},
      {
        repeat: { pattern: "0 */6 * * *" },
        jobId: "refresh-all-tokens",
      },
    );
    logger.info("Registered repeatable job: refresh-all-tokens");
  }
}

async function closeAll() {
  for (const queue of Object.values(queues)) {
    await queue.close();
  }
  await connection.quit();
}

module.exports = {
  queues,
  connection,
  startWorkers,
  registerRepeatableJobs,
  closeAll,
};
