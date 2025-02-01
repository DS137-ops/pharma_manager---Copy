const User = require('../model/auth.model');
const Seek = require('../model/seek.model');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken")
var nodemailer = require("nodemailer");
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
const ADMIN_EMAIL = 'feadkaffoura@gmail.com';
 const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "firaskingsalha67@gmail.com",
      pass: "cpzz lnvy ldus tczj", // firaskingsalha67  CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA   cpzz lnvy ldus tczj
    },
  });
exports.createNewSpec = async (req, res) => {
    const  {fullName ,email, password,role,specilizate, address , phone}  = req.body;
    try {
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }
       
          newUser = new User({fullName, email, password,role,specilizate, address , phone });
         await newUser.save();
         const specilizateLine = role === "doctor" ? `<p>Specialization: ${specilizate}</p>` : '';         const approvalLink = `http://localhost:8080/api/approve/${newUser._id}`;
         const rejectLink = `http://localhost:8080/api/reject/${newUser._id}`;
         const mailOptions = {
          from: email,
          to: "feadkaffoura@gmail.com",
          subject: "Test Email with Hotmail",
          html: `
          <h3>New Registration Request</h3>
          <p>Name: ${fullName}</p>
          <p>Email: ${email}</p>
          <p>Role: ${role}</p>
           ${specilizateLine}
           <p>Phone: ${phone}</p>
          <p>Click below to approve or reject:</p>
          <a href="${approvalLink}" style="color:green">Approve</a> | <a href="${rejectLink}" style="color:red">Reject</a>
        `,
        };
        await transporter.sendMail(mailOptions)

    res.status(200).json({ success: true, message: 'Registration request sent to admin' });
    } catch (err) {
        console.error('Error registering user:', err);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: errors.join(', ') });
        }

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createNewSeek = async (req,res)=>{
  try{
    const { fullName , phone } = req.body
    const existSeek = await Seek.findOne({phone})
    if(existSeek){
      return res.status(409).json({ success: false, message: 'Phone already used' });
    }
    const newSeek = new Seek({fullName , phone });
    await newSeek.save()
    return res.status(201).json({success:true , newSeek , message: 'user register succesfully'  })

  }catch(err){
    console.error('Error registering user:', err);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: errors.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.approved = true;
    await user.save();

    res.status(200).json({ success: true,user, message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await User.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.loginSpec = async(req,res)=>{
  try{
    const {email,password} = req.body
    const user = await User.findOne({email})
    if(!user){
      return res.status(404).json({success:false , message:'Email is Not Correct'})
    }
    const isMatch  = await bcrypt.compare(password,user.password)
    if(!isMatch){
      return res.status(401).json({success:false , message:'password is Not the same'})
    }
    const token = await jwt.sign({id:user._id , role:user.role} , '1001110'  , )
    RefreshToken.create({token})

    res.status(200).json({ success: true, message: 'Login successful', token });
  }catch(err){
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
exports.logoutSpec = async (req,res,next)=>{
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const {refreshToken} = req.body
  console.log(123)
  if(token){
    console.log(token)
      await Blacklist.create({token})
      await RefreshToken.deleteOne({refreshToken})
  }
  
  res.status(200).json({success:true})
}
