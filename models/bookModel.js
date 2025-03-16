const mongoose = require("mongoose");
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A book must have a title"],
    unique: true,
    trim: true,
    minLength: [5, "A book title must have more than 5 characters"],
  },
  genre: {
    type: String,
    required: [true, "A book must have a genre"],
  },
  author: {
    type: String,
    required: [true, "A book must have an author"],
  },
  overview: {
    type: String,
    required: [true, "A book must have a overview"],
    minLength: [15, "A book must not have an overview less than 15 characters"],
  },
  ISBN: {
    type: Number,
    required: [true, "A book must have an Isbn number"],
    validate: {
      validator: function (val) {
        return val.toString().length === 13;
      },
      message: "ISBN number must be 13 in length",
    },
  },
  available: {
    type: Boolean,
    default: true,
  },
  dateAdded: {
    type: Date,
    default: Date.now(),
  },
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
