const express = require("express");
const bookController = require("../controllers/bookController");
const userController = require("../controllers/userController");
const { body } = require("express-validator");
const router = express.Router();

router.post(
  "/",
  [
    body("title").notEmpty().withMessage("A book must have a title"),
    body("title")
      .if(body("title").notEmpty())
      .isLength({ min: 5 })
      .withMessage("A book title must have more than 5 characters"),
  ],
  [body("genre").notEmpty().withMessage("A book must have a genre")],
  [body("author").notEmpty().withMessage("A book must have an author")],
  [
    body("ISBN").notEmpty().withMessage("Please provide ISBN number"),
    body("ISBN")
      .if(body("ISBN").notEmpty())
      .isLength({ min: 13, max: 13 })
      .withMessage("ISBN number must be 13 in length"),
  ],
  [
    body("overview").notEmpty().withMessage("A book must have an overview"),
    body("overview")
      .if(body("title").notEmpty())
      .isLength({ min: 15 })
      .withMessage("A book must not have an overview less than 15 characters"),
  ],
  userController.protect,
  userController.checkUserActive,
  userController.restrictTo("admin"),
  bookController.addBook
);
router.get("/", bookController.getAllBooks);
router.get("/:id", bookController.getBook);
router.patch(
  "/:id",
  [
    body("title")
      .optional()
      .if(body("title").notEmpty())
      .isLength({ min: 5 })
      .withMessage("A book title must have more than 5 characters"),
  ],
  [
    body("ISBN")
      .optional()
      .if(body("ISBN").notEmpty())
      .isLength({ min: 13, max: 13 })
      .withMessage("ISBN number must be 13 in length"),
  ],
  [
    body("overview")
      .optional()
      .if(body("title").notEmpty())
      .isLength({ min: 15 })
      .withMessage("A book must not have an overview less than 15 characters"),
  ],
  userController.protect,
  userController.checkUserActive,
  userController.restrictTo("admin"),
  bookController.updateBook
);
router.delete(
  "/:id",
  userController.protect,
  userController.checkUserActive,
  userController.restrictTo("admin"),
  bookController.deleteBook
);
router.patch(
  "/borrow/:id",
  userController.protect,
  userController.checkUserActive,
  bookController.borrowBook
);
router.patch(
  "/return/:id",
  userController.protect,
  userController.checkUserActive,
  bookController.returnBook
);

module.exports = router;
