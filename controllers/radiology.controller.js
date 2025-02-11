const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
const Radiology = require('../model/radiology.model');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nabd142025@gmail.com',
    pass: 'nzxm wyky hapd xqsu', // firaskingsalha67  CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA   cpzz lnvy ldus tczj
  },
});

exports.createNewRadiology = async (req, res) => {
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
    try {
      const existingUser = await Radiology.findOne({ email });
      if (existingUser) {
        return res
          .status(409)
          .json({ success: false, message: 'Email already exists' });
      }
  
      newUser = new Radiology({
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
      const approvalLink = `pharma-manager-copy-1.onrender.com/api/approve/radiology/${newUser._id}`;
      const rejectLink = `pharma-manager-copy-1.onrender.com/api/reject/radiology/${newUser._id}`;
      const mailOptions = {
        from: email,
        to: 'nabd142025@gmail.com',
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

  

  
  exports.approveRadiology = async (req, res) => {
    try {
      const user = await Radiology.findById(req.params.id);
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

  exports.rejectRadiology = async (req, res) => {
    try {
      const user = await Radiology.findById(req.params.id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
  
      await Radiology.deleteOne({ _id: req.params.id });
  
      res
        .status(200)
        .json({ success: true, message: 'User rejected successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  exports.getradiology = async (req, res) => {
    const city = req.params.city,
      address = req.params.address;
    const query = { role: 'radiology', city: city, address: address };
    const findradiology = await Radiology.find(query);
    if (findradiology) {
      res.status(201).json({ status: true, findradiology });
    } else {
      res.status(404).json({ status: false, message: 'No result' });
    }
  };