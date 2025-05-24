const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const analystController = require('../controllers/analyst.controller');
const RadiologyController = require('../controllers/radiology.controller');
const doctorController = require('../controllers/doctor.controller');
const { body } = require('express-validator');
const FavouritePharmas = require('../model/FavouritePharma.model');
const checkprov = require('../middleware/auth.middleware');
const ckeckSeek = require('../middleware/seek.middleware');
const Pharmatic = require('../model/auth.model');
const Doctor = require('../model/doctor.model');
const Radiology = require('../model/radiology.model');
const Analyst = require('../model/analyst.model');
const Seek = require('../model/seek.model');
const City = require('../model/cities.model');
//const client = require('../utils/sendWhatsAppMessage');
//const client = require("../whatsappClient");
//const otpStore = new Map();
const mongoose = require('mongoose');
const PrescriptionRequest = require('../model/PrescriptionRequest.model');
const PrescriptionAnalystRequest = require('../model/PrescriptionAnalystRequest.model');
const PrescriptionRadiologyRequest = require('../model/PrescriptionRadiology.model');
const multer = require('multer');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dqk8dzdoo',
  api_key: '687124232966245',
  api_secret: 'LhIKcexhYtHUK-bZSiIoT8jsMqc',
});

// For pharmacy
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `pharmacies`,
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const upload = multer({ storage: storage });

//Seek Section
router.post(
  '/createNewSeek',
  [
    body('fullName')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 3 characters long'),
    body('phone').notEmpty().withMessage('phone is required'),
    body('password').notEmpty().withMessage('password is required'),
  ],
  authController.createNewSeek
);
router.post('/loginSeek',  authController.loginSeek);
router.post(
  '/logoutSeek',
  checkprov.checkifLoggedIn,
  authController.logoutSeek
);
router.post(
  '/update-profile/:id',
  checkprov.checkifLoggedIn,
  authController.updateSickInfo
);
router.delete(
  '/delete-sick-account',
  checkprov.checkifLoggedIn,
  authController.deleteSeekAccount
);

router.post('/send-sick-notify' , authController.sendSickNotification)
router.post('/send-pharma-notify' , authController.sendPharmaNotification)

router.get(
  '/get-sick-profile/:id',
  checkprov.checkifLoggedIn,
  async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await Seek.findById(id).select(
      '-password -resetCode -resetCodeExpires -notifications'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true,message:'', data: user });
  }
);



router.get(
  '/search',
  checkprov.checkifLoggedIn,
  authController.searchPharmaticsByName
);
// router.get('/pharmatic-information/:id' , checkprov.checkifLoggedIn , authController.getPharmaInfo)
// router.get('/analyst-information/:id' , checkprov.checkifLoggedIn , analystController.getAnalystInfo)
// router.get('/radiology-information/:id' , checkprov.checkifLoggedIn , RadiologyController.getRadiologyInfo)
// router.get('/doctor-information/:id' , checkprov.checkifLoggedIn , doctorController.getDoctorInfo)

//End Seek

//Pharmatic Section
router.post(
  '/createNewPharmatic',
  [
    body('fullName')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 3 characters long'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('region').trim().notEmpty().withMessage('region is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),

    body('city').trim().notEmpty().withMessage('City is required'),
    body('phone').notEmpty().withMessage('phone is required'),
  ],

  authController.createNewPharmatic
);
router.delete(
  '/delete-pharmatic-account',
  checkprov.checkifLoggedIn,
  authController.deletePharmaticAccount
);

router.post('/isApprovedPharmatic', async (req, res) => {
  const email = req.body.email;
  if (!email) {
    res.status(404).json({ success: false, message: 'Email Not found' });
  }
  const user = await Pharmatic.findOne({ email });
  if (!user) {
    res.status(404).json({ success: false, message: 'User Not found' });
  }
  if (!user.approved) {
    res
      .status(400)
      .json({ success: false, message: 'user is not approved yet!' });
  }
  res
    .status(200)
    .json({ success: true, message: 'user is  approved sucessfully!' , data:[] });
});
router.post(
  '/ratePharmacy/:pharmaticId',
  checkprov.checkifLoggedIn,
  authController.ratePharmatic
);
router.get('/approve/pharmatic/:id', authController.approvePharmatic);
router.get('/reject/pharmatic/:id', authController.rejectPharmatic);
router.post(
  '/signinPharmatic',
  checkprov.isProvvedPharm,
  authController.loginPhar
);
//checkprov.isProvvedPharm ,
router.post(
  '/updatePharInfo/:id',
  checkprov.checkifLoggedIn,
  checkprov.isPharmatic,
  authController.updatePharmaticInfo
);
router.get(
  '/getPharmainCity/:city?/:region?',
  checkprov.checkifLoggedIn,
  authController.getPharmas
);

