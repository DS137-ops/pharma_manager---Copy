const Pharmatic = require('../model/auth.model');
const Analyst = require('../model/analyst.model');
const Seek = require('../model/seek.model');
const DoctorMessage = require('../model/chatdoctor.model');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
const multer = require('multer');

//   cloud_name: 'dqk8dzdoo',
//   api_key: '687124232966245',
//   api_secret: 'LhIKcexhYtHUK'
// });
//CloudName : dqk8dzdoo
//Api key 687124232966245
//Api secret LhIKcexhYtHUK-bZSiIoT8jsMqc
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'messages', // Folder name in Cloudinary
//     allowed_formats: ['jpg', 'jpeg', 'png'], // Convert all images to PNG
//     public_id: (req, file) => Date.now() + '-' + file.originalname.replace(/\s/g, '_')
//   }
// });
//const upload = multer({ storage: storage });
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nabd142025@gmail.com',
    pass: 'nzxm wyky hapd xqsu', // firaskingsalha67  CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA   cpzz lnvy ldus tczj
  },
});
//sign pharmatic
exports.createNewPharmatic = async (req, res) => {
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
    const existingUser = await Pharmatic.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    newUser = new Pharmatic({
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
    const approvalLink = `pharma-manager-copy-1.onrender.com/api/approve/pharmatic/${newUser._id}`;
    const rejectLink = `pharma-manager-copy-1.onrender.com/api/reject/pharmatic/${newUser._id}`;
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

exports.ratePharmatic = async (req, res) => {
  try {
    const { pharmaticId } = req.params;
    const { userId, rating, review } = req.body;
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: 'Rating must be between 1 and 5' });
    }
    const pharmatic = await Pharmatic.findById(pharmaticId);
    if (!pharmatic) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }
    const existingRatingIndex = pharmatic.rate.findIndex(
      (r) => r.userId.toString() === userId
    );

    if (existingRatingIndex !== -1) {
      pharmatic.rate[existingRatingIndex].rating = rating;
      pharmatic.rate[existingRatingIndex].review = review;
      pharmatic.rate[existingRatingIndex].date = new Date();
    } else {
      pharmatic.rate.push({ userId, rating, review, date: new Date() });
    }

    await pharmatic.save();

    res
      .status(200)
      .json({ message: 'Rating submitted successfully', data: pharmatic.rate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getFinalRate = async (req, res) => {
  try {
    const pharmaticId = req.params.id;
    const pharmatic = await Pharmatic.findById(id);
    if (!pharmatic) {
      return res.status(404).json({ message: 'Pharmatic not found' });
    }

    // Get all ratings
    const ratings = pharmatic.rate.map((r) => r.rating);

    if (ratings.length === 0) {
      return res.json({
        pharmaticId,
        finalRate: 0,
        message: 'No ratings available',
      });
    }

    // Calculate average rating
    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = (total / ratings.length).toFixed(1); // Keep 1 decimal place

    res.json({ pharmaticId, finalRate: parseFloat(averageRating) });
  } catch (error) {
    console.error('Error calculating rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.updatePharmaticInfo = async (req, res) => {
  try {
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
    const id = req.params.id;

    await Pharmatic.updateMany(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          fullName: fullName,
          email: email,
          password: password,
          city: city,
          region: region,
          address: address,
          phone: phone,
          StartJob: StartJob,
          EndJob: EndJob,
        },
      }
    );
    res.status(201).json({ success: true, message: 'UpdatedSuccesffuly' });
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

// exports.sendImageToPhar = async (req, res) => {
//   try {
//     const { pharmaticId, sickId } = req.params;

//     // Check if the pharmacist exists
//     const pharmatic = await Pharmatic.findById(pharmaticId);
//     if (!pharmatic) {
//       return res.status(404).json({ message: 'Pharmacist not found' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     // Construct the image URL (assuming you're hosting on Render)
//     const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${
//       req.file.filename
//     }`;

//     // Save the image reference (you may want to store it in a database)
//     if (!pharmatic.notifications) pharmatic.notifications = [];
//     pharmatic.notifications.push({
//       sickId,
//       imageUrl,
//       date: new Date(),
//     });

//     await pharmatic.save();

//     res.status(200).json({
//       message: 'Image sent successfully',
//       imageUrl,
//       pharmaticId,
//       sickId,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.approvePharmatic = async (req, res) => {
  try {
    const user = await Pharmatic.findById(req.params.id);
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
exports.rejectPharmatic = async (req, res) => {
  try {
    const user = await Pharmatic.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    await Pharmatic.deleteOne({ _id: req.params.id });

    res
      .status(200)
      .json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//sign pharmatic
exports.createNewDoctor = async (req, res) => {
  const {
    fullName,
    email,
    password,
    city,
    region,
    address,
    phone,
    specilizate,
    NumberState,
    jobHour,
    rate,
    StartJob,
    EndJob,
  } = req.body;
  try {
    const existingUser = await Pharmatic.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    newUser = new Pharmatic({
      fullName,
      email,
      password,
      city,
      region,
      address,
      phone,
      specilizate,
      NumberState,
      jobHour,
      rate,
      StartJob,
      EndJob,
    });
    await newUser.save();
    const approvalLink = `pharma-manager-copy-2.onrender.com/api/approve/pharmatic/${newUser._id}`;
    const rejectLink = `pharma-manager-copy-2.onrender.com/api/reject/pharmatic/${newUser._id}`;
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
    const token = await jwt.sign({ id: newSeek._id }, '1001110');
    RefreshToken.create({ token });
    return res.status(201).json({
      success: true,
      newSeek,
      message: 'user register succesfully',
      token,
    });
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

exports.loginPhar = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Pharmatic.findOne({ email });
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
    console.error('Error logging in:', err);
    res
      .status(500)
      .json({ success: false, message: `Internal server error ${err}` });
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

exports.sendImageToPhar = async (req, res) => {
  try {
    const { city, region, sickId } = req.params;
    const pharmatics = await Pharmatic.find({ city, region });
    if (pharmatics.length === 0) {
      return res
        .status(404)
        .json({ message: 'No pharmacists found in this area' });
    }
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'Image upload failed' });
    }
    const imageUrl = req.file.path;
    const notification = {
      sickId,
      imageUrl,
      date: new Date(),
    };
    await Promise.all(
      pharmatics.map(async (pharmatic) => {
        if (!pharmatic.notifications) pharmatic.notifications = [];
        pharmatic.notifications.push(notification);
        await pharmatic.save();
      })
    );

    res.status(200).json({
      message: 'Image sent successfully to all pharmacists in this area',
      imageUrl,
      city,
      region,
      sickId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getPharmas = async (req, res) => {
  const city = req.params.city,
    region = req.params.region;
  const query = { role: 'pharmatic', city: city, region: region };

  const findPharma = await Pharmatic.find(query);
  if (findPharma) {
    res.status(201).json({ status: true, findPharma });
  } else {
    res.status(404).json({ status: false, message: 'No result' });
  }
};
exports.getDoctors = async (req, res) => {
  const city = req.params.city,
    region = req.params.region;
  const query = { role: 'doctor', city: city, region: region };
  const findDoctor = await User.find(query);
  if (findDoctor) {
    res.status(201).json({ status: true, findDoctor });
  } else {
    res.status(404).json({ status: false, message: 'No result' });
  }
};


exports.sendDoctorOrder = async (req, res) => {
  try {
    const { userId, doctorId, message, replyTo } = req.body;

    const newMessage = new DoctorMessage({
      userId,
      doctorId,
      message,
      replyTo,
    });
    await newMessage.save();

    res
      .status(201)
      .json({ success: true, message: 'Message sent', data: newMessage });
  } catch (error) {
    res.status(500).json({ error: 'Server error', error });
  }
};
