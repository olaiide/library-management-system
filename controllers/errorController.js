const AppError = require("./../utils/appError");
const { statusCodes } = require("../utils/constants");
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, statusCodes.BAD_REQUEST);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate ${Object.keys(err.keyValue).map(
    (el) => el
  )} value: ${
    err.keyValue.title || err.keyValue.email
  }. Please use another value!`;
  return new AppError(message, statusCodes.BAD_REQUEST);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, statusCodes.BAD_REQUEST);
};

const handleJWTError = () =>
  new AppError("Invalid token, Please log in again", statusCodes.UNAUTHORIZED);

const handleInvalidTokenError = () =>
  new AppError("Token Expired, Please log in again", statusCodes.UNAUTHORIZED);

const sendError = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 2) Send error
    res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Something went very wrong!",
      err: err,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || "error";

  if (err.name === "CastError") err = handleCastErrorDB(err);
  if (err.code === 11000) err = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") err = handleValidationErrorDB(err);
  if (err.name === "JsonWebTokenError") err = handleJWTError();
  if (err.name === "TokenExpiredError") err = handleInvalidTokenError();
  sendError(err, res);
};
