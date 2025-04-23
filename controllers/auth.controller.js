const Pharmatic = require('../model/auth.model');
const Seek = require('../model/seek.model');
const Doctor = require('../model/doctor.model');
const Favourite = require('../model/FavouritePharma.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const City = require('../model/cities.model');
const FavouritePharma = require('../model/FavouritePharma.model');
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
    city, // city ID
    region, // region ID
    address,
    phone,
    StartJob,
    EndJob,
  } = req.body;

  // Check if all required fields are provided
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
    // Check if the email already exists in the database
    const existingUser = await Pharmatic.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    // Look up the city by ID and get its name
    const cityExists = await City.findById(city);
    if (!cityExists)
      return res
        .status(400)
        .json({ success: false, message: 'City not found' });

    // Look up the region by ID within the selected city
    const regionExists = cityExists.regions.find(
      (r) => r._id.toString() === region
    );
    if (!regionExists)
      return res.status(400).json({
        success: false,
        message: 'Region not found in the selected city',
      });

    // Create a JWT token for the new pharmatic
    const token = await jwt.sign({ role: 'pharmatic' }, process.env.JWT_SECRET);

    // Create a new Pharmatic instance with the name of the city and region
    const newUser = new Pharmatic({
      fullName,
      email,
      password,
      city: cityExists.name, // Store city name
      region: regionExists.name, // Store region name
      address,
      phone,
      StartJob,
      EndJob,
    });

    // Save the new Pharmatic to the database
    await newUser.save();
    await RefreshToken.create({ token, userRef: newUser._id });

    // Create the approval and reject links
    const approvalLink = `http://147.93.106.92/api/Pharmatic/approve/pharmatic/${newUser._id}`;
    const rejectLink = `http://147.93.106.92/api/Pharmatic/reject/pharmatic/${newUser._id}`;

    // Send an email to the admin for approval
    const mailOptions = {
      from: email,
      to: 'feadkaffoura@gmail.com',
      subject: 'New Registration Request',
      html: `
        <h3>New Registration Request</h3>
        <p>Name: ${fullName}</p>
        <p>Email: ${email}</p>
        <p>Role: ${newUser.role}</p>
        <p>City: ${cityExists.name}</p>
        <p>Region: ${regionExists.name}</p>
        <p>Phone: ${phone}</p>
        <p>Start Job: ${StartJob}</p>
        <p>End Job: ${EndJob}</p>
        <p>Click below to approve or reject:</p>
        <a href="${approvalLink}" style="color:green">Approve</a> | 
        <a href="${rejectLink}" style="color:red">Reject</a>
      `,
    };

    // Send the email to the admin
    await transporter.sendMail(mailOptions);

    // Return the success response to the frontend
    res.status(200).json({
      success: true,
      message: 'Registration request sent to admin. Please wait for approval.',
      token: token,
    });
  } catch (err) {
    console.error('Error registering user:', err);

    // Handle validation errors and other types of errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(', ') });
    }

    // General error response
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deletePharmaticAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Incorrect password' });

    await Pharmatic.findByIdAndDelete(user._id);

    res.status(200).json({ message: 'Account deleted successfully', data: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
exports.ratePharmatic = async (req, res) => {
  try {
    const pharmaticId = req.params.pharmaticId;
    const { userId, rating, review } = req.body;

    // Validate IDs
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

    // Find the pharmacist
    const pharmatic = await Pharmatic.findById(pharmaticId);
    if (!pharmatic) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    // Ensure `rate` array exists
    if (!Array.isArray(pharmatic.rate)) {
      pharmatic.rate = [];
    }

    // **Always push a new rating to keep all previous ones**
    pharmatic.rate.push({
      userId,
      rating,
      review,
      date: new Date(),
    });

    // Save the updated pharmacist document
    await pharmatic.save();

    res.status(200).json({
      message: 'Rating added successfully',
      data: pharmatic.rate, // Returns all ratings, including the new one
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.getPharmas = async (req, res) => {
//   const { city, region } = req.params;
//   const existCity = await City.findById(city)
//   const existRegion = existCity.regions.find(r=>r._id.toString()===region)
//   if (!existRegion) return res.status(400).json({ success: false, message: 'Region not found in the selected city' });
//   const cityname = existCity.name
//   const regionname = existRegion.name
//   console.log(cityname, regionname)
//   const query = { role: 'pharmatic', city: cityname, region: regionname, approved: true };

//   try {
//     const findPharma = await Pharmatic.find(query);

//     if (!findPharma || findPharma.length === 0) {
//       return res.status(404).json({ status: false, message: 'No result' });
//     }

//     const pharmaciesWithRatings = findPharma.map((pharma) => {
//       const ratings = pharma.rate?.map((r) => r.rating) || [];
//       const total = ratings.reduce((sum, rating) => sum + rating, 0);
//       const averageRating = ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

//       return {
//         ...pharma.toObject(),
//         finalRate: parseFloat(averageRating),
//       };
//     });

//     pharmaciesWithRatings.sort((a, b) => b.finalRate - a.finalRate);

//     return res.status(200).json({ status: true, findPharma: pharmaciesWithRatings });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ status: false, message: 'Server error' });
//   }
// };

exports.getPharmas = async (req, res) => {
  const { city, region } = req.params;
  const userId = req.user._id;

  const existCity = await City.findById(city);
  const existRegion = existCity.regions.find(
    (r) => r._id.toString() === region
  );

  if (!existRegion)
    return res.status(400).json({
      success: false,
      message: 'Region not found in the selected city',
    });

  const cityname = existCity.name;
  const regionname = existRegion.name;
  console.log(cityname, regionname);

  const query = {
    role: 'pharmatic',
    city: cityname,
    region: regionname,
    approved: true,
  };

  try {
    const findPharma = await Pharmatic.find(query).select(
      '-password -resetCode -resetCodeExpires -approved'
    );

    if (!findPharma || findPharma.length === 0) {
      return res.status(404).json({ status: false, message: 'No result' });
    }

    // Fetch the user's favourite pharmacies
    const user = await Seek.findById(userId); // Assuming you have a User model

    const userFavourites = user ? user.favourites.map((f) => f.toString()) : [];

    const pharmaciesWithRatings = findPharma.map((pharma) => {
      const ratings = pharma.rate?.map((r) => r.rating) || [];
      const total = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating =
        ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

      return {
        ...pharma.toObject(),
        finalRate: parseFloat(averageRating),
        isfavourite: userFavourites.includes(pharma._id.toString()), // Check if the pharmacy is in user's favourites
      };
    });

    pharmaciesWithRatings.sort((a, b) => b.finalRate - a.finalRate);
    return res.status(200).json({ status: true, data: pharmaciesWithRatings });
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
    const { fullName, city, region, address, phone, StartJob, EndJob } =
      req.body;
    const id = req.params.id;

    const updateFields = {};

    if (fullName) updateFields.fullName = fullName;
    if (address) updateFields.address = address;
    if (phone) updateFields.phone = phone;

    if (StartJob) updateFields.StartJob = StartJob;
    if (EndJob) updateFields.EndJob = EndJob;

    if (city) {
      const existCity = await City.findById(city);
      if (!existCity) {
        return res
          .status(400)
          .json({ success: false, message: 'City not found' });
      }
      updateFields.city = existCity.name;

      if (region) {
        const existRegion = existCity.regions.find(
          (r) => r._id.toString() === region
        );
        if (!existRegion) {
          return res.status(400).json({
            success: false,
            message: 'Region not found in the selected city',
          });
        }
        updateFields.region = existRegion.name;
      }
    }

    await Pharmatic.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateFields }
    );

    res.status(200).json({ success: true, message: 'Updated Successfully' });
  } catch (err) {
    console.error('Error updating analyst info:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(', ') });
    }
    res
      .status(500)
      .json({ success: false, message: `Internal server error ${err} ` });
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
        .json({ success: false, message: 'User not found' });
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
  const { fullName, phone, password, age, city, region } = req.body;

  // Validation checks
  if (!password)
    return res
      .status(409)
      .json({ success: false, message: 'Password should not be empty' });
  if (!fullName)
    return res
      .status(409)
      .json({ success: false, message: 'Full name should not be empty' });

  if (!phone)
    return res
      .status(409)
      .json({ success: false, message: 'Phone should not be empty' });
  if (!age)
    return res
      .status(409)
      .json({ success: false, message: 'Age should not be empty' });
  if (!city)
    return res
      .status(409)
      .json({ success: false, message: 'City should not be empty' });
  if (!region)
    return res
      .status(409)
      .json({ success: false, message: 'Region should not be empty' });

  try {
    // Check if the phone number already exists
    const existSeek = await Seek.findOne({ phone });
    if (existSeek)
      return res
        .status(400)
        .json({ success: false, message: 'Phone number is already taken' });

    // Find the city by ID
    const cityExists = await City.findById(city);
    if (!cityExists)
      return res
        .status(400)
        .json({ success: false, message: 'City not found' });

    // Find the region by ID inside the city
    const regionExists = cityExists.regions.find(
      (r) => r._id.toString() === region
    );
    if (!regionExists)
      return res.status(400).json({
        success: false,
        message: 'Region not found in the selected city',
      });

    // Create JWT token
    const token = await jwt.sign({ role: 'user' }, process.env.JWT_SECRET);
    // Create the new Seek (patient) with city and region names
    const newSeek = new Seek({
      fullName,
      phone,
      password,
      age,
      city: cityExists.name, // Store city name
      region: regionExists.name, // Store region name
    });

    // Save the new Seek to the database
    await newSeek.save();
    await RefreshToken.create({ token, userRef: newSeek._id });
    // Return the success response
    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
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

// exports.createNewSeek = async (req, res) => {
//   const { fullName, phone , password , age , city , region } = req.body;
//   if(!password) return res
//   .status(409)
//   .json({ success: false, message: 'password should not empty' });
//   if(!fullName) return res
//   .status(409)
//   .json({ success: false, message: 'fullname should not empty' });
//   if(!phone) return res
//   .status(409)
//   .json({ success: false, message: 'phone should not empty' });
//   if(!age) return res
//   .status(409)
//   .json({ success: false, message: 'age should not empty' });
//   if(!city) return res
//   .status(409)
//   .json({ success: false, message: 'city should not empty' });
//   if(!region) return res
//   .status(409)
//   .json({ success: false, message: 'region should not empty' });
//   try {

//     const existSeek = await Seek.findOne({ phone });
//     if(existSeek)return res.status(400).json({success:false , messsage:'phone is already exist'})

//      const token = await jwt.sign({  role: 'user' }, process.env.JWT_SECRET);

//     await RefreshToken.create({ token });

//     const newSeek = new Seek({ fullName, phone , password , age , city , region });

//     await newSeek.save();
//     return res.status(200).json({
//       success: true,
//       message: 'user register succesfully',
//       token:token
//     });
//   } catch (err) {
//     console.error('Error registering user:', err);
//     if (err.name === 'ValidationError') {
//       const errors = Object.values(err.errors).map((e) => e.message);
//       return res
//         .status(400)
//         .json({ success: false, message: errors.join(', ') });
//     }
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };

exports.updateSickInfo = async (req, res) => {
  try {
    const { fullName, phone, age, city, region } = req.body;
    const id = req.params.id;

    let cityname, regionname;

    // Only validate city and region if both are provided
    if (city) {
      const existCity = await City.findById(city);
      if (!existCity) {
        return res
          .status(400)
          .json({ success: false, message: 'City not found' });
      }

      cityname = existCity.name;

      // If region is provided, validate it
      if (region) {
        const existRegion = existCity.regions.find(
          (r) => r._id.toString() === region
        );
        if (!existRegion) {
          return res.status(400).json({
            success: false,
            message: 'Region not found in the selected city',
          });
        }
        regionname = existRegion.name;
      }
    }

    const updateData = {
      fullName,
      phone,
      age,
    };

    // Only update city and region if they were provided
    if (cityname) updateData.cityname = cityname;
    if (regionname) updateData.regionname = regionname;

    await Seek.updateMany(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );

    res.status(200).json({ success: true, message: 'Updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
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
  if (!password)
    return res.status(400).json({ message: 'password is required' });
  try {
    const user = await Seek.findOne({ phone });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'phone is Not Correct' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'password is Not the same' });
    }

    const token = await jwt.sign(
      { id: user._id, role: 'user' },
      process.env.JWT_SECRET
    );

    await RefreshToken.create({ token, userRef: user._id });
    const data = user.toObject();
    delete data.password;
    delete data.resetCode;
    delete data.resetCodeExpires;
    delete data.notifications;
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data,
    });
  } catch (err) {
    console.error('Error logging in:', err);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
  }
};

exports.deleteSeekAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Incorrect password' });

    await Seek.findByIdAndDelete(user._id);

    res.status(200).json({ message: 'Account deleted successfully', data: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.loginPhar = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(403).json({ message: 'email is required' });
  }
  if (!password)
    return res.status(400).json({ message: 'password is required' });
  try {
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

    const token = await jwt.sign(
      { id: user._id, role: 'pharmatic' },
      '1001110'
    );

    await RefreshToken.create({ token, userRef: user._id });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    console.error('Error logging in:', err);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
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

  if (!user) return res.status(400).json({ message: 'User not found' });

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 20 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    from: 'nabd142025@gmail.com',
    to: email,
    subject: 'Password Reset Code',
    html: `<h4>Your password reset code is:</h4> <h2>${resetCode}</h2>`,
  });

  res.status(200).json({ message: 'Reset code sent to your email' });
};

exports.verifyCodePharmatic = async (req, res) => {
  const { email, code } = req.body;
  const user = await Pharmatic.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  res.status(200).json({ message: 'Code verified successfully' });
};

exports.resetPharmaPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Pharmatic.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();

  res.status(200).json({ message: 'Password reset successfully' });
};

exports.forgetPassForSick = async (req, res) => {
  const { email } = req.body;
  const user = await Seek.findOne({ email });

  if (!user) return res.status(400).json({ message: 'User not found' });

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 20 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    from: 'nabd142025@gmail.com',
    to: email,
    subject: 'Password Reset Code',
    html: `<h4>Your password reset code is:</h4> <h2>${resetCode}</h2>`,
  });

  res.status(200).json({ message: 'Reset code sent to your email' });
};

exports.verifyCodeSick = async (req, res) => {
  const { email, code } = req.body;
  const user = await Seek.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  res.status(200).json({ message: 'Code verified successfully' });
};

exports.resetSickPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Seek.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();

  res.status(200).json({ message: 'Password reset successfully' });
};

