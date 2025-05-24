const Pharmatic = require('../model/auth.model');
const Seek = require('../model/seek.model');
const Doctor = require('../model/doctor.model');
const Favourite = require('../model/FavouritePharma.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const City = require('../model/cities.model');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
const { client } = require('../utils/whatsapp');
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
    const existingUser = await Pharmatic.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    const cityExists = await City.findById(city);
    if (!cityExists)
      return res
        .status(400)
        .json({ success: false, message: 'City not found' });

    const regionExists = cityExists.regions.find(
      (r) => r._id.toString() === region
    );
    if (!regionExists)
      return res.status(400).json({
        success: false,
        message: 'Region not found in the selected city',
      });



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

    await newUser.save();
    const token = jwt.sign({ _id: newUser._id, role: 'pharmatic' }, process.env.JWT_SECRET );    

    await RefreshToken.create({ token, userRef: newUser._id });

    const approvalLink = `http://147.93.106.92:8080/api/Pharmatic/approve/pharmatic/${newUser._id}`;
    const rejectLink = `http://147.93.106.92:8008/api/Pharmatic/reject/pharmatic/${newUser._id}`;

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
      data: token,
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

    const user = req.user;
    if(!user._id)return res.status(200).json({succes:false , message: 'user not found', data: [] });

    await Pharmatic.findByIdAndDelete(user._id);

    res.status(200).json({succes:true , message: 'Account deleted successfully', data: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
exports.ratePharmatic = async (req, res) => {
  try {
    const pharmaticId = req.params.pharmaticId;
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
      succes:true,
      message: 'Rating added successfully',
      data: pharmatic.rate, // Returns all ratings, including the new one
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPharmas = async (req, res) => {
  const { city, region } = req.params;
  const userId = req.user._id;
console.log(userId)
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
      return res.status(200).json({ status: true, message: 'No result' ,data:[] });
    }

const favouriteDocs = await Favourite.find({
  userId,
  isFavourite: true,
}).select('specId');



const userFavourites = favouriteDocs.map((fav) => fav.specId.toString());


const pharmaciesWithRatings = findPharma.map((pharma) => {
  const ratings = pharma.rate?.map((r) => r.rating) || [];
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  const averageRating = ratings.length
    ? Math.round((total / ratings.length).toFixed(1))
    : 0;

  const isFav = userFavourites.includes(pharma._id.toString());
  console.log(`Pharma ID: ${pharma._id}, Is Favourite: ${isFav}`);

  return {
    ...pharma.toObject(),
    finalRate: averageRating,
    isfavourite: isFav,
  };
});
    
    pharmaciesWithRatings.sort((a, b) => b.finalRate - a.finalRate);
    
    return res.status(200).json({ succes: true,message:'' , data: pharmaciesWithRatings });
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

    res.status(200).json({ success: true, message: 'Updated Successfully' ,data:[] });
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
      .json({ success: true, message: 'User approved successfully' , data:user});
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
      .json({ success: true, message: 'User rejected successfully' , data:[] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



exports.createNewSeek = async (req, res) => {
  const {
    fullName,
    phone,
    password,
    age,
    city, // city ID
    region, // region ID
  } = req.body;

  if (!password)
    return res.status(409).json({ success: false, message: 'Password should not be empty' });

  if (!fullName)
    return res.status(409).json({ success: false, message: 'Full name should not be empty' });

  if (!phone)
    return res.status(409).json({ success: false, message: 'Phone should not be empty' });

  if (!age)
    return res.status(409).json({ success: false, message: 'Age should not be empty' });

  if (!city)
    return res.status(409).json({ success: false, message: 'City ID is required' });

  if (!region)
    return res.status(409).json({ success: false, message: 'Region ID is required' });

  try {
    const existSeek = await Seek.findOne({ phone });
    if (existSeek)
      return res.status(400).json({ success: false, message: 'Phone number is already taken' });

    const cityExists = await City.findById(city);
    if (!cityExists)
      return res.status(400).json({ success: false, message: 'City not found' });

    const regionExists = cityExists.regions.find(r => r._id.toString() === region);
    if (!regionExists)
      return res.status(400).json({ success: false, message: 'Region not found in the selected city' });
    
    const newSeek = new Seek({
      fullName:fullName,
      phone,
      password,
      age,
      city:cityExists.name,
      region:regionExists.name,
      accountDate: new Date(),
    });

    await newSeek.save();

    const token = jwt.sign({ _id: newSeek._id, role: 'user' }, process.env.JWT_SECRET);
    await RefreshToken.create({ token, userRef: newSeek._id });

    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        _id: newSeek._id,
        fullName: newSeek.fullName,
        city: newSeek.city,
        region: newSeek.region,
      },
    });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


exports.updateSickInfo = async (req, res) => {
  try {
    const { fullName, phone, age, city, region } = req.body;
    const id = req.params.id;

    let cityname, regionname;

    if (city) {
      const existCity = await City.findById(city);
      if (!existCity) {
        return res
          .status(400)
          .json({ success: false, message: 'City not found' });
      }

      cityname = existCity.name;

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

    if (cityname) updateData.cityname = cityname;
    if (regionname) updateData.regionname = regionname;

    await Seek.updateMany(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );

    res
      .status(200)
      .json({
        success: true,
        message: 'Updated successfully',
        data: updateData,
      });
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
  const { phone, password , firebase_token  } = req.body;

  if (!phone) {
    return res.status(403).json({ message: 'phone is required' });
  }
  if (!password)
    return res.status(400).json({ message: 'password is required' });
   if (!firebase_token)
    return res.status(400).json({ message: 'firebase_token is required' });
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
 await Seek.findByIdAndUpdate(user._id, {
      firebasetoken: firebase_token,
    });
    const token = await jwt.sign(
      { _id: user._id, role: 'user' },
      process.env.JWT_SECRET
    );

    
    await RefreshToken.deleteMany({ userRef: user._id });
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

    const user = req.user;

    if(!user._id)return res.status(404).json({succes:false , message:'Invalid ID' , data:[]})

    await Seek.findByIdAndDelete(user._id);

    res.status(200).json({ succes:true , message: 'Account deleted successfully', data: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.loginPhar = async (req, res) => {
  const { email, password , firebase_token } = req.body;

  if (!email) {
    return res.status(403).json({ message: 'Email is required' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const user = await Pharmatic.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Email is not correct' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Password is not correct' });
    }
 await Pharmatic.findByIdAndUpdate(user._id, {
        firebasetoken: firebase_token,
      });
    await RefreshToken.deleteMany({ userRef: user._id });

    const data = user.toObject({ getters: true, versionKey: false });
    delete data.password;
    delete data.resetCode;
    delete data.resetCodeExpires;


    const token = jwt.sign(
      { _id: user._id, role: 'pharmatic' },
      '1001110',

    );

    await RefreshToken.create({ token, userRef: user._id });

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

exports.logoutSpec = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(' ')[1];
    const userId = req.user?._id; 
console.log('Decoded user in logoutSpec:', req.user);
    if (!token || !userId) {
      return res.status(400).json({ success: false, message: 'Token or user not provided' });
    }


    await Blacklist.create({ token });


    await RefreshToken.deleteMany({ userRef: userId });

    return res.status(200).json({ success: true, message: 'Logged out successfully' , data:[] });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.logoutSeek = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1];
     const userId = req.user?._id; 
   if (!token || !userId) {
      return res.status(400).json({ success: false, message: 'Token or user not provided' });
    }
 await Blacklist.create({ token });


    await RefreshToken.deleteMany({ userRef: userId });

  res.status(200).json({ success: true, message:'logout succesfully' , data:[] });
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

  res.status(200).json({ succes:true , message: 'Reset code sent to your email' ,data:[] });
};

exports.verifyCodePharmatic = async (req, res) => {
  const { email, code } = req.body;
  const user = await Pharmatic.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  res.status(200).json({succes:true , message: 'Code verified successfully' , data:[] });
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

  res.status(200).json({succes:true , message: 'Password reset successfully' , data:[] });
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
      .json({succes:true , message: 'pharma added to famous pharmas menu', data:pharma });
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
      return res.status(200).json({ succes:true , message: 'No famous pharmas found' , data:[] });
    }

    res.status(200).json({succes:true , message:'' , data:famousPharmas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFamousPhars = async (req, res) => {
  try {

    const famousPharmas = await Pharmatic.find({ isFamous: true });
    
    if (famousPharmas.length === 0) {
      return res.status(200).json({succes:true , message: 'No famous Pharmas found' ,data:[] });
    }

    const PharamswithRating = famousPharmas.map((fam)=>{
      let finalRate =0
      if(fam.rate && fam.rate.length>0){
        const totalRating = fam.rate.reduce((sum,r)=> sum+r.rating,0)
        finalRate = Math.round((totalRating / fam.rate.length).toFixed(1))
      }
      return{
        ...fam._doc,
        finalRate:finalRate
      }
    })
   
    res.status(200).json({succes:true , message:'' , data:PharamswithRating });
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
        .status(200)
        .json({ status: true, message: 'No matching pharmatics found' ,data:[] });
    }
    const pharmaciesWithRatings = pharmatics.map((pharma) => {
      const ratings = pharma.rate?.map((r) => r.rating) || [];
      const total = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating =
        ratings.length > 0 ? Math.round((total / ratings.length).toFixed(1)) : 0;
      const pharmaObj = pharma.toObject()
      delete pharmaObj.password
      delete pharmaObj.resetCode
      delete pharmaObj.resetCodeExpires
      delete pharmaObj.rate
      return {
        ...pharmaObj,
        finalRate: averageRating,
      };
    });

    pharmaciesWithRatings.sort((a, b) => b.finalRate - a.finalRate);
    
    return res.status(200).json({ status: true,message:'',data:pharmaciesWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};



exports.togglePharmaFavourite = async (req, res) => {
  try {
    const { userId, specId } = req.body;

    const pharma = await Pharmatic.findById(specId);
    if (!pharma) {
      return res.status(404).json({ message: 'Pharma not found' });
    }

    const existingFavourite = await Favourite.findOne({ userId, specId });

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
        specId,
        isFavourite: true,
      });
      await newFavourite.save();

      return res.status(200).json({
        succes:true,
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
        path:'specId',
        select:'-password -resetCode -resetCodeExpires -approved'
      })
      .exec();

    const favouritesWithRating = favourites.map((fav) => {
      const pharma = fav.specId;
      let finalRate = 0;

      if (pharma && pharma.rate && pharma.rate.length > 0) {
        const totalRating = pharma.rate.reduce((sum, r) => sum + r.rating, 0);
        finalRate = Math.round((totalRating / pharma.rate.length).toFixed(1))
      }

      return {
        
          ...pharma._doc,
          finalRate: finalRate, 
      };
    });

    res.status(200).json({
      succes:true,
      message: 'Favourite pharmas retrieved successfully',
      data: favouritesWithRating,
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
    return res.status(200).json({ succes:true , message: 'Delete succesfully' ,data:[] });
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
        .status(200)
        .json({ status: true, message: 'No bookings found for this patient' ,data:[]});
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

    res.status(200).json({ succes: true,message:'', data: patientBookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


exports.forgotPassword = async (req, res) => {
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

  try {
    const user = await Seek.findOne({ phone });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    const resetCode = Math.floor(100000 + Math.random() * 900000); 
    
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    const formattedPhone = `${phone}@c.us`; 
    const message = `🔒 كود استعادة كلمة المرور الخاص بك هو: ${resetCode}\nصالح لمدة 10 دقائق.`;

    await client.sendMessage(formattedPhone, message);

    res.json({ success: true, message: 'Reset code sent via WhatsApp' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp)
    return res.status(400).json({ success: false, message: 'Phone and OTP code are required' });

  try {
    const user = await Seek.findOne({ phone });

    if (!user)
      return res.status(400).json({ success: false, message: 'User not found' });

    if (!user.resetCode || !user.resetCodeExpires)
      return res.status(400).json({ success: false, message: 'No reset code found. Please request a new one.' });

    if (user.resetCode !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });

    if (Date.now() > user.resetCodeExpires)
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });

    const tokenPayload = { userId: user._id, phone: user.phone };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '10m' });

    res.status(200).json({ success: true, message: 'OTP verified successfully', token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword)
    return res.status(400).json({ success: false, message: 'Token, new password, and confirm password are required' });

  if (newPassword !== confirmPassword)
    return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Seek.findById(decoded.userId);
    if (!user)
      return res.status(400).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });

  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};


