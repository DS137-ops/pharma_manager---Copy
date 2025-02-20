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
    const approvalLink = `pharma-manager-copy-2.onrender.com/api/approve/radiology/${newUser._id}`;
    const rejectLink = `pharma-manager-copy-2.onrender.com/api/reject/radiology/${newUser._id}`;
    const mailOptions = {
      from: email,
      to: 'feadkaffoura@gmail.com',
      subject: 'طلب تسجيل جديد',
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
    const mailOptions = {
      from: 'nabd142025@gmail.com',
      to: user.email,
      subject: 'الرد على طلب التسجيل',
      html: `
          <h3>بعد مراجعة حالة طلبك التالي:</h3>
          <p>Name: ${user.fullName}</p>
          <p>Email: ${user.email}</p>
          <p>Role: ${user.role}</p>
          <p>City: ${user.city}</p>
          <p>Region: ${user.region}</p>
           <p>Phone: ${user.phone}</p>
           <p>StartJob: ${user.StartJob}</p>
           <p>EndJob: ${user.EndJob}</p>
          <h3>تمت الموافقة على طلبك بنجاح </h3>
          <h5>مع أطيب التمنيات</h5>
        `,
    };
    await transporter.sendMail(mailOptions);
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
        const mailOptions = {
          from: 'nabd142025@gmail.com',
          to: user.email,
          subject: 'الرد على طلب التسجيل',
          html: `
                  <h3>بعد مراجعة حالة طلبك التالي:</h3>
                  <p>Name: ${user.fullName}</p>
                  <p>Email: ${user.email}</p>
                  <p>Role: ${user.newUser.role}</p>
                  <p>City: ${user.city}</p>
                  <p>Region: ${user.region}</p>
                   <p>Phone: ${user.phone}</p>
                   <p>StartJob: ${user.StartJob}</p>
                   <p>EndJob: ${user.EndJob}</p>
                  <h3>لم تتم الموافقة على طلبك يرجى إعادة تفقد البيانات وإرسال الطلب مجددا </h3>
                  <h5>مع أطيب التمنيات</h5>
                `,
        };
        await transporter.sendMail(mailOptions);
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
    region = req.params.region;
  const query = { role: 'radiology', city: city, region: region };
  const findradiology = await Radiology.find(query);
  console.log(findradiology)
  if (findradiology) {
    res.status(201).json({ status: true, findradiology });
  } else {
    res.status(404).json({ status: false, message: 'No result' });
  }
};


exports.rateRadiology = async (req, res) => {
  try {
    const { radiologyId } = req.params;
    const { userId, rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(radiologyId)) {
      return res.status(400).json({ message: 'Invalid Radiologist ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: 'Rating must be between 1 and 5' });
    }

    const radiology = await Radiology.findById(radiologyId);
    if (!radiology) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    // تأكد من أن rate هو مصفوفة
    if (!radiology.rate) {
      radiology.rate = [];
    }

    // التحقق مما إذا كان المستخدم قد قيم سابقًا
    const existingRatingIndex = radiology.rate.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
      // تحديث التقييم الحالي
      radiology.rate[existingRatingIndex].rating = rating;
      radiology.rate[existingRatingIndex].review = review;
      radiology.rate[existingRatingIndex].date = new Date();
    } else {
      // إضافة تقييم جديد
      radiology.rate.push({ userId, rating, review, date: new Date() });
    }

    await radiology.save();

    res
      .status(200)
      .json({ message: 'Rating submitted successfully', data: radiology.rate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getFinalRateForRadiology = async (req, res) => {
  try {
    const radiologyId = req.params.radiologyId;
    const radiology = await Radiology.findById(radiologyId);
    if (!radiology) {
      return res.status(404).json({ message: 'Radiology not found' });
    }

    // Get all ratings
    const ratings = radiology.rate.map((r) => r.rating);

    if (ratings.length === 0) {
      return res.json({
        radiologyId,
        finalRate: 0,
        message: 'No ratings available',
      });
    }

    // Calculate average rating
    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = (total / ratings.length).toFixed(1); // Keep 1 decimal place

    res.json({ radiologyId, finalRate: parseFloat(averageRating) });
  } catch (error) {
    console.error('Error calculating rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.loginRadio = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Radiology.findOne({ email });
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
    const token = await jwt.sign({ id: user._id, role: 'radiology' }, '1001110');
    RefreshToken.create({ token });

    res.status(200).json({ success: true, message: 'Login successful', token });
  } catch (err) {
    console.error('Error logging in:', err);
    res
      .status(500)
      .json({ success: false, message: `Internal server error ${err}` });
  }
};

exports.updateRadiologyInfo = async (req, res) => {
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

    await Radiology.updateMany(
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