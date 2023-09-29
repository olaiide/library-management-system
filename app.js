const express = require("express");
const morgan = require("morgan");
const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const bookRouter = require("./routes/bookRoute");
const userRoute = require("./routes/userRoute");

// MIDDLEWARE
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/users", userRoute);
// app.use((req, res, next) => {
//   const error = new HttpError("Could not find this route.", 404);
//   throw error;
// });

//app.use(ErrorHandler);
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
module.exports = app;
