const express = require("express");
const { createAdmin, adminLogin } = require("../controllers/adminController.controller");
const { body } = require("express-validator");


const router = express.Router();
  const validateAdmin = [
   body("username").isString().notEmpty().withMessage("Username is required"),
   body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
 ];

router.post("/create", validateAdmin, createAdmin);
router.post("/login", validateAdmin, adminLogin);

module.exports = router;
