const Book = require("../models/bookModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { validationResult } = require("express-validator");

exports.addBook = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const newBook = await Book.create(req.body);
  res.status(201).json({
    status: "Success",
    data: {
      book: newBook,
    },
  });
});
exports.getAllBooks = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  const books = await Book.find().skip(skip).limit(limit);
  const totalItems = await Book.countDocuments();
  if (req.query.page) {
    if (skip >= totalItems)
      return next(new AppError("This page does not exist", 404));
  }
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
  if (!findBook) {
    return next(new AppError("No book found with that ID", 404));
  }
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "Success",
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
