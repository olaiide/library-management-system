const { Worker, tryCatch } = require("bullmq");
const Book = require("../models/bookModel");
const sendEmail = require("../utils/email");

const emailWorker = new Worker(
  "sendEmailReminder",
  async () => {
    const dueBooks = await Book.find({
      expectedReturnDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      available: false,
    }).populate("borrowedBy", "email name");

    for (const book of dueBooks) {
      if (book.borrowedBy) {
        try {
          await sendEmail({
            email: book.borrowedBy.email,
            subject: "📅 Friendly Reminder: Book Return Due Soon",
            template: "returnReminder",
            context: {
              name: book.borrowedBy.name,
              bookTitle: book.title,
              expectedReturnDate: book.expectedReturnDate.toDateString(),
            },
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }
    }

    const overdueBooks = await Book.find({
      expectedReturnDate: { $lt: new Date() },
      available: false,
    }).populate("borrowedBy", "email name");

    for (const book of overdueBooks) {
      if (book.borrowedBy) {
        try {
          await sendEmail({
            email: book.borrowedBy.email,
            subject: "🚨 Overdue Alert: Please Return Your Book",
            template: "overdueReminder",
            context: {
              name: book.borrowedBy.name,
              bookTitle: book.title,
              expectedReturnDate: book.expectedReturnDate.toDateString(),
            },
          });
        } catch (error) {
          console.error("Error sending email:", error);
        }
      }
    }
  },
  { connection: { host: "localhost", port: 6379 }, lockDuration: 900000 }
);

module.exports = emailWorker;