router.post(
  '/send-request/:patientId/:city/:region',
  upload.single('image'),
  async (req, res) => {
    try {
      const { patientId, city, region } = req.params;

      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ message: 'Invalid Patient ID' });
      }

      const existCity = await City.findById(city);
      if (!existCity) {
        return res
          .status(400)
          .json({ success: false, message: 'City not found' });
      }

      const existRegion = existCity.regions.find(
        (r) => r._id.toString() === region
      );
      if (!existRegion) {
        return res.status(400).json({
          success: false,
          message: 'Region not found in the selected city',
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }

      const imageUrl = req.file.path;

      const newRequest = new PrescriptionRequest({
        patientId,
        imageUrl,
        city:city,
        region:region,
        status: 'unread',
      });

      await newRequest.save();

      res.status(200).json({
        success: true,
        message: 'تم إرسال الطلب بنجاح',
        data: newRequest,
      });
    } catch (error) {
      console.error('خطأ أثناء إرسال الطلب:', error);
      res.status(500).json({
        message: 'حدث خطأ أثناء إرسال الطلب',
        error: error.message,
      });
    }
  }
);


router.get('/Pharmatic-requests/:pharmacistId', async (req, res) => {
  const pharmacist = await Pharmatic.findById(req.params.pharmacistId);
  if (!pharmacist)
    return res.status(404).json({ message: 'الصيدلي غير موجود' });

  try {
    const requests = await PrescriptionRequest.find({
      city: pharmacist.city,
      region: pharmacist.region,
    }).populate('patientId');
    await PrescriptionRequest.updateMany(
      { city: pharmacist.city, region: pharmacist.region },
      { $set: { status: 'read' } }
    );
    const formattedRequests = requests.map((req) => ({
      ...req.toObject(),
      status: req.status,
      dateFormatted: new Date(req.date).toISOString().split('T')[0],
      timeFormatted: new Date(req.date).toISOString().split('T')[1].slice(0, 5),
    }));

    res.status(200).json({ succes:true ,message:'', data: formattedRequests });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'خطأ أثناء جلب الطلبات', error: error.message });
  }
});

router.post('/respond-request-from-Pharmatic', async (req, res) => {
  const { requestId, specId, price, accepted } = req.body;

  const request = await PrescriptionRequest.findById(requestId);
  if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });
  if (accepted && !price) {
    res.status(400).json({ message: 'price is required' });
  }
  try {
    request.pharmacistsResponded.push({
      pharmacistId: specId,
      price,
      accepted,
    });
    await request.save();

    res.status(200).json({succes:true , message: 'تم إرسال الرد بنجاح' ,data:[] });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء الرد على الطلب', error });
  }
});
router.get('/patient-responses/:patientId', async (req, res) => {
  try {

    const patientRequests = await PrescriptionRequest.find({
      patientId: req.params.patientId,
    }).populate(
      'pharmacistsResponded.pharmacistId',
      'fullName phone city region'
    );
    let responses = [];
    patientRequests.forEach((request) => {
      request.pharmacistsResponded.forEach((response) => {
        if (response.accepted && response.pharmacistId) {
          responses.push({
            name: response.pharmacistId.fullName,
            phone: response.pharmacistId.phone,
            city: response.pharmacistId.city,
            region: response.pharmacistId.region,
            price: response.price,
            status: request.status,
            imageurl:request.imageUrl
          });
        }
      });
    });

    res.status(200).json({ succes:true ,message:'' , data:responses });
  } catch (error) {
    res
      .status(500)
      .json({ message: ` ${error}خطأ أثناء جلب الردود`, error: error });
  }
});

router.post(
  '/logoutSpec',
  checkprov.checkifLoggedIn,
  authController.logoutSpec
);

router.post('/add-to-famous', authController.addToFamousPhars);
router.get('/famous', authController.getFamousPhars);
router.get(
  '/user-bookings/:patientId',
  checkprov.checkifLoggedIn,
  authController.getUserBookings
);

router.post(
  '/forgot-password-for-pharmatic',
  authController.forgetPassForPharmatic
);

router.post('/verify-code-for-pharmatic', authController.verifyCodePharmatic);

router.post('/reset-password-for-pharmatic', authController.resetPharmaPass);

router.get('/get-profile/:id', checkprov.checkifLoggedIn, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  const user = await Pharmatic.findById(id).select('-password -resetCode');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const ratings = user.rate?.map((r) => r.rating) || [];
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  const averageRating =
    ratings.length > 0 ? Math.round((total / ratings.length).toFixed(1)) : 0
  
  const userObj = user.toObject({ getters: true, versionKey: false });
  
  delete userObj.password;
  delete userObj.resetCode;
  delete userObj.rate;
  
  userObj.finalRate = averageRating;
  
  res.status(200).json({ success: true, message:'' ,data:userObj });
});

