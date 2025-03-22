const Doctor = require('../model/doctor.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const RefreshToken = require('../model/RefreshToken.model');
const moment = require('moment')
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
  if (!Array.isArray(rangeBooking) || rangeBooking.length === 0) {
    return res.status(400).json({ error: "rangeBooking must be a valid array with elements." });
}
  try {
    const existingUser = await Doctor.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `Email already exists`,
      });
    }
     const token = await jwt.sign({  role: 'doctor' }, process.env.JWT_SECRET);
    
        await RefreshToken.create({ token });
    console.log(rangeBooking);
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
    const approvalLink = `http://147.93.106.92/api/Doctor/approve/doctor/${newUser._id}`;
    const rejectLink = `http://147.93.106.92/api/Doctor/reject/doctor/${newUser._id}`;
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
      .json({ success: true, message: `Registration request sent to admin` ,token:token });
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
exports.deleteDoctorAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    await Doctor.findByIdAndDelete(user._id);

    res.status(200).json({ message: "Account deleted successfully" , data:[] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}
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

exports.loginDoctor = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(403).json({ message: 'email is required' });
  }
  if(!password)
    return res.status(400).json({ message: 'password is required' });
  try {
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
    if(doctor.booking[idDay].bookingHours[idHour].patientIDs.length>=2)return res.status(404).json({message:'No appo provide'})

    const existingPatient = doctor.booking[idDay].bookingHours[
      idHour
    ].patientIDs.some((p) => p.id.toString() === patientId);
    const todayUTC = moment().utc();

    let nextAppointmentDate = todayUTC.clone().day(idDay);
    if (nextAppointmentDate.isBefore(todayUTC, 'day')) {
      nextAppointmentDate.add(7, 'days');
    }

    const range = doctor.rangeBooking.find((r) => r.day === idDay);
    if (!range) {
      return res
        .status(404)
        .json({ status: false, message: 'No rangeBooking for this day' });
    }

    const appointmentTimeUTC = moment
      .utc(nextAppointmentDate)
      .hour(range.start)
      .minute(0)
      .add(idHour * 30, 'minutes');

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

exports.updateDoctorInfo = async (req, res) => {
  try {
    const {
      fullName,
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

exports.forgetPassForDoctor = async (req, res) => {
  const { email } = req.body;
  const user = await Doctor.findOne({ email });

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

exports.verifyCodeDoctor = async (req, res) => {
  const { email, code } = req.body;
  const user = await Doctor.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
  }

  res.json({ message: "Code verified successfully" });
}


exports.resetDoctorPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Doctor.findOne({ email });

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