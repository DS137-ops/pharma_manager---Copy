const Pharmatic = require('../model/auth.model');
const Seek = require('../model/seek.model');
const Doctor = require('../model/doctor.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');

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
  if(!fullName || !email || !password || !city || !region || !address || !phone || !StartJob || !EndJob){
    return res.status(404).json({success:false , message:'All fields are required'})
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
    const approvalLink = `https://pharma-manager-copy-2.onrender.com/api/approve/pharmatic/${newUser._id}`;
    const rejectLink = `https://pharma-manager-copy-2.onrender.com/api/reject/pharmatic/${newUser._id}`;
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
exports.ratePharmatic = async (req, res) => {
  try {
    const { pharmaticId } = req.params;
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

    // تأكد من أن rate هو مصفوفة
    if (!pharmatic.rate) {
      pharmatic.rate = [];
    }

    // التحقق مما إذا كان المستخدم قد قيم سابقًا
    const existingRatingIndex = pharmatic.rate.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
      // تحديث التقييم الحالي
      pharmatic.rate[existingRatingIndex].rating = rating;
      pharmatic.rate[existingRatingIndex].review = review;
      pharmatic.rate[existingRatingIndex].date = new Date();
    } else {
      // إضافة تقييم جديد
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
    const pharmaticId = req.params.pharmaticId;
    const pharmatic = await Pharmatic.findById(pharmaticId);
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
    rangeBooking,
  } = req.body;

  try {
    const existingUser = await Doctor.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `Email already exists`,
      });
    }
    let booking = Array(7);
    rangeBooking.map((bookingDay) => {
      const countHalfHours = (bookingDay.end - bookingDay.start) * 2;
      let bookingHours = Array(countHalfHours);
      Array.from({ length: countHalfHours }, (_, i) => {
        bookingHours.push({
          idHour: i,
          patientIDs: [],
        });
      });

      booking.push({ bookingHours });
    });

    newUser = new Doctor({
      fullName,
      email,
      password,
      city,
      region,
      address,
      phone,
      specilizate,
      NumberState,
      rangeBooking,
      booking,
    });
    //pharma-manager-copy-2.onrender.com
    await newUser.save();
    const approvalLink = `https://pharma-manager-copy-2.onrender.com/api/approve/doctor/${newUser._id}`;
    const rejectLink = `https://pharma-manager-copy-2.onrender.com/api/reject/doctor/${newUser._id}`;
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
          <p>Click below to approve or reject:</p>
          <a href="${approvalLink}" style="color:green">Approve</a> | <a href="${rejectLink}" style="color:red">Reject</a>
        `,
    };
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ success: true, message: `Registration request sent to admin` });
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
const moment = require('moment');
exports.createNewBook = async (req, res) => {
  try {
    const { doctorId, patientId, idDay, idHour } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ status: false, message: 'Doctor not found' });
    }

    const dayIndex = doctor.booking.length;
    if (idDay > dayIndex || idDay < 0) {
      return res.status(404).json({ status: false, message: 'Day not found' });
    }

    const hourIndex = doctor.booking[idDay].length;
    if (idDay > hourIndex || idDay < 0) {
      return res.status(404).json({ status: false, message: 'Hour not found' });
    }

    const existingPatient = doctor.booking[idDay].bookingHours[
      idHour
    ].patientIDs.some((p) => p.id.toString() === patientId);

    const todayUTC = moment().utc();

    // حساب اليوم القادم المناسب بناءً على idDay
    let nextAppointmentDate = todayUTC.clone().day(idDay);
    if (nextAppointmentDate.isBefore(todayUTC, 'day')) {
      nextAppointmentDate.add(7, 'days'); // إذا اليوم المحدد مرّ، اختار الأسبوع القادم
    }

    // البحث عن وقت البدء من rangeBooking
    const range = doctor.rangeBooking.find((r) => r.day === idDay);
    if (!range) {
      return res
        .status(404)
        .json({ status: false, message: 'No rangeBooking for this day' });
    }

    // حساب وقت الموعد بالـ UTC
    const appointmentTimeUTC = moment
      .utc(nextAppointmentDate)
      .hour(range.start) // ضبط الساعة بناءً على rangeBooking.start
      .minute(0) // ضبط الدقائق إلى 0
      .add(idHour * 30, 'minutes'); // حساب وقت الموعد

    if (!existingPatient) {
      doctor.booking[idDay].bookingHours[idHour].patientIDs.push({
        id: patientId,
        date: appointmentTimeUTC.toDate(),
      });

      await doctor.save();
      return res
        .status(200)
        .json({ status: true, message: 'Booking successful' });
    } else {
      return res.status(400).json({
        status: false,
        message: 'Patient already booked in this slot',
      });
    }
  } catch (error) {
    console.error('Error in createNewBook:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

exports.approveDoctor = async (req, res) => {
  try {
    const user = await Doctor.findById(req.params.id);
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
          <h3>تمت الموافقة على طلبك بنجاح </h3>
          <h5>مع أطيب التمنيات</h5>
        `,
    };
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ success: true, user, message: 'User approved successfully' });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: `Internal server error ${err}` });
  }
};
exports.rejectDoctor = async (req, res) => {
  try {
    const user = await Doctor.findById(req.params.id);
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
              <h3>لم تتم الموافقة على طلبك يرجى إعادة تفقد البيانات وإرسال الطلب مجددا </h3>
              <h5>مع أطيب التمنيات</h5>
            `,
    };
    await transporter.sendMail(mailOptions);
    await Doctor.deleteOne({ _id: req.params.id });

    res
      .status(200)
      .json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
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
    RefreshToken.create({ token, userRef: newSeek._id });
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
    const token = await jwt.sign(
      { id: user._id, role: 'pharmatic' },
      '1001110'
    );
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
  await RefreshToken.deleteOne({ newSeek });
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
  try {
    const city = req.params.city,
      region = req.params.region,
      spec = req.params.spec;

    const query = { city: city, region: region, specilizate: spec };

    const doctors = await Doctor.find(query);

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ status: false, message: 'No result' });
    }

    const currentDate = new Date();

    for (const doctor of doctors) {
      for (const booking of doctor.booking) {
        for (const hour of booking.bookingHours) {
          hour.patientIDs = hour.patientIDs.filter(
            (patient) => patient.date >= currentDate
          );
        }
      }
      await doctor.save();
    }

    res.status(200).json({ status: true, findDoctor: doctors });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Doctor.findOne({ email });
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

    const token = await jwt.sign({ id: user._id, role: 'doctor' }, '1001110');
    RefreshToken.create({ token });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res
      .status(500)
      .json({ success: false, message: `Internal server error ${err}` });
  }
};

exports.rateDoctor = async (req, res) => {
  try {
    const { DoctorId } = req.params;
    const { userId, rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(DoctorId)) {
      return res.status(400).json({ message: 'Invalid Doctor ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: 'Rating must be between 1 and 5' });
    }
    const doctor = await Doctor.findById(DoctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'doctor not found' });
    }

    // تأكد من أن rate هو مصفوفة
    if (!doctor.rate) {
      doctor.rate = [];
    }

    // التحقق مما إذا كان المستخدم قد قيم سابقًا
    const existingRatingIndex = doctor.rate.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
      // تحديث التقييم الحالي
      doctor.rate[existingRatingIndex].rating = rating;
      doctor.rate[existingRatingIndex].review = review;
      doctor.rate[existingRatingIndex].date = new Date();
    } else {
      // إضافة تقييم جديد
      doctor.rate.push({ userId, rating, review, date: new Date() });
    }

    await doctor.save();

    res
      .status(200)
      .json({ message: 'Rating submitted successfully', data: doctor.rate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFinalRateforDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get all ratings
    const ratings = doctor.rate.map((r) => r.rating);

    if (ratings.length === 0) {
      return res.json({
        doctorId,
        finalRate: 0,
        message: 'No ratings available',
      });
    }

    // Calculate average rating
    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = (total / ratings.length).toFixed(1); // Keep 1 decimal place

    res.json({ doctorId, finalRate: parseFloat(averageRating) });
  } catch (error) {
    console.error('Error calculating rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateDoctorInfo = async (req, res) => {
  try {
    const {
      fullName,
      password,
      city,
      region,
      address,
      phone,
      specilizate,
      NumberState,
      schedule,
    } = req.body;
    const id = req.params.id;
    const scheduleSlots = {};
    if (schedule && typeof schedule === 'object') {
      Object.entries(schedule).forEach(([day, times]) => {
        if (times.startTime && times.endTime) {
          scheduleSlots[day] = generateTimeSlots(
            times.startTime,
            times.endTime
          );
        } else {
          scheduleSlots[day] = [];
        }
      });
    }
    await Doctor.updateMany(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          fullName,
          password,
          city,
          region,
          address,
          phone,
          specilizate,
          NumberState,
          schedule,
          scheduleSlots,
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
