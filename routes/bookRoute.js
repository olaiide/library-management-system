const express = require("express");
const bookRoute = require("../controllers/bookController");

const router = express.Router();

router.post("/", bookRoute.addBook);

module.exports = router;
