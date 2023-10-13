const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const validator = require("validator");

const signToken = (id) =>
  jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
exports.signup = catchAsync(async (req, res, next) => {
  if (!req.body.passwordConfirm) {
    return next(new AppError("Please, confirm password", 400));
  }
  if (!validator.isLength(req.body.passwordConfirm, { min: 8 })) {
    return next(
      new AppError("Password confirm must not be less than 8 in length ")
    );
  }
  if (req.body.password !== req.body.passwordConfirm) {
    return next(new AppError("Passwords do not match", 400));
  }
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1. check if email and password is not empty
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // 2. check if email and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // 3. if eveyrthing is ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});
