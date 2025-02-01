const router = require("express").Router();
const authController = require("../controllers/auth.controller");
var nodemailer = require("nodemailer");
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const authModel = require("../model/auth.model");
function sendEmail(email) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "feadkaffoura@gmail.com",
      pass: "CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA", // firaskingsalha67  CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA   cpzz lnvy ldus tczj
    },
  });
  const mailOptions = {
    from: email,
    to: "feadkaffoura@gmail.com",
    subject: "Test Email with Hotmail",
    text: "This is a test email sent using Nodemailer with Hotmail.",
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error occurred:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}
router.post('/',
  [
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 3 characters long'),
    body('email').trim().isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('phone').notEmpty().withMessage('phone is required'),
  ],
  authController.createNewSpec
)
router.get('/approve/:id', authController.approveUser);
router.get('/reject/:id', authController.rejectUser);

router.post('/createNewSeek',[
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 3 characters long'),
  body('phone').notEmpty().withMessage('phone is required'),
] , authController.createNewSeek)
router.post('/signinUser' ,checkprov.isProvved , authController.loginSpec )

router.post('/logoutSpec' , checkprov.checkBlacklist , authController.logoutSpec)
module.exports = router;
