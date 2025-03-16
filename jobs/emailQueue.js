const { Queue } = require("bullmq");

const emailQueue = new Queue("sendEmailReminder", {
  connection: { host: "localhost", port: 6379 },
});

module.exports = emailQueue;

//  host: process.env.REDIS_HOST,
//     port: process.env.REDIS_PORT,
//     password: process.env.REDIS_PASSWORD,
//     tls: {},
