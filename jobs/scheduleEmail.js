const emailQueue = require("./emailQueue");

async function scheduleEmailJob() {
  const jobId = "email-every-day";
  const existingJob = await emailQueue.getJobSchedulers();
  if (existingJob.some((job) => job.id === jobId)) {
    await emailQueue.removeJobScheduler(existingJob[0].key);
  }
  await emailQueue.add(
    "sendEmail",
    {},
    {
      jobId,
      repeat: {
        pattern: "0 9 * * *",
      },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}

module.exports = scheduleEmailJob;