exports.addToFamousPhars = async (req, res) => {
  const { pharmaId } = req.body;

  try {
    const pharma = await Pharmatic.findByIdAndUpdate(
      pharmaId,
      { isFamous: true },
      { new: true }
    );

    if (!pharma) {
      return res.status(404).json({ message: 'pharma not found' });
    }

    res
      .status(200)
      .json({ message: 'pharma added to famous pharmas menu', pharma });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFamousPhars = async (req, res) => {
  try {
    // Find all doctors where 'isFamous' is true
    const famousPharmas = await Pharmatic.find({ isFamous: true });

    if (famousPharmas.length === 0) {
      return res.status(404).json({ message: 'No famous pharmas found' });
    }

    res.status(200).json({ famousPharmas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchPharmaticsByName = async (req, res) => {
  try {
    const { fullName } = req.query;

    if (!fullName) {
      return res
        .status(400)
        .json({ status: false, message: 'Please provide a name' });
    }
    const pharmatics = await Pharmatic.find({
      fullName: { $regex: fullName, $options: 'i' },
    });

    if (pharmatics.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: 'No matching pharmatics found' });
    }
    const pharmaciesWithRatings = pharmatics.map((pharma) => {
      const ratings = pharma.rate?.map((r) => r.rating) || [];
      const total = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating =
        ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

      return {
        ...pharma.toObject(),
        finalRate: parseFloat(averageRating),
      };
    });

    pharmaciesWithRatings.sort((a, b) => b.finalRate - a.finalRate);

    return res.status(200).json({ status: true, data:pharmaciesWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

// controllers/favouritesController.js

exports.togglePharmaFavourite = async (req, res) => {
  try {
    const { userId, pharmaId } = req.body;

    const pharma = await Pharmatic.findById(pharmaId);
    if (!pharma) {
      return res.status(404).json({ message: 'Pharma not found' });
    }

    const existingFavourite = await Favourite.findOne({ userId, pharmaId });

    if (existingFavourite) {
      existingFavourite.isFavourite = !existingFavourite.isFavourite;
      await existingFavourite.save();

      return res.status(200).json({
        message: existingFavourite.isFavourite
          ? 'Pharma added to favourites'
          : 'Pharma removed from favourites',
        isFavourite: existingFavourite.isFavourite,
      });
    } else {
      const newFavourite = new Favourite({
        userId,
        pharmaId,
        isFavourite: true,
      });
      await newFavourite.save();

      return res.status(200).json({
        message: 'Pharma added to favourites',
        isFavourite: true,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFavourites = async (req, res) => {
  try {
    const { userId } = req.params;

    const favourites = await Favourite.find({ userId, isFavourite: true })
      .populate({
        path: 'pharmaId',
        select: '-password -resetCode -resetCodeExpires -approved',
      })
      .exec();

    if (favourites.length === 0) {
      return res.status(404).json({ message: 'No favourite doctors found' });
    }

    res.status(200).json({
      message: 'Favourite doctors retrieved successfully',
      favourites,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFromFavo = async (req, res) => {
  try {
    const { cardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }
    const user = await Favourite.findByIdAndDelete(cardId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'Delete succesfully' });
  } catch (err) {
    return res.status(500).json({ message: `Server error ${err}` });
  }
};

const dayMapping2 = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

exports.getUserBookings = async (req, res) => {
  try {
    const { patientId } = req.params;

    const doctors = await Doctor.find({
      'booking.bookingHours.patientIDs.id': patientId,
    }).select('fullName specilizate booking');

    if (!doctors || doctors.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: 'No bookings found for this patient' });
    }

    let patientBookings = [];

    doctors.forEach((doctor) => {
      doctor.booking.forEach((day, idDay) => {
        day.bookingHours.forEach((hour, idHour) => {
          hour.patientIDs.forEach((patient) => {
            if (patient.id.toString() === patientId) {
              let dayname = dayMapping2[idDay];
              patientBookings.push({
                doctorId: doctor._id,
                doctorName: doctor.fullName,
                specialization: doctor.specilizate,
                dayname,
                idHour,
                appointmentDate: patient.date,
              });
            }
          });
        });
      });
    });

    res.status(200).json({ status: true, bookings: patientBookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

// exports.getPharmaInfo = async(req,res)=>{
//   try{
//     const id = req.params.id
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid User ID format' });
//     }
//     const pharma = await Pharmatic.findById(id)
//     if(!pharma){
//       return res.status(404).json({message:' user is not availble'})
//     }
//     return res.status(200).json({success:true , pharma })
//   }catch(err){
//     return res.status(500).json({message:'Server error'})
//   }
// }
