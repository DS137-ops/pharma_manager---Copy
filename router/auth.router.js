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
    folder: `pharmacies/${req.params.id}`,
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
  '/logoutSeek/:id',
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
  ckeckSeek.authMiddlewareforSeek,
  authController.deleteSeekAccount
);
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
    res.status(200).json({ success: true, data: user });
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
  checkprov.authMiddlewareforPharmatic,
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
    .json({ success: true, message: 'user is  approved sucessfully!' });
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

      const imageUrl = req.file.path;
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ message: 'Invalid Seek ID' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'no image upload' });
      }
      const newRequest = new PrescriptionRequest({
        patientId,
        imageUrl,
        city: cityname,
        region: regionname,
        status: 'unread',
      });

      await newRequest.save();
      res
        .status(200)
        .json({ message: 'تم إرسال الطلب بنجاح', request: newRequest });
    } catch (error) {
      console.error('خطأ أثناء إرسال الطلب:', error);
      res
        .status(500)
        .json({ message: 'حدث خطأ أثناء إرسال الطلب', error: error.message });
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

    res.status(200).json({ requests: formattedRequests });
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

    res.status(200).json({ message: 'تم إرسال الرد بنجاح' });
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
        if (response.accepted) {
          responses.push({
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

    res.status(200).json({ responses });
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
  const averageRating = parseFloat(
    ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0
  );
  
  const userObj = user.toObject({ getters: true, versionKey: false });
  
 
  delete userObj.password;
  delete userObj.resetCode;
  delete userObj.rate;
  
  userObj.finalRate = averageRating;
  
  res.status(200).json({ success: true,data:userObj   });
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
      if (!requests) return res.status(404).json({ message: 'No orders ' });
      return res.status(200).json({ message: requests });
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
            averageRating: { $ne: null },
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
            fullName: 1,
            StartJob: 1,
            EndJob: 1,
            finalRate: '$averageRating',
          },
        },
      ]);

      const favouritePharmas = await FavouritePharmas.find({ userId });
      const favouritePharmaIds = favouritePharmas.map((fav) =>
        fav.pharmaId.toString()
      );

      const pharmasWithFavStatus = topPharmas.map((pharma) => ({
        ...pharma,
        isFavourite: favouritePharmaIds.includes(pharma._id.toString()),
      }));

      return res
        .status(200)
        .json({ success: true, data: pharmasWithFavStatus });
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
router.get('/AllOrders/:patientId' , checkprov.checkifLoggedIn , async(req,res)=>{
  try{
    const { patientId } = req.params;
    const fromPharma = await PrescriptionRequest.find(
      { patientId },
      '-pharmacistsResponded'
    );
    const fromAnalyst = await PrescriptionAnalystRequest.find(
      { patientId },
        '-pharmacistsResponded'
    );
    const fromRadiology = await PrescriptionRadiologyRequest.find(
            { patientId },
            '-pharmacistsResponded'
          );
          const fromDoctor = await Doctor.find({
                'booking.bookingHours.patientIDs.id': patientId,
              }).select('fullName specilizate booking');
          
              if (!fromDoctor || fromDoctor.length === 0) {
                return res
                  .status(200)
                  .json({ status: false, message: 'No bookings found for this patient' , data:[] });
              }
          
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
                          dayname,
                          idHour,
                          appointmentDate: patient.date,
                        });
                      }
                    });
                  });
                });
              });
    if (!fromPharma && !fromAnalyst && !fromRadiology && (!fromDoctor || fromDoctor.length === 0)) return res.status(200).json({ message: 'No orders ' , data:[] });
return res.status(200).json({succes:true , fromPharma:fromPharma , fromAnalyst:fromAnalyst , fromRadiology:fromRadiology , fromDoctor:patientBookings})
  }catch(error){
    res.status(500).json({succes:true , message:`internal server error ${error.message}`})
  }
})


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
            return res.status(200).json({succes:true , fromPharma:fromPharma , fromRadiology:fromRadiology , fromAnalyst:fromAnalyst})
  }catch(error){
    res.status(500).json({succes:true , message:`internal server error ${error.message}`})
  }
})

//End Pharmatic

module.exports = router;