router.post(
  '/add-pharma-to-favourite',
  checkprov.checkifLoggedIn,
  authController.togglePharmaFavourite
);
router.get(
  '/my-favourites/:userId',
  checkprov.checkifLoggedIn,
  authController.getFavourites
);
router.delete(
  '/from-favourite/:cardId',
  checkprov.checkifLoggedIn,
  authController.deleteFromFavo
);

router.get(
  '/patient-orders/:patientId',
  checkprov.checkifLoggedIn,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const requests = await PrescriptionRequest.find(
        { patientId },
        '-pharmacistsResponded'
      );
      if (!requests) return res.status(200).json({ succes:true , message: 'No orders ' , data:[] });
      return res.status(200).json({ succes:true , message:'', data: requests });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);


router.get(
  '/getTopPharmas/:city/:region',
  checkprov.checkifLoggedIn,
  async (req, res) => {
    try {
      const { city, region } = req.params;
      const userId = req.user._id;
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

      const cityname = existCity.name;
      const regionname = existRegion.name;

      const topPharmas = await Pharmatic.aggregate([
        {
          $match: {
            city: cityname,
            region: regionname,
          },
        },
        {
          $addFields: {
            averageRating: { $avg: '$rate.rating' },
          },
        },
        {
          $match: {
             averageRating: { $gte: 0 }
          },
        },
        {
          $sort: { averageRating: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            _id: 1,
            fullName: 1,
            role:1,
            StartJob: 1,
            EndJob: 1,
            finalRate: { $round: ['$averageRating', 0] },
          },
        },
      ]);

      const favouritePharmas = await FavouritePharmas.find({ userId , isFavourite:true });
      const favouritePharmaIds = favouritePharmas.map((fav) =>
        fav.specId.toString()
      );

      const pharmasWithFavStatus = topPharmas.map((pharma) => ({
        ...pharma,
        isFavourite: favouritePharmaIds.includes(pharma._id.toString()),
      }));

      return res
        .status(200)
        .json({ success: true,message:'' , data: pharmasWithFavStatus });
    } catch (err) {
      return res.status(500).json({ success: false, err: err.message });
    }
  }
);
const dayMapping2 = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

