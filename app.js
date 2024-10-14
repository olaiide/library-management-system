const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const { engine } = require("express-handlebars");
const AppError = require("./utils/appError");
const { statusCodes } = require("./utils/constants");
const globalErrorHandler = require("./controllers/errorController");
const bookRouter = require("./routes/bookRoute");
const userRoute = require("./routes/userRoute");

// MIDDLEWARE
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  next();
});

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.use("/api/v1/books", bookRouter);
app.use("/api/v1/users", userRoute);
app.all("*", (req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      statusCodes.NOT_FOUND
    )
  );
});
app.use(globalErrorHandler);
module.exports = app;
