const express = require("express");
const morgan = require("morgan");
const app = express();
const bookRouter = require("./routes/bookRoute");

// MIDDLEWARE
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());
app.use("/api/v1/books", bookRouter);
app.get("/", (req, res) => {
  res.send("Hello World!!");
});

app.use(express.json());

module.exports = app;
