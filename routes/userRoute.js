const express = require("express");
const userController = require("../controllers/userController");
const { validPassword } = require("../utils/validPassword");
const router = express.Router();
const { body } = require("express-validator");

router.post(
  "/signup",
  [body("name").notEmpty().withMessage("Please provide your name")],
  [
    body("email").notEmpty().withMessage("Please provide your email"),
    body("email")
      .if(body("email").notEmpty())
      .isEmail()
      .withMessage("Please provide a valid email address"),
  ],
  [
    body("password").notEmpty().withMessage("Please provide your password"),
    body("password")
      .if(body("password").notEmpty())
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("password")
      .if(body("password").isLength({ min: 8 }))
      .matches(validPassword)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
      ),
  ],
  userController.signup
);
router.post(
  "/login",
  [
    body("email").notEmpty().withMessage("Please provide your email"),
    body("email")
      .if(body("email").notEmpty())
      .isEmail()
      .withMessage("Please provide a valid email address"),
  ],
  [
    body("password").notEmpty().withMessage("Please provide your password"),
    body("password")
      .if(body("password").notEmpty())
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("password")
      .if(body("password").isLength({ min: 8 }))
      .matches(validPassword)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
      ),
  ],

  userController.login
);
router.get("/", userController.getAllUsers);
module.exports = router;
