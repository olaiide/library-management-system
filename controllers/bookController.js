const Book = require("../models/bookModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { validationResult } = require("express-validator");
const { constants } = require("../utils/constants");

exports.addBook = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const newBook = await Book.create(req.body);
  res.status(201).json({
    status: constants.SUCCESS_TEXT,
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

  res.status(200).json({
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
  const book = await Book.findById(req.params.id);
  if (!book) {
    return next(new AppError("No book found with that ID", 404));
  }
  res.status(200).json({
    status: "Success",
    data: {
      book,
    },
  });
});
exports.updateBook = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  const id = req.params.id;
  const findBook = await Book.findById(id);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  if (!findBook) {
    return next(new AppError("No book found with that ID", 404));
  }
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: constants.SUCCESS_TEXT,
    data: {
      book,
    },
  });
});
exports.deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    return next(new AppError("No book found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
exports.borrowBook = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const book = await Book.findById(id);
  if (!book) {
    return next(new AppError("No book found with that ID", 404));
  }
  if (book.available === false) {
    return next(new AppError("Book already borrowed", 400));
  }
  book.available = false;

  await book.save();

  const responseBook = book.toObject();
  delete responseBook.available;

  res.status(200).json({
    status: constants.SUCCESS_TEXT,
    message: "Book borrowed successfully",
    data: {
      book: responseBook,
    },
  });
});
exports.returnBook = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const book = await Book.findById(id);
  if (!book) {
    return next(new AppError("No book found with that ID", 404));
  }
  if (book.available === true) {
    return next(new AppError("Book has not been borrowed", 400));
  }
  book.available = true;
  await book.save();

  res.status(200).json({
    status: constants.SUCCESS_TEXT,
    message: "Book returned successfully",
    data: {
      book,
    },
  });
});
