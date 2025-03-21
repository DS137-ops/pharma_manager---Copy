const Pharmatic = require('../model/auth.model');
const Seek = require('../model/seek.model');
const Doctor = require('../model/doctor.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
require('dotenv').config();
function generateTimeSlots(start, end) {
  const slots = [];
  let [sh, sm] = start.split(':').map(Number);
  let [eh, em] = end.split(':').map(Number);

  while (sh < eh || (sh === eh && sm < em)) {
    let hour = sh.toString().padStart(2, '0');
    let minute = sm.toString().padStart(2, '0');
    slots.push(`${hour}:${minute}`);

    sm += 30;
    if (sm >= 60) {
      sm -= 60;
      sh++;
    }
  }

  return slots;
}

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
  if (
    !fullName ||
    !email ||
    !password ||
    !city ||
    !region ||
    !address ||
    !phone ||
    !StartJob ||
    !EndJob
  ) {
    return res
      .status(404)
      .json({ success: false, message: 'All fields are required' });
  }
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

    // https://pharma-manager-copy-2.onrender.com
    await newUser.save();
    const approvalLink = `http://147.93.106.92/api/Pharmatic/approve/pharmatic/${newUser._id}`;
    const rejectLink = `http://147.93.106.92/api/Pharmatic/reject/pharmatic/${newUser._id}`;
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

    res.status(200).json({
      success: true,
      message: 'Registration request sent to admin please wait for approved',
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


exports.deletePharmaticAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    await Pharmatic.findByIdAndDelete(user._id);

    res.status(200).json({ message: "Account deleted successfully" , data:[] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}
exports.ratePharmatic = async (req, res) => {
  try {
    const  pharmaticId  = req.params.pharmaticId;
    const { userId, rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(pharmaticId)) {
      return res.status(400).json({ message: 'Invalid Pharmacist ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: 'Rating must be between 1 and 5' });
    }

    const pharmatic = await Pharmatic.findById(pharmaticId);
    if (!pharmatic) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }
    if (!pharmatic.rate) {
      pharmatic.rate = [];
    }
    const existingRatingIndex = pharmatic.rate.findIndex(
      (r) => r.userId.toString() === userId.toString()
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
exports.getPharmas = async (req, res) => {
  const city = req.params.city,
    region = req.params.region;
  const query = { role: 'pharmatic', city: city, region: region , approved:true };

  try {
    const findPharma = await Pharmatic.find(query);

    if (!findPharma || findPharma.length === 0) {
      return res.status(404).json({ status: false, message: 'No result' });
    }
    const pharmaciesWithRatings = findPharma.map((pharma) => {
      const ratings = pharma.rate?.map((r) => r.rating) || [];

      const total = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating = ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

      return {
        ...pharma.toObject(),
        finalRate: parseFloat(averageRating),
      };
    });

    return res.status(200).json({ status: true, findPharma: pharmaciesWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


function extractTime(timeString) {
  const match = timeString.match(/\((\d{2}:\d{2})\)/);

  return match ? `${match[1]}` : null;
}

exports.updatePharmaticInfo = async (req, res) => {
  try {
    const {
      fullName,
      city,
      region,
      address,
      phone,
      StartJob,
      EndJob,
    } = req.body;
    const id = req.params.id;
    
  const startjob= await extractTime(StartJob);
  const endjob= await extractTime(EndJob);
  
    await Pharmatic.updateMany(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          fullName: fullName,
          city: city,
          region: region,
          address: address,
          phone: phone,
          StartJob: startjob,
          EndJob: endjob,
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
exports.approvePharmatic = async (req, res) => {
  try {
    const user = await Pharmatic.findById(req.params.id);
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
exports.rejectPharmatic = async (req, res) => {
  try {
    const user = await Pharmatic.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found'});
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
              <h3>لم تتم الموافقة على طلبك يرجى إعادة تفقد البيانات وإرسال الطلب مجددا </h3>
              <h5>مع أطيب التمنيات</h5>
            `,
    };
    await transporter.sendMail(mailOptions);
    await Pharmatic.deleteOne({ _id: req.params.id });

    res
      .status(200)
      .json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


exports.createNewSeek = async (req, res) => {
  const { fullName, age , phone , password } = req.body;
  if(!password) return res
  .status(409)
  .json({ success: false, message: 'password should not empty' });
  if(!fullName) return res
  .status(409)
  .json({ success: false, message: 'fullname should not empty' });
  if(!phone) return res
  .status(409)
  .json({ success: false, message: 'phone should not empty' });
  if(!age) return res
  .status(409)
  .json({ success: false, message: 'age should not empty' });
  try {
   
    const existSeek = await Seek.findOne({ phone });
    if(existSeek)return res.status(400).json({success:false , messsage:'phone is already exist'})
    
    const newSeek = new Seek({ fullName, age, phone ,password });

    await newSeek.save();
    return res.status(201).json({
      success: true,
      message: 'user register succesfully',
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

exports.loginSeek = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone) {
    return res.status(403).json({ message: 'phone is required' });
  }
  if(!password)
    return res.status(400).json({ message: 'password is required' });
  try {
    const user = await Seek.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'phone is Not Correct' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'password is Not the same' });
    }

    const token = await jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET);

    await RefreshToken.create({ token });

    return res.status(201).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });

  } catch (err) {
    console.error('Error logging in:', err);
    return res.status(500).json({ success: false, message: `Internal server error: ${err.message}` });
  }
};

exports.deleteSeekAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    await Seek.findByIdAndDelete(user._id);

    res.status(200).json({ message: "Account deleted successfully" , data:[] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}

exports.loginPhar = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(403).json({ message: 'email is required' });
  }
  if(!password)
    return res.status(400).json({ message: 'password is required' });
  try {
    const user = await Pharmatic.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email is Not Correct' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'password is Not the same' });
    }

    const token = await jwt.sign({ id: user._id, role: 'pharmatic' }, '1001110');

    await RefreshToken.create({ token });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });

  } catch (err) {
    console.error('Error logging in:', err);
    return res.status(500).json({ success: false, message: `Internal server error: ${err.message}` });
  }
};


exports.logoutSpec = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1];
  const { refreshToken } = req.body;
  if (token) {
    await Blacklist.create({ token });
    await RefreshToken.deleteOne({ refreshToken });
  }

  res.status(200).json({ success: true });
};
exports.logoutSeek = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1];
  const { refreshToken } = token;
  if (token) {
    console.log(token);
    await Blacklist.create({ token });
    await RefreshToken.deleteOne({ refreshToken });
  }

  res.status(200).json({ success: true });
};

exports.forgetPassForPharmatic = async (req, res) => {
  const { email } = req.body;
  const user = await Pharmatic.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 20 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
      from: 'nabd142025@gmail.com',
      to: email,
      subject: "Password Reset Code",
      html: `<h4>Your password reset code is:</h4> <h2>${resetCode}</h2>`,
  });

  res.json({ message: "Reset code sent to your email" });
}

exports.verifyCodePharmatic = async (req, res) => {
  const { email, code } = req.body;
  const user = await Pharmatic.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
  }

  res.json({ message: "Code verified successfully" });
}


exports.resetPharmaPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Pharmatic.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();

  res.json({ message: "Password reset successfully" });
}





exports.forgetPassForSick = async (req, res) => {
  const { email } = req.body;
  const user = await Seek.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 20 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
      from: 'nabd142025@gmail.com',
      to: email,
      subject: "Password Reset Code",
      html: `<h4>Your password reset code is:</h4> <h2>${resetCode}</h2>`,
  });

  res.json({ message: "Reset code sent to your email" });
}

exports.verifyCodeSick = async (req, res) => {
  const { email, code } = req.body;
  const user = await Seek.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
  }

  res.json({ message: "Code verified successfully" });
}


exports.resetSickPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Seek.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();

  res.json({ message: "Password reset successfully" });
}