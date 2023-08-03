const Book = require("../models/bookModel");

exports.addBook = async (req, res, next) => {
  try {
    const newBook = await Book.create(req.body);
    res.status(201).json({
      status: "Success",
      data: {
        book: newBook,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "Fail",
      errorMessage: err,
    });
  }
};
