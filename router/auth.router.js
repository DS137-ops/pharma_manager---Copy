const router = require('express').Router()
const authModel = require('../model/auth.model')
const body = require('express').urlencoded({ extended: true })
const body2 = require('express').json()
var nodemailer = require('nodemailer');
function sendEmail(email) {
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'firaskingsalha67@gmail.com',
    pass: 'cpzz lnvy ldus tczj',   //CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA
  },
});
const mailOptions = {
  from: email,
  to: 'firaskingsalha67@gmail.com',
  subject: 'Test Email with Hotmail',
  text: 'This is a test email sent using Nodemailer with Hotmail.',
};
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error occurred:', error);
  } else {
    console.log('Email sent:', info.response);
  }});}
router.post('/' ,body2, (req,res)=>{
    authModel.postnewuser(req.body.name ,req.body.email ,req.body.password ,req.body.age ,req.body.address ,req.body.job)
    .then((user)=> res.status(200).json({user , msg:'success'}))
    .catch((err)=> res.status(400).json({err , msg:'Failed'}))
})

router.post('/login' ,body2, (req,res)=>{
    authModel.postloginuser(req.body.email ,req.body.password)
    .then((token)=> res.status(200).json({token , msg:'success'}))
    .catch((err)=> res.status(400).json({err , msg:'Failed'}))
})

router.post('/contact/:id' , (req,res)=>{
    authModel.getUserInfo(req.params.id).then((userInfo)=>{
        sendEmail(userInfo.email)
    })
})
router.post('/Addnotification/:userId', (req, res) => {
    const  userId = req.params.userId,
    message = req.body.message
    if (!userId || !message) {return res.status(400).json({ error: 'UserId and message are required' });}
    authModel.setNewNotify(userId , message , req.body.date).then((verifNotify)=>{return res.status(200).json({ success: true, verifNotify });})
});


module.exports = router