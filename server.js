const dotenv = require("dotenv");
dotenv.config();
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  process.exit(1);
});
const app = require("./app");
const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace(
  "<Password>",
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => console.log("DB Connected successfully"));

const server = app.listen(process.env.PORT, () => {
  console.log(`App running on port ${process.env.PORT}...`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