router.get('/AllOrders/:patientId', checkprov.checkifLoggedIn, async (req, res) => {
  try {
    const { patientId } = req.params;
    const lang = req.headers['accept-language'] === 'ar' ? 'ar' : 'en'; // default to en

    const fromPharmaRaw = await PrescriptionRequest.find({ patientId });
    const fromAnalystRaw = await PrescriptionAnalystRequest.find({ patientId });
    const fromRadiologyRaw = await PrescriptionRadiologyRequest.find({ patientId });

    const fromPharma = fromPharmaRaw.map((item) => ({
      _id: item._id,
      patientId: item.patientId,
      imageUrl: item.imageUrl,
      city: item.city?.[lang] || '',
      region: item.region?.[lang] || '',
      date: item.date,
      status: item.status,
    }));

    const fromAnalyst = fromAnalystRaw.map((item) => ({
      _id: item._id,
      patientId: item.patientId,
      imageUrl: item.imageUrl,
      city: item.city?.[lang] || '',
      region: item.region?.[lang] || '',
      date: item.date,
      status: item.status,
    }));

    const fromRadiology = fromRadiologyRaw.map((item) => ({
      _id: item._id,
      patientId: item.patientId,
      imageUrl: item.imageUrl,
      city: item.city?.[lang] || '',
      region: item.region?.[lang] || '',
      date: item.date,
      status: item.status,
    }));

    const fromDoctor = await Doctor.find({
      'booking.bookingHours.patientIDs.id': patientId,
    }).select('fullName specilizate booking city region');

    let patientBookings = [];

    fromDoctor.forEach((doctor) => {
      doctor.booking.forEach((day, idDay) => {
        day.bookingHours.forEach((hour, idHour) => {
          hour.patientIDs.forEach((patient) => {
            if (patient.id.toString() === patientId) {
              let dayname = dayMapping2[idDay];
              patientBookings.push({
                doctorId: doctor._id,
                doctorName: doctor.fullName,
                specialization: doctor.specilizate,
                city: doctor.city?.[lang] || '',
                region: doctor.region?.[lang] || '',
                dayname,
                idHour,
                appointmentDate: patient.date,
              });
            }
          });
        });
      });
    });

    if (
      !fromPharma.length &&
      !fromAnalyst.length &&
      !fromRadiology.length &&
      !patientBookings.length
    ) {
      return res.status(200).json({ message: 'No orders', data: [] });
    }

    return res.status(200).json({
      success: true,
      message: '',
      fromPharma,
      fromAnalyst,
      fromRadiology,
      fromDoctor: patientBookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
});


router.get('/AllResponses/:patientId' , checkprov.checkifLoggedIn , async(req,res)=>{
  try{
    const patientRequests = await PrescriptionRequest.find({
      patientId: req.params.patientId,
    }).populate(
      'pharmacistsResponded.pharmacistId',
      'fullName phone city region'
    );
    let fromPharma = [];
    patientRequests.forEach((request) => {
      request.pharmacistsResponded.forEach((response) => {
        if (response.accepted) {
          fromPharma.push({
            pharmacistName: response.pharmacistId.fullName,
            phone: response.pharmacistId.phone,
            city: response.pharmacistId.city,
            region: response.pharmacistId.region,
            price: response.price,
            status: request.status,
          });
        }
      });
    });


     const patientRequests2 = await PrescriptionRadiologyRequest.find({
          patientId: req.params.patientId,
        }).populate(
          'radiologysResponded.radiologyId',
          'fullName phone city region'
        );
        let fromRadiology = [];
    
        patientRequests2.forEach((request) => {
          request.radiologysResponded.forEach((response) => {
            if (response.accepted && response.radiologyId) {
              fromRadiology.push({
                radiologyName: response.radiologyId?.fullName || 'N/A',
                phone: response.radiologyId?.phone || 'N/A',
                city: response.radiologyId?.city || 'N/A',
                region: response.radiologyId?.region || 'N/A',
                price: response.price || 0,
                status: request.status || 'N/A',
              });
            }
          });
        });



         const patientRequests3 = await PrescriptionAnalystRequest.find({
              patientId: req.params.patientId,
            }).populate('analystsResponded.analystId', 'fullName phone city region');
        
            let fromAnalyst = [];
        
            patientRequests3.forEach((request) => {
              request.analystsResponded.forEach((response) => {
                if (response.accepted) {
                  fromAnalyst.push({
                    analystName: response.analystId.fullName,
                    phone: response.analystId.phone,
                    city: response.analystId.city,
                    region: response.analystId.region,
                    price: response.price,
                  });
                }
              });
            });
            return res.status(200).json({succes:true , message:'', fromPharma:fromPharma , fromRadiology:fromRadiology , fromAnalyst:fromAnalyst})
  }catch(error){
    res.status(500).json({succes:true , message:`internal server error ${error.message}`})
  }
})

// router.post('/forgot-password', async (req, res) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return res.status(400).json({ message: 'رقم الهاتف مطلوب.' });
//   }

//   const user = await Seek.findOne({ phone });
//   if (!user) {
//     return res.status(404).json({ message: 'رقم الهاتف غير مسجل.' });
//   }

//   // توليد OTP
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // صلاحية 5 دقائق

//   // إرسال الرسالة عبر WhatsApp
//   try {
//     // تأكد أن client جاهز
//     if (!client.info) {
//       return res.status(500).json({ message: 'العميل غير متصل بعد. حاول لاحقًا.' });
//     }

//     const chatId = `${phone}@c.us`; // تأكد أن الرقم بصيغة دولية

//     await client.sendMessage(chatId, `🔐 رمز التحقق الخاص بك هو: *${otp}*\nصالح لمدة 5 دقائق.`);

//     return res.status(200).json({
//       success: true,
//       message: 'تم إرسال رمز التحقق عبر واتساب.',
//       data: []
//     });
//   } catch (error) {
//     console.error('❌ Error sending WhatsApp message:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'فشل إرسال الرسالة.',
//       error: error.message
//     });
//   }
// });

// router.post("/verify-otp", (req, res) => {
//   const { phone, otp } = req.body;

//   const record = otpStore.get(phone);
//   if (!record || record.otp !== otp) {
//     return res.status(400).json({ message: "رمز التحقق غير صحيح." });
//   }

//   if (Date.now() > record.expiresAt) {
//     otpStore.delete(phone);
//     return res.status(400).json({ message: "انتهت صلاحية رمز التحقق." });
//   }

//   return res.status(200).json({succes:true , message: "تم التحقق بنجاح. يمكنك الآن إعادة تعيين كلمة المرور." , data:[] });
// });


// router.post("/reset-password/:id", async (req, res) => {
//   const { newPassword } = req.body;
//   const user = await Seek.findById({ id });
//   if (!user) {
//     return res.status(404).json({ message: "Invalid ID" });
//   }

//   user.password = newPassword;
//   await user.save();

//   otpStore.delete(phone);

//   return res.status(200).json({ succes:true ,message: "تم تحديث كلمة المرور بنجاح." ,data:[] });
// });

//End Pharmatic

module.exports = router;
