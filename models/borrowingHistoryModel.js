const mongoose = require("mongoose");
const borrowingHistorySchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.ObjectId,
    ref: "Book",
    required: true,
  },
  borrowedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  expectedReturnDate: {
    type: Date,
    required: true,
  },
  returnedAt: {
    type: Date,
  },
});
const BorrowingHistory = mongoose.model(
  "BorrowingHistory",
  borrowingHistorySchema
);

module.exports = BorrowingHistory;
