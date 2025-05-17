const Doctor = require('../model/doctor.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const Specialty = require('../model/Specialty.model');
const RefreshToken = require('../model/RefreshToken.model');
const City = require('../model/cities.model');
const FavouriteDoctor = require('../model/FavouriteDoctor.model');
const moment = require('moment');
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

exports.searchdoctorByName = async (req, res) => {
  try {
    const { fullName } = req.query;

    if (!fullName) {
      return res
        .status(400)
        .json({ status: false, message: 'Please provide a name' });
    }

    const doctor = await Doctor.find({
      fullName: { $regex: fullName, $options: 'i' },
    });

    if (doctor.length === 0) {
      return res
        .status(200)
        .json({ status: false, message: 'No matching doctor found' , data:[] });
    }

    return res.status(200).json({ status: true, data:doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

exports.createNewDoctor = async (req, res) => {
  const {
    fullName,
    email,
    password,
    city, // city ID
    region, // region ID
    address,
    phone,
    specId,
    NumberState,
  } = req.body;

  if (
    !fullName ||
    !email ||
    !password ||
    !city ||
    !region ||
    !address ||
    !phone ||
    !specId ||
    !NumberState
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'All fields are required' });
  }

  try {
    const existingUser = await Doctor.findOne({ email });
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
      const existSpec = await Specialty.find({ specId:specId });
    if (!existSpec) {
      return res.status(400).json({
        success: false,
        message: 'Specialty not found',
      });
    }
    const specName = existSpec[0].name;


    const newUser = new Doctor({
      fullName,
      email,
      password,
      city: cityExists.name,
      region: regionExists.name,
      address,
      phone,
      specilizate:specName,
      NumberState,
    });


    await newUser.save();
    const token = await jwt.sign({ _id:newUser._id , role: 'doctor' }, process.env.JWT_SECRET);
    await RefreshToken.create({ token, userRef: newUser._id });

    const approvalLink = `http://147.93.106.92:8080/api/Doctor/approve/doctor/${newUser._id}`;
    const rejectLink = `http://147.93.106.92:8080/api/Doctor/reject/doctor/${newUser._id}`;

    const mailOptions = {
      from: email,
      to: 'feadkaffoura@gmail.com',
      subject: 'طلب تسجيل جديد',
      html: `
        <h3>New Registration Request</h3>
        <p>Name: ${fullName}</p>
        <p>Email: ${email}</p>
        <p>Role: Doctor</p>
        <p>City: ${cityExists.name}</p>
        <p>Region: ${regionExists.name}</p>
        <p>Phone: ${phone}</p>
        <p>Specialization: ${specName}</p>
        <p>NumberState: ${NumberState}</p>
        <p>Click below to approve or reject:</p>
        <a href="${approvalLink}" style="color:green">Approve</a> | 
        <a href="${rejectLink}" style="color:red">Reject</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    // إرسال الاستجابة للفرونت إند
    res.status(200).json({
      success: true,
      message: 'Registration request sent to admin. Please wait for approval.',
      token: token,
    });
  } catch (err) {
    console.error('Error registering doctor:', err);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(', ') });
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.addToFamousDoctors = async (req, res) => {
  const { doctorId } = req.body;

  try {
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { isFamous: true },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({succes:true , message: 'Doctor not found' });
    }

    res
      .status(200)
      .json({ message: 'Doctor added to famous doctors menu', doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFamousDoctors = async (req, res) => {
  try {

    const famousDoctors = await Doctor.find({ isFamous: true });
    
    if (famousDoctors.length === 0) {
      return res.status(200).json({ message: 'No famous doctors found' ,data:[] });
    }

    const doctorswithRating = famousDoctors.map((fam)=>{
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
   
    res.status(200).json({succes:true , data:doctorswithRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.createBooking = async(req,res)=>{
//   try{
//    const  rangeBooking = req.body.rangeBooking
//    const {id} = req.params
//    if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid Doctor ID format' });
//     }
//    if (!Array.isArray(rangeBooking) || rangeBooking.length === 0) {
//     return res.status(400).json({ error: "rangeBooking must be a valid array with elements." });
// }
// const doctor = await Doctor.findById(id)
// if(!doctor){
//   return res.status(404).json({ error: "Doctor is not found" });
// }
// let booking = Array(7);
//     rangeBooking.map((bookingDay) => {
//       const countHalfHours = (bookingDay.end - bookingDay.start) * 2;
//       let bookingHours = Array(countHalfHours);
//       Array.from({ length: countHalfHours }, (_, i) => {
//         bookingHours.push({
//           idHour: i,
//           patientIDs: [],
//         });
//       });

//       booking.push({ bookingHours });
//     });
//     doctor.rangeBooking = rangeBooking
//     doctor.booking = booking
//     await doctor.save()
//     return res.status(200).json({ message: "Booking created successfully", doctor });
//   }catch(err){
//     return res.status(500).json({message:`err: ${err}`})
//   }
// }
const dayMapping = {
  الأحد: 0,
  الإثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

function convertTimeTo24Hour(timeString) {
  const match = timeString.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/);

  if (!match) return null; 

  let [_, hours, minutes, period] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10) / 60; 

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours + minutes;
}

function convertIdHourToTime(idHour, startHour) {
  let totalMinutes = startHour * 60 + idHour * 30;
  let hours = Math.floor(totalMinutes / 60);
  let minutes = totalMinutes % 60;
  let period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes === 0 ? '00' : minutes}${period}`;
}

exports.getAvailableAppointments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Doctor ID format' });
    }

    const doctor = await Doctor.findById(id).select('rangeBooking booking');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    let availableAppointments = [];

    doctor.booking.forEach((dayBooking, index) => {
      if (dayBooking && dayBooking.bookingHours) {
        let availableHours = dayBooking.bookingHours.filter(
          (hour) => hour.patientIDs.length < 2
        );

        if (availableHours.length > 0) {
          availableAppointments.push({
            day: doctor.rangeBooking[index]?.day,
            availableHours: availableHours.map((hour) => ({
              idHour: hour.idHour,
              startTime: convertIdHourToTime(
                hour.idHour,
                doctor.rangeBooking[index]?.start
              ),
            })),
          });
        }
      }
    });

    return res
      .status(200)
      .json({ message: 'Available appointments', data: availableAppointments });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
};


exports.getAllAppointments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Doctor ID format' });
    }

    const doctor = await Doctor.findById(id).select('rangeBooking booking');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    let allAppointments = [];

 
    for (let i = 0; i < 7; i++) {
      const rangeDay = doctor.rangeBooking[i];
      const bookingDay = doctor.booking[i];

      const day = rangeDay?.day ?? i; // fallback to index if missing

      let appointments = [];

      if (
        rangeDay &&
        bookingDay &&
        bookingDay.bookingHours &&
        Array.isArray(bookingDay.bookingHours)
      ) {
        appointments = bookingDay.bookingHours.map((hour) => ({
          idHour: hour.idHour,
          startTime: convertIdHourToTime(hour.idHour, rangeDay.start),
          patientCount: hour.patientIDs.length,
          patientIDs: hour.patientIDs,
        }));
      }

      allAppointments.push({
        day,
        appointments,
      });
    }

    return res.status(200).json({
      message: 'All appointments (booked and available)',
      data: allAppointments,
    });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
};



exports.updateBookingRange = async (req, res) => {
  try {
    const { id } = req.params;
    const rangeBooking = req.body.rangeBooking;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Doctor ID format' });
    }

    if (!Array.isArray(rangeBooking) || rangeBooking.length === 0) {
      return res
        .status(400)
        .json({ error: 'rangeBooking must be a valid array with elements.' });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const formattedRangeBooking = rangeBooking.map(({ day, start, end }) => ({
      day: dayMapping[day] ?? null,
      start: convertTimeTo24Hour(start),
      end: convertTimeTo24Hour(end),
    }));

    if (
      formattedRangeBooking.some(
        (rb) => rb.day === null || rb.start === null || rb.end === null
      )
    ) {
      return res.status(400).json({ error: 'Invalid day or time format.' });
    }

    let booking = Array(7)
      .fill(null)
      .map(() => ({ bookingHours: [] }));

    formattedRangeBooking.forEach((bookingDay) => {
      const countHalfHours = (bookingDay.end - bookingDay.start) * 2;
      let bookingHours = Array.from({ length: countHalfHours }, (_, i) => ({
        idHour: i,
        patientIDs: [],
      }));

      booking[bookingDay.day] = { bookingHours };
    });

    doctor.rangeBooking = formattedRangeBooking;
    doctor.booking = booking;
    await doctor.save();

    return res
      .status(200)
      .json({ message: 'Booking updated successfully', doctor });
  } catch (err) {
    console.error('Error updating booking range:', err);
    return res.status(500).json({ message: `Error: ${err}` });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const rangeBooking = req.body.rangeBooking;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Doctor ID format' });
    }

    if (!Array.isArray(rangeBooking) || rangeBooking.length === 0) {
      return res
        .status(400)
        .json({ error: 'rangeBooking must be a valid array with elements.' });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor is not found' });
    }
    const formattedRangeBooking = rangeBooking.map(({ day, start, end }) => ({
      day: dayMapping[day] ?? null,
      start: convertTimeTo24Hour(start),
      end: convertTimeTo24Hour(end),
    }
  ));

    if (
      formattedRangeBooking.some(
        (rb) => rb.day === null || rb.start === null || rb.end === null
      )
    ) {
      return res.status(400).json({ error: 'Invalid day or time format.' });
    }

    let booking = Array(7)
      .fill(null)
      .map(() => ({ bookingHours: [] }));

    formattedRangeBooking.forEach((bookingDay) => {
      const countHalfHours = (bookingDay.end - bookingDay.start) * 2;
      let bookingHours = Array.from({ length: countHalfHours }, (_, i) => ({
        idHour: i,
        patientIDs: [],
      }));

      booking[bookingDay.day] = { bookingHours };
    });

    doctor.rangeBooking = formattedRangeBooking;
    doctor.booking = booking;
    await doctor.save();

    return res
      .status(200)
      .json({ message: 'Booking created successfully', doctor });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err}` });
  }
};
exports.deleteDoctorAccount = async (req, res) => {
  try {
    const user = req.user;

    await Doctor.findByIdAndDelete(user._id);

    res.status(200).json({ message: 'Account deleted successfully', data: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
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
      login.status(200)
      .json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.loginDoctor = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(403).json({ message: 'Email is required' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const user = await Doctor.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Email is not correct' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Password is not correct' });
    }

    await RefreshToken.deleteMany({ userRef: user._id });

    const data = user.toObject({ getters: true, versionKey: false });
    delete data.password;
    delete data.resetCode;
    delete data.resetCodeExpires;

    const token = jwt.sign({ _id: user._id, role: 'doctor' }, '1001110');

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

    const existingRatingIndex = doctor.rate.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
 
      doctor.rate[existingRatingIndex].rating = rating;
      doctor.rate[existingRatingIndex].review = review;
      doctor.rate[existingRatingIndex].date = new Date();
    } else {
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

    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = Math.round((total / ratings.length).toFixed(1))

    res.status(200).json({succes:true , doctorId, finalRate: averageRating});
  } catch (error) {
    console.error('Error calculating rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const userId = req.user._id;
    const { city, region, spec } = req.params;

    const existCity = await City.findById(city);
    if (!existCity)
      return res.status(400).json({ success: false, message: 'City not found' });

    const existRegion = existCity.regions.find(
      (r) => r._id.toString() === region
    );
    if (!existRegion)
      return res.status(400).json({
        success: false,
        message: 'Region not found in the selected city',
      });

    const existSpec = await Specialty.findOne({ specId: spec });
    if (!existSpec) {
      return res.status(400).json({
        success: false,
        message: 'Specialty not found in the selected city',
      });
    }

    const cityname = existCity.name;
    const regionname = existRegion.name;
    const specName = existSpec.name;

    const query = { city: cityname, region: regionname, specilizate: specName };
    const doctors = await Doctor.find(query);

    if (!doctors || doctors.length === 0) {
      return res.status(200).json({ status: true, message: 'No doctors found' , data:[] });
    }

    const favouriteDoctors = await FavouriteDoctor.find({ userId });
    const favouriteDoctorIds = favouriteDoctors.map((fav) => fav.doctorId.toString());

    const doctorsWithFavStatus = doctors.map((doctor) => {
      const ratings = doctor.rate?.map((r) => r.rating) || [];
      const total = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating =
        ratings.length > 0 ? Math.round((total / ratings.length).toFixed(1)) : 0

      const doctorObj = doctor.toObject({ getters: true, versionKey: false });

      doctorObj.isFavourite = favouriteDoctorIds.includes(doctor._id.toString());
      doctorObj.finalRate = averageRating;

      return doctorObj;
    });

    res.status(200).json({ status: true, data: doctorsWithFavStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
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
    if (idDay >= doctor.booking.length || idDay < 0 || !doctor.booking[idDay]) {
      return res.status(404).json({ status: false, message: 'Day not found' });
    }

    const hourIndex = doctor.booking[idDay].length;
    if (
      !doctor.booking[idDay].bookingHours ||
      idHour >= doctor.booking[idDay].bookingHours.length ||
      idHour < 0
    ) {
      return res.status(404).json({ status: false, message: 'Hour not found' });
    }
    if (!doctor.booking[idDay].bookingHours[idHour]) {
      return res
        .status(404)
        .json({ status: false, message: 'Hour slot not found' });
    }
    if (!doctor.booking[idDay].bookingHours[idHour].patientIDs) {
      doctor.booking[idDay].bookingHours[idHour].patientIDs = []; // Initialize if empty
    }

    if (doctor.booking[idDay].bookingHours[idHour].patientIDs.length >= 2) {
      return res.status(400).json({ message: 'No appointment available' });
    }

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

exports.deleteBookByPatient = async (req, res) => {
  try {
    const { doctorId, patientId, idDay, idHour } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ status: false, message: 'Doctor not found' });
    }

    if (
      idDay >= doctor.booking.length ||
      idDay < 0 ||
      !doctor.booking[idDay] ||
      !doctor.booking[idDay].bookingHours ||
      idHour >= doctor.booking[idDay].bookingHours.length ||
      idHour < 0 ||
      !doctor.booking[idDay].bookingHours[idHour]
    ) {
      return res
        .status(400)
        .json({ status: false, message: 'Invalid day or hour slot' });
    }

    const slot = doctor.booking[idDay].bookingHours[idHour];
    const index = slot.patientIDs.findIndex(
      (p) => p.id.toString() === patientId
    );

    if (index === -1) {
      return res
        .status(404)
        .json({ status: false, message: 'Booking not found for this patient' });
    }

    slot.patientIDs.splice(index, 1); // Remove the booking
    await doctor.save();

    return res
      .status(200)
      .json({ status: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error in deleteBookByPatient:', error);
    return res.status(500).json({ status: false, message: 'Server error' });
  }
};

exports.updateDoctorInfo = async (req, res) => {
  try {
    const id = req.params.id;
    const updateFields = {};

    const {
      fullName,
      city,
      region,
      address,
      specId,
      NumberState,

    } = req.body;

    if (fullName) updateFields.fullName = fullName;
    if (address) updateFields.address = address;
    if (specId) {
      const existSpec = await Specialty.find({specId:specId})
      if(!existSpec){
        return res.status(400).json({
          success: false,
          message: 'Specialty not found in the selected city',
        });
      }
      const specName = existSpec[0].name
      updateFields.specilizate = specName
    }
    if (NumberState) updateFields.NumberState = NumberState;

    if (city && region) {
      const existCity = await City.findById(city);
      if (!existCity)
        return res
          .status(400)
          .json({ success: false, message: 'City not found' });

      const existRegion = existCity.regions.find(
        (r) => r._id.toString() === region
      );
      if (!existRegion)
        return res.status(400).json({
          success: false,
          message: 'Region not found in the selected city',
        });

      updateFields.city = existCity.name; 
      updateFields.region = existRegion.name; 
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedDoctor) {
      return res
        .status(404)
        .json({ success: false, message: 'Doctor not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor information updated successfully',
      doctor: updatedDoctor,
    });
  } catch (err) {
    console.error('Error updating doctor:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


exports.forgetPassForDoctor = async (req, res) => {
  const { email } = req.body;
  const user = await Doctor.findOne({ email });

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

  res.json({ message: 'Reset code sent to your email' });
};

exports.verifyCodeDoctor = async (req, res) => {
  const { email, code } = req.body;
  const user = await Doctor.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  res.json({ message: 'Code verified successfully' });
};

exports.resetDoctorPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Doctor.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();

  res.json({ message: 'Password reset successfully' });
};

exports.toggleDoctorFavourite = async (req, res) => {
  try {
    const {userId , specId } = req.body;

    const pharma = await Doctor.findById(specId);
    if (!pharma) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const existingFavourite = await FavouriteDoctor.findOne({
      userId,
      specId,
    });

    if (existingFavourite) {
      existingFavourite.isFavourite = !existingFavourite.isFavourite;
      await existingFavourite.save();

      return res.status(200).json({
        message: existingFavourite.isFavourite
          ? 'doctor added to favourites'
          : 'doctor removed from favourites',
        isFavourite: existingFavourite.isFavourite,
      });
    } else {
      const newFavourite = new FavouriteDoctor({
        userId,
        specId,
        isFavourite: true,
      });
      await newFavourite.save();

      return res.status(200).json({
        message: 'doctor added to favourites',
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

    const favourites = await FavouriteDoctor.find({ userId, isFavourite: true })
    .populate({
      path:'doctorId',
      select:'-password -resetCode -resetCodeExpires -approved'
    })
      .exec();

    const favouritesWithRating = favourites.map((fav) => {
      const doctor = fav.doctorId;
      let finalRate = 0;

      if (doctor && doctor.rate && doctor.rate.length > 0) {
        const totalRating = doctor.rate.reduce((sum, r) => sum + r.rating, 0);
        finalRate = Math.round((totalRating / doctor.rate.length).toFixed(1))
      }

      return {
        ...fav._doc,
        doctorId: {
          ...doctor._doc,
          finalRate: finalRate, 
        },
      };
    });

    res.status(200).json({
      message: 'Favourite doctors retrieved successfully',
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
    return res.status(200).json({ message: 'Delete succesfully' });
  } catch (err) {
    return res.status(500).json({ message: `Server error ${err}` });
  }
};

exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.find({}).sort({ specId: 1 });
    res.status(200).json({ success: true, data: specialties });
  } catch (error) {
    res.status(500).json({ error: `Server error ${error.message}` });
  }
};

// exports.getDoctorInfo = async(req,res)=>{
//   try{
//     const id = req.params.id
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid User ID format' });
//     }
//     const pharma = await Doctor.findById(id)
//     if(!pharma){
//       return res.status(404).json({message:' user is not availble'})
//     }
//     return res.status(200).json({success:true , pharma })
//   }catch(err){
//     return res.status(500).json({message:'Server error'})
//   }
// }
