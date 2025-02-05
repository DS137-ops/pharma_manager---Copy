const User = require('../model/auth.model');
const Seek = require('../model/seek.model');
const Message = require('../model/chat.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
const ADMIN_EMAIL = 'feadkaffoura@gmail.com';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'firaskingsalha67@gmail.com',
    pass: 'cpzz lnvy ldus tczj', // firaskingsalha67  CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA   cpzz lnvy ldus tczj
  },
});
exports.createNewSpec = async (req, res) => {
  const {
    fullName,
    email,
    password,
    role,
    specilizate,
    city,
    address,
    phone,
    StartJob,
    EndJob,
    NumberState,
  } = req.body;
  try {
    const RootCount = await User.countDocuments({ role: 'admin' });
    if (RootCount > 1) {
      res.status(500).json({ success: false, message: 'You can not register' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    newUser = new User({
      fullName,
      email,
      password,
      role,
      specilizate,
      city,
      address,
      phone,
      StartJob,
      EndJob,
      NumberState,
    });
    await newUser.save();
    const specilizateLine =
      role === 'doctor' ? `<p>Specialization: ${specilizate}</p>` : '';
    const approvalLink = `https://pharma-manager-copy-1.onrender.com/api/approve/${newUser._id}`;
    const rejectLink = `https://pharma-manager-copy-1.onrender.com/api/reject/${newUser._id}`;
    const mailOptions = {
      from: email,
      to: 'feadkaffoura@gmail.com',
      subject: 'Test Email with Hotmail',
      html: `
          <h3>New Registration Request</h3>
          <p>Name: ${fullName}</p>
          <p>Email: ${email}</p>
          <p>Role: ${role}</p>
          <p>City: ${city}</p>
          <p>Address: ${address}</p>
           ${specilizateLine}
           <p>Phone: ${phone}</p>
           <p>StartJob: ${StartJob}</p>
           <p>EndJob: ${EndJob}</p>
           <p>Number Of State in Hour: ${NumberState}</p>
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
exports.createNewSeek = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const existSeek = await Seek.findOne({ phone });
    if (existSeek) {
      return res
        .status(409)
        .json({ success: false, message: 'Phone already used' });
    }
    const newSeek = new Seek({ fullName, phone });
    await newSeek.save();
    return res
      .status(201)
      .json({ success: true, newSeek, message: 'user register succesfully' });
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
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    await User.deleteOne({ _id: req.params.id });

    res
      .status(200)
      .json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.loginSpec = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
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
    const token = await jwt.sign({ id: user._id, role: user.role }, '1001110');
    RefreshToken.create({ token });

    res.status(200).json({ success: true, message: 'Login successful', token });
  } catch (err) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.logoutSpec = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1];
  const { refreshToken } = req.body;
  console.log(123);
  if (token) {
    console.log(token);
    await Blacklist.create({ token });
    await RefreshToken.deleteOne({ refreshToken });
  }

  res.status(200).json({ success: true });
};
exports.logoutSeek = async (req, res) => {
  const id = req.params.id;
  const newSeek = await Seek.findOne({ id });
  const deletedSeek = await Seek.deleteOne({ newSeek });
  if (deletedSeek) {
    return res
      .status(201)
      .json({ success: true, deletedSeek, message: 'logout Successfully' });
  } else {
    return res
      .status(201)
      .json({ success: false, message: 'logout Not Successfully' });
  }
};
exports.getPharmas = async (req, res) => {
  const city = req.params.city,
    address = req.params.address;
  const query = { role: 'pharmatic' };
  if (city && address) {
    query.city = city;
    query.address = address;
  } else if (city) {
    query.city = city;
  } else if (address) {
    query.address = address;
  }

  const findPharma = await User.find(query);
  if (findPharma) {
    res.status(201).json({ status: true, findPharma });
  } else {
    res.status(404).json({ status: false, message: 'No result' });
  }
};
exports.getDoctors = async (req, res) => {
  const city = req.params.city,
    address = req.params.address;
  const query = { role: 'doctor' };
  if (city && address) {
    query.city = city;
    query.address = address;
  } else if (city) {
    query.city = city;
  } else if (address) {
    query.address = address;
  }

  const findDoctor = await User.find(query);
  if (findDoctor) {
    res.status(201).json({ status: true, findDoctor });
  } else {
    res.status(404).json({ status: false, message: 'No result' });
  }
};
exports.getradiology = async (req, res) => {
  const city = req.params.city,
    address = req.params.address;
  const query = { role: 'radiology' };
  if (city && address) {
    query.city = city;
    query.address = address;
  } else if (city) {
    query.city = city;
  } else if (address) {
    query.address = address;
  }

  const findradiology = await User.find(query);
  if (findradiology) {
    res.status(201).json({ status: true, findradiology });
  } else {
    res.status(404).json({ status: false, message: 'No result' });
  }
};
exports.getAnalyst = async (req, res) => {
  const city = req.params.city,
    address = req.params.address;
  const query = { role: 'Analyst' };
  if (city && address) {
    query.city = city;
    query.address = address;
  } else if (city) {
    query.city = city;
  } else if (address) {
    query.address = address;
  }

  const findAnalyst = await User.find(query);
  if (findradiology) {
    res.status(201).json({ status: true, findAnalyst });
  } else {
    res.status(404).json({ status: false, message: 'No result' });
  }
};
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, content } = req.body;
    const city = req.params.city,
      address = req.params.adddress;

    if (!senderId || !content) {
      return res.status(400).json({ error: 'Sender and content are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ error: 'Invalid senderId format' });
    }
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const query = { role: 'pharmatic' };
    if (city && address) {
      query.city = city;
      query.address = address;
    } else if (city) {
      query.city = city;
    } else if (address) {
      query.address = address;
    }
    const pharmacists = await User.find(query);
    const recipientIds = pharmacists.map((user) => user._id);
    const newMessage = new Message({
      sender: senderObjectId,
      recipients: recipientIds,
      content,
    });
    await newMessage.save();
    req.io.emit('receiveMessage', newMessage);
    res
      .status(200)
      .json({ message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
};
