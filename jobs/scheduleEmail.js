const emailQueue = require("./emailQueue");

async function scheduleEmailJob() {
  const jobId = "daily-email-reminder";

  await emailQueue.add(
    "sendEmailReminder",
    {},
    {
      jobId,
      repeat: {
        pattern: "0 9 * * *", // Send email every day at 9:00 AM
      },
    }
  );
}

module.exports = scheduleEmailJob;
