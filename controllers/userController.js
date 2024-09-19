const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const { constants } = require("../utils/constants");

const signToken = (id) =>
  jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "90d",
    }
  );

const generateOTP = () => {
  return crypto.randomInt(100000, 999999);
};

const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

exports.signup = catchAsync(async (req, res, next) => {
  const otp = generateOTP();

  const otpCodeMessage = `Your OTP code is ${otp}. It is valid for 10 minutes.`;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser && !existingUser.isVerified) {
    (existingUser.name = req.body.name),
      (existingUser.password = req.body.password);
    existingUser.otp = otp;
    existingUser.otpExpires = otpExpires;
    await existingUser.save();
    await sendEmail({
      email: existingUser.email,
      subject: "OTP Code",
      message: otpCodeMessage,
    });

    return res.status(201).json({
      status: constants.SUCCESS,
      message: "OTP sent to email. Please verify.",
      data: {
        user: {
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
      },
    });
  }
  if (existingUser) {
    return next(
      new AppError(
        "The email adddress is already in use. Please provide a different one",
        400
      )
    );
  }

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    otp,
    otpExpires,
  });

  await sendEmail({
    email,
    subject: "OTP Code",
    message: otpCodeMessage,
  });

  res.status(201).json({
    status: constants.SUCCESS,
    message: "OTP sent to email. Please verify.",
    data: {
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    },
  });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { otp, email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 400));
  }

  if (user.isVerified) {
    return next(new AppError("User already verified", 400));
  }

  if (user.otpExpires < Date.now() || user.otp !== otp) {
    return next(new AppError("Invalid or Expired OTP", 400));
  }
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
  res.status(200).json({
    status: constants.SUCCESS,
    message: "User verified successfully",
  });
});
exports.login = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  // 2. check if email and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // 3. if eveyrthing is ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: constants.SUCCESS,
    token,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: constants.SUCCESS,
    results: users.length,
    data: {
      users,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You're not logged in, Please log in to have access", 401)
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does no longer exist")
    );
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
