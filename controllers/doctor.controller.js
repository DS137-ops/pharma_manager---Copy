const Doctor = require('../model/doctor.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const RefreshToken = require('../model/RefreshToken.model');
const City = require('../model/cities.model');
const FavouriteDoctor = require('../model/FavouriteDoctor.model');
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


exports.searchdoctorByName = async (req, res) => {
  try {
    const { fullName } = req.query;

    if (!fullName) {
      return res.status(400).json({ status: false, message: 'Please provide a name' });
    }

    const doctor = await Doctor.find({
      fullName: { $regex: fullName, $options: 'i' }
    });

    if (doctor.length === 0) {
      return res.status(404).json({ status: false, message: 'No matching doctor found' });
    }

    return res.status(200).json({ status: true, doctor });
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
    city,   // city ID
    region, // region ID
    address,
    phone,
    specilizate,
    NumberState,
  } = req.body;

  if (!fullName || !email || !password || !city || !region || !address || !phone || !specilizate || !NumberState) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const existingUser = await Doctor.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    const cityExists = await City.findById(city);
    if (!cityExists) return res.status(400).json({ success: false, message: 'City not found' });
    const regionExists = cityExists.regions.find(r => r._id.toString() === region);
    if (!regionExists) return res.status(400).json({ success: false, message: 'Region not found in the selected city' });

    // إنشاء توكن JWT للطبيب الجديد
    const token = await jwt.sign({ role: 'doctor' }, process.env.JWT_SECRET);
    

    // إنشاء حساب الطبيب مع تخزين اسم المدينة والمنطقة بدلاً من الـ ID
    const newUser = new Doctor({
      fullName,
      email,
      password,
      city: cityExists.name,    // تخزين اسم المدينة
      region: regionExists.name, // تخزين اسم المنطقة
      address,
      phone,
      specilizate,
      NumberState,
    });

    // حفظ الطبيب الجديد في قاعدة البيانات
    await newUser.save();
    await RefreshToken.create({ token , userRef: newUser._id });
    // إنشاء روابط الموافقة والرفض
    const approvalLink = `http://147.93.106.92/api/Doctor/approve/doctor/${newUser._id}`;
    const rejectLink = `http://147.93.106.92/api/Doctor/reject/doctor/${newUser._id}`;

    // إرسال بريد إلكتروني للإدارة لمراجعة الحساب الجديد
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
        <p>Specialization: ${specilizate}</p>
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
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.addToFamousDoctors = async (req, res) => {
  const { doctorId } = req.body;

  try {
    const doctor = await Doctor.findByIdAndUpdate(doctorId, { isFamous: true }, { new: true });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({ message: 'Doctor added to famous doctors menu', doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFamousDoctors = async (req, res) => {
  try {
    // Find all doctors where 'isFamous' is true
    const famousDoctors = await Doctor.find({ isFamous: true });

    if (famousDoctors.length === 0) {
      return res.status(404).json({ message: 'No famous doctors found' });
    }

    res.status(200).json({ famousDoctors });
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
  "الأحد": 0,
  "الإثنين": 1,
  "الثلاثاء": 2,
  "الأربعاء": 3,
  "الخميس": 4,
  "الجمعة": 5,
  "السبت": 6
};


function convertTimeTo24Hour(timeString) {
  const match = timeString.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/);

  if (!match) return null; // Handle invalid formats

  let [_, hours, minutes, period] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10) / 60; // Convert minutes to fraction (e.g., 30 min = 0.5)

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }
  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours + minutes; // Return as a number
}


function convertIdHourToTime(idHour, startHour) {
  let totalMinutes = startHour * 60 + idHour * 30;
  let hours = Math.floor(totalMinutes / 60);
  let minutes = totalMinutes % 60;
  let period = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes === 0 ? "00" : minutes}${period}`;
}


exports.getAvailableAppointments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Doctor ID format" });
    }

    const doctor = await Doctor.findById(id).select("rangeBooking booking");

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    let availableAppointments = [];

    doctor.booking.forEach((dayBooking, index) => {
      if (dayBooking && dayBooking.bookingHours) {
        let availableHours = dayBooking.bookingHours.filter((hour) => hour.patientIDs.length < 2);
        
        if (availableHours.length > 0) {
          availableAppointments.push({
            day: doctor.rangeBooking[index]?.day,
            availableHours: availableHours.map(hour => ({
              idHour: hour.idHour,
              startTime: convertIdHourToTime(hour.idHour, doctor.rangeBooking[index]?.start)
            }))
          });
        }
      }
    });

    return res.status(200).json({ message: "Available appointments", data: availableAppointments });

  } catch (err) {
    return res.status(500).json({ message: `Error: ${err.message}` });
  }
};

exports.updateBookingRange = async (req, res) => {
  try {
    const { id } = req.params;
    const rangeBooking = req.body.rangeBooking;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Doctor ID format" });
    }

    if (!Array.isArray(rangeBooking) || rangeBooking.length === 0) {
      return res.status(400).json({ error: "rangeBooking must be a valid array with elements." });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const formattedRangeBooking = rangeBooking.map(({ day, start, end }) => ({
      day: dayMapping[day] ?? null,
      start: convertTimeTo24Hour(start),
      end: convertTimeTo24Hour(end)
    }));

    if (formattedRangeBooking.some(rb => rb.day === null || rb.start === null || rb.end === null)) {
      return res.status(400).json({ error: "Invalid day or time format." });
    }

    let booking = Array(7).fill(null).map(() => ({ bookingHours: [] }));

    formattedRangeBooking.forEach((bookingDay) => {
      const countHalfHours = (bookingDay.end - bookingDay.start) * 2;
      let bookingHours = Array.from({ length: countHalfHours }, (_, i) => ({
        idHour: i,
        patientIDs: []
      }));

      booking[bookingDay.day] = { bookingHours };
    });

    doctor.rangeBooking = formattedRangeBooking;
    doctor.booking = booking;
    await doctor.save();

    return res.status(200).json({ message: "Booking updated successfully", doctor });

  } catch (err) {
    console.error("Error updating booking range:", err);
    return res.status(500).json({ message: `Error: ${err}` });
  }
};



exports.createBooking = async (req, res) => {
  try {
    const rangeBooking = req.body.rangeBooking;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Doctor ID format" });
    }

    if (!Array.isArray(rangeBooking) || rangeBooking.length === 0) {
      return res.status(400).json({ error: "rangeBooking must be a valid array with elements." });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor is not found" });
    }
    const formattedRangeBooking = rangeBooking.map(({ day, start, end }) => ({
      day: dayMapping[day] ?? null,
      start: convertTimeTo24Hour(start),
      end: convertTimeTo24Hour(end)
    }));

    if (formattedRangeBooking.some(rb => rb.day === null || rb.start === null || rb.end === null)) {
      return res.status(400).json({ error: "Invalid day or time format." });
    }

    let booking = Array(7).fill(null).map(() => ({ bookingHours: [] }));

    formattedRangeBooking.forEach((bookingDay) => {
      const countHalfHours = (bookingDay.end - bookingDay.start) * 2;
      let bookingHours = Array.from({ length: countHalfHours }, (_, i) => ({
        idHour: i,
        patientIDs: []
      }));

      booking[bookingDay.day] = { bookingHours };
    });

    doctor.rangeBooking = formattedRangeBooking;
    doctor.booking = booking;
    await doctor.save();

    return res.status(200).json({ message: "Booking created successfully", doctor });
  } catch (err) {
    return res.status(500).json({ message: `Error: ${err}` });
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
    RefreshToken.create({ token , userRef:user._id });

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
    const userId = req.user._id; // احصل على ID المستخدم المسجل

    const { city, region, spec } = req.params;
    
    const existCity = await City.findById(city);
    if (!existCity) return res.status(400).json({ success: false, message: 'City not found' });

    const existRegion = existCity.regions.find(r => r._id.toString() === region);
    if (!existRegion) return res.status(400).json({ success: false, message: 'Region not found in the selected city' });

    const cityname = existCity.name;
    const regionname = existRegion.name;

    const query = { city: cityname, region: regionname, specilizate: spec };
    const doctors = await Doctor.find(query);

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ status: false, message: 'No doctors found' });
    }

    // اجلب قائمة المفضلات لهذا المستخدم
    const favouriteDoctors = await FavouriteDoctor.find({ userId });

    // تحويل الأطباء المفضلين إلى قائمة تحتوي فقط على الـ doctorId
    const favouriteDoctorIds = favouriteDoctors.map(fav => fav.doctorId.toString());

    // تحديث بيانات الأطباء مع تحديد `isFavourite`
    const doctorsWithFavStatus = doctors.map(doctor => ({
      ...doctor.toObject(),
      isFavourite: favouriteDoctorIds.includes(doctor._id.toString())
    }));

    res.status(200).json({ status: true, doctors: doctorsWithFavStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


// exports.getDoctors = async (req, res) => {
//   try {
//     const city = req.params.city,
//       region = req.params.region,
//       spec = req.params.spec;
// const existCity = await City.findById(city)
//     const existRegion = existCity.regions.find(r=>r._id.toString()===region)
//     if (!existRegion) return res.status(400).json({ success: false, message: 'Region not found in the selected city' });
//     const cityname = existCity.name
//     const regionname = existRegion.name
//     const query = { city: cityname, region: regionname, specilizate: spec };

//     const doctors = await Doctor.find(query);

//     if (!doctors || doctors.length === 0) {
//       return res.status(404).json({ status: false, message: 'No result' });
//     }

//     const currentDate = new Date();

//     for (const doctor of doctors) {
//       for (const booking of doctor.booking) {
//         for (const hour of booking.bookingHours) {
//           hour.patientIDs = hour.patientIDs.filter(
//             (patient) => patient.date >= currentDate
//           );
//         }
//       }
//       await doctor.save();
//     }

//     res.status(200).json({ status: true, findDoctor: doctors });
//   } catch (error) {
//     res.status(500).json({ status: false, message: error.message });
//   }
// };

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
    if (!doctor.booking[idDay].bookingHours || idHour >= doctor.booking[idDay].bookingHours.length || idHour < 0) { 
      return res.status(404).json({ status: false, message: 'Hour not found' });
    }
    if (!doctor.booking[idDay].bookingHours[idHour]) {
      return res.status(404).json({ status: false, message: 'Hour slot not found' });
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
      return res.status(404).json({ status: false, message: 'Doctor not found' });
    }

    if (
      idDay >= doctor.booking.length || idDay < 0 ||
      !doctor.booking[idDay] ||
      !doctor.booking[idDay].bookingHours ||
      idHour >= doctor.booking[idDay].bookingHours.length || idHour < 0 ||
      !doctor.booking[idDay].bookingHours[idHour]
    ) {
      return res.status(400).json({ status: false, message: 'Invalid day or hour slot' });
    }

    const slot = doctor.booking[idDay].bookingHours[idHour];
    const index = slot.patientIDs.findIndex(p => p.id.toString() === patientId);

    if (index === -1) {
      return res.status(404).json({ status: false, message: 'Booking not found for this patient' });
    }

    slot.patientIDs.splice(index, 1); // Remove the booking
    await doctor.save();

    return res.status(200).json({ status: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error in deleteBookByPatient:', error);
    return res.status(500).json({ status: false, message: 'Server error' });
  }
};



exports.updateDoctorInfo = async (req, res) => {
  try {
    const id = req.params.id;
    const updateFields = {}; // سيتم تخزين الحقول التي يجب تحديثها هنا

    // استخراج الحقول من body فقط إذا تم إرسالها
    const { fullName, city, region, address, specilizate, NumberState, doctorimage } = req.body;

    // تحقق إذا كانت الحقول موجودة وأضفها إلى updateFields
    if (fullName) updateFields.fullName = fullName;
    if (address) updateFields.address = address;
    if (specilizate) updateFields.specilizate = specilizate;
    if (NumberState) updateFields.NumberState = NumberState;

    // معالجة تحديث المدينة والمنطقة
    if (city && region) {
      const existCity = await City.findById(city);
      if (!existCity) return res.status(400).json({ success: false, message: "City not found" });

      const existRegion = existCity.regions.find(r => r._id.toString() === region);
      if (!existRegion) return res.status(400).json({ success: false, message: "Region not found in the selected city" });

      updateFields.city = existCity.name;   // حفظ اسم المدينة
      updateFields.region = existRegion.name; // حفظ اسم المنطقة
    }

    // تحديث صور الطبيب إذا تم إرسالها
    if (doctorimage && Array.isArray(doctorimage)) {
      updateFields.doctorimage = doctorimage;
    }

    // تحديث الحقول المحددة فقط
    const updatedDoctor = await Doctor.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    if (!updatedDoctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    res.status(200).json({
      success: true,
      message: "Doctor information updated successfully",
      doctor: updatedDoctor,
    });
  } catch (err) {
    console.error("Error updating doctor:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
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



exports.toggleDoctorFavourite = async (req, res) => {
  try {
    const { userId, doctorId } = req.body;

    const pharma = await Doctor.findById(doctorId);
    if (!pharma) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const existingFavourite = await FavouriteDoctor.findOne({ userId, doctorId });

    if (existingFavourite) {
      existingFavourite.isFavourite = !existingFavourite.isFavourite;
      await existingFavourite.save();
      
      return res.status(200).json({
        message: existingFavourite.isFavourite ? 'doctor added to favourites' : 'doctor removed from favourites',
        isFavourite: existingFavourite.isFavourite
      });
    } else {
      const newFavourite = new FavouriteDoctor({ userId, doctorId, isFavourite: true });
      await newFavourite.save();

      return res.status(200).json({
        message: 'doctor added to favourites',
        isFavourite: true
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
      .populate('doctorId')
      .exec();

    if (favourites.length === 0) {
      return res.status(404).json({ message: 'No favourite doctors found' });
    }

    res.status(200).json({ message: 'Favourite doctors retrieved successfully', favourites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.deleteFromFavo = async (req,res)=>{
  try{
    const {cardId} = req.params
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
          return res.status(400).json({ message: 'Invalid User ID format' });
    }
    const user = await Favourite.findByIdAndDelete(cardId)
    if(!user){
      return res.status(404).json({message:'User not found'})
    }
    return res.status(200).json({message:'Delete succesfully'})
  }catch(err){
    return res.status(500).json({message:`Server error ${err}`})
  }
}

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