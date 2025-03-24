const mongoose = require("mongoose");
const Book = require("../models/bookModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { validationResult } = require("express-validator");
const { constants, statusCodes } = require("../utils/constants");
const BorrowingHistory = require("../models/borrowingHistoryModel");

exports.addBook = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(statusCodes.BAD_REQUEST).json({ errors: errors.array() });
  }
  const newBook = await Book.create(req.body);
  res.status(statusCodes.CREATED).json({
    status: constants.SUCCESS,
    data: {
      book: newBook,
    },
  });
});
exports.getAllBooks = catchAsync(async (req, res, next) => {
  const queryObj = {};

  if (req.query.ISBN) queryObj.ISBN = req.query.ISBN;
  if (req.query.genre) queryObj.genre = req.query.genre;

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  // Initialize the query with filtering
  let query = Book.find(JSON.parse(queryStr));

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  // Execute the query
  const books = await query;
  const totalItems = await Book.countDocuments(JSON.parse(queryStr));

  res.status(statusCodes.OK).json({
    status: "Success",
    results: books.length,
    data: {
      books,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    },
  });
});

exports.getBook = catchAsync(async (req, res, next) => {
  const { id: bookId } = req.params;
  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }
  const book = await Book.findById(bookId);

  if (!book) {
    return next(
      new AppError("No book found with that ID", statusCodes.NOT_FOUND)
    );
  }
  res.status(statusCodes.OK).json({
    status: "Success",
    data: {
      book,
    },
  });
});
exports.updateBook = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  const bookId = req.params.id;
  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }
  const findBook = await Book.findById(bookId);
  if (!errors.isEmpty()) {
    return res.status(statusCodes.BAD_REQUEST).json({ errors: errors.array() });
  }
  if (!findBook) {
    return next(
      new AppError("No book found with that ID", statusCodes.NOT_FOUND)
    );
  }
  const book = await Book.findByIdAndUpdate(bookId, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(statusCodes.OK).json({
    status: constants.SUCCESS,
    data: {
      book,
    },
  });
});
exports.deleteBook = catchAsync(async (req, res, next) => {
  const { id: bookId } = req.params;
  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }
  const book = await Book.findByIdAndDelete(bookId);
  if (!book) {
    return next(
      new AppError("No book found with that ID", statusCodes.NOT_FOUND)
    );
  }
  res.status(statusCodes.NO_CONTENT).json({
    status: "success",
    data: null,
  });
});
exports.borrowBook = catchAsync(async (req, res, next) => {
  const { id: bookId } = req.params;
  const { returnDate } = req.query;
  const userId = req.user.id;

  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }
  const book = await Book.findById(bookId);
  if (!returnDate || isNaN(new Date(returnDate))) {
    return next(
      new AppError(
        "Please provide a valid return date",
        statusCodes.BAD_REQUEST
      )
    );
  }
  if (new Date(returnDate) <= new Date()) {
    return next(
      new AppError("Return date must be in the future", statusCodes.BAD_REQUEST)
    );
  }
  if (!book) {
    return next(
      new AppError("No book found with that ID", statusCodes.NOT_FOUND)
    );
  }
  if (!book.available) {
    return next(new AppError("Book already borrowed", statusCodes.BAD_REQUEST));
  }
  book.available = false;
  await BorrowingHistory.create({
    book: bookId,
    borrowedBy: userId,
    expectedReturnDate: new Date(returnDate),
  });
  await book.save();
  const responseBook = book.toObject();
  delete responseBook.available;

  res.status(statusCodes.OK).json({
    status: constants.SUCCESS,
    message: "Book borrowed successfully",
    data: {
      book: responseBook,
    },
  });
});
exports.returnBook = catchAsync(async (req, res, next) => {
  const bookId = req.params.id;
  const userId = req.user.id;
  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }
  const book = await Book.findById(bookId);
  if (!book) {
    return next(
      new AppError("No book found with that ID", statusCodes.NOT_FOUND)
    );
  }
  if (book.available) {
    return next(
      new AppError("Book has not been borrowed", statusCodes.BAD_REQUEST)
    );
  }
  const borrowRecord = await BorrowingHistory.findOne({
    book: bookId,
    borrowedBy: userId,
    returnedAt: null,
  });

  if (!borrowRecord) {
    return next(
      new AppError("No active borrow record found", statusCodes.BAD_REQUEST)
    );
  }

  book.available = true;
  borrowRecord.returnedAt = new Date();
  borrowRecord.status = "Returned";

  await Promise.all([book.save(), borrowRecord.save()]);

  res.status(statusCodes.OK).json({
    status: constants.SUCCESS,
    message: "Book returned successfully",
    data: {
      book,
      expectedReturnDate: borrowRecord.expectedReturnDate,
      returnedAt: borrowRecord.returnedAt,
    },
  });
});
exports.reportLostBook = catchAsync(async (req, res, next) => {
  const bookId = req.params.id;
  const userId = req.user.id;

  if (!mongoose.isValidObjectId(bookId)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  const book = await Book.findById(bookId);
  if (!book) {
    return next(
      new AppError("No book found with that ID", statusCodes.NOT_FOUND)
    );
  }

  if (book.available) {
    return next(
      new AppError(
        "This book is not currently borrowed",
        statusCodes.BAD_REQUEST
      )
    );
  }
  const borrowRecord = await BorrowingHistory.findOne({
    book: bookId,
    borrowedBy: userId,
    returnedAt: null,
  });

  if (!borrowRecord) {
    return next(
      new AppError("No active borrow record found", statusCodes.BAD_REQUEST)
    );
  }

  if (borrowRecord.status === "Lost") {
    return next(
      new AppError(
        "This book has already been marked as lost",
        statusCodes.BAD_REQUEST
      )
    );
  }
  borrowRecord.status = "Lost";
  book.available = false;
  await Promise.all([book.save(), borrowRecord.save()]);
  res.status(statusCodes.OK).json({
    status: constants.SUCCESS,
    message: "Book has been reported as lost",
    data: {
      book,
    },
  });
});
