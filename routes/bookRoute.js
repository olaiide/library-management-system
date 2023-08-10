const express = require("express");
const bookRoute = require("../controllers/bookController");

const router = express.Router();

router.post("/", bookRoute.addBook);
router.get("/", bookRoute.getAllBooks);
router.get("/:id", bookRoute.getBook);
router.patch("/:id", bookRoute.updateBook);
router.delete("/:id", bookRoute.deleteBook);

module.exports = router;
