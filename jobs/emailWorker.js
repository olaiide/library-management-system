const { Worker } = require("bullmq");
const BorrowedBook = require("../models/borrowingHistoryModel");
const sendEmail = require("../utils/email");

const daysBeforeDue = 7;
const emailWorker = new Worker(
  "sendEmailReminder",
  async () => {
    const dueBooks = await BorrowedBook.find({
      expectedReturnDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + daysBeforeDue * 24 * 60 * 60 * 1000),
      },
      returnedAt: { $exists: false },
    })
      .populate("borrowedBy", "email name")
      .populate("book", "title");

    for (const book of dueBooks) {
      try {
        await sendEmail({
          email: book.borrowedBy.email,
          subject: "📅 Friendly Reminder: Book Return Due Soon",
          template: "returnReminder",
          context: {
            name: book.borrowedBy.name,
            bookTitle: book.book.title,
            expectedReturnDate: book.expectedReturnDate.toDateString(),
          },
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    const overdueBooks = await BorrowedBook.find({
      expectedReturnDate: { $lt: new Date() },
      returnedAt: { $exists: false },
    })
      .populate("borrowedBy", "email name")
      .populate("book", "title");

    for (const book of overdueBooks) {
      try {
        await sendEmail({
          email: book.borrowedBy.email,
          subject: "🚨 Overdue Alert: Please Return Your Book",
          template: "overdueReminder",
          context: {
            name: book.borrowedBy.name,
            bookTitle: book.book.title,
            expectedReturnDate: book.expectedReturnDate.toDateString(),
          },
        });
      } catch (error) {
        console.error("Error sending email:", error);
      }
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
    lockDuration: 900000,
  }
);

module.exports = emailWorker;
