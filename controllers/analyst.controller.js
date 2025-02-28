const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const RefreshToken = require('../model/RefreshToken.model');
const Analyst = require('../model/analyst.model');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nabd142025@gmail.com',
    pass: 'nzxm wyky hapd xqsu', // firaskingsalha67  CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA   cpzz lnvy ldus tczj
  },
});
exports.createNewAnalyst = async (req, res) => {
  const {
    fullName,
    email,
    password,
    city,
    region,
    address,
    phone,
    StartJob,
    EndJob,
  } = req.body;
  if(!fullName || !email || !password || !city || !region || !address || !phone || !StartJob || !EndJob){
    return res.status(404).json({success:false , message:'All fields are required'})
  }
  try {
    const existingUser = await Analyst.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    newUser = new Analyst({
      fullName,
      email,
      password,
      city,
      region,
      address,
      phone,
      StartJob,
      EndJob,
    });
    // https://pharma-manager-copy-1.onrender.com
    await newUser.save();
    const approvalLink = `http://localhost:8080/api/Analyst/approve/analyst/${newUser._id}`;
    const rejectLink = `http://localhost:8080/api/Analyst/reject/analyst/${newUser._id}`;
    const mailOptions = {
      from: email,
      to: 'feadkaffoura@gmail.com',
      subject: 'Test Email with Hotmail',
      html: `
            <h3>New Registration Request</h3>
            <p>Name: ${fullName}</p>
            <p>Email: ${email}</p>
            <p>Role: ${newUser.role}</p>
            <p>City: ${city}</p>
            <p>Region: ${region}</p>
             <p>Phone: ${phone}</p>
             <p>StartJob: ${StartJob}</p>
             <p>EndJob: ${EndJob}</p>
            <p>Click below to approve or reject:</p>
            <a href="${approvalLink}" style="color:green">Approve</a> | <a href="${rejectLink}" style="color:red">Reject</a>
          `,
    };
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ success: true, message: 'Registration request sent to admin' });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(', ') });
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.loginAna = async (req, res) => {
  const { email, password } = req.body;
  if(!email){
    return res.status(403).json({message:'email is required'})
  }
  if(!password){
    return res.status(400).json({message:'password is required'})
  }
  try {
    const user = await Analyst.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Email is Not Correct' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'password is Not the same' });
    }
    const token = await jwt.sign({ id: user._id, role: 'analyst' }, '1001110');
    RefreshToken.create({ token });

    res.status(200).json({ success: true, message: 'Login successful', token , user });
  } catch (err) {
    console.error('Error logging in:', err);
    res
      .status(500)
      .json({ success: false, message: `Internal server error ${err}` });
  }
};

exports.approveAnalyst = async (req, res) => {
  try {
    const user = await Analyst.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    user.approved = true;
    await user.save();

    res
      .status(200)
      .json({ success: true, user, message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.rejectAnalyst = async (req, res) => {
  try {
    const user = await Analyst.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    await Analyst.deleteOne({ _id: req.params.id });

    res
      .status(200)
      .json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAnalyst = async (req, res) => {
  const city = req.params.city,
  region = req.params.region;
  const query = { role: 'analyst', city: city, region: region };
  const findAnalyst = await Analyst.find(query);
  if (findAnalyst) {
    res.status(201).json({ status: true, findAnalyst });
  } else {
    res.status(404).json({ status: false, message: 'No result' });
  }
};
