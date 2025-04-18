const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const analystController = require('../controllers/analyst.controller');
const RadiologyController = require('../controllers/radiology.controller');
const doctorController = require('../controllers/doctor.controller');
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const ckeckSeek = require('../middleware/seek.middleware');
const Pharmatic = require('../model/auth.model');
const Seek = require('../model/seek.model');
const City = require('../model/cities.model');
const mongoose = require('mongoose');
const PrescriptionRequest = require('../model/PrescriptionRequest.model');
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
router.post('/loginSeek', checkprov.checkifLoggedOut, authController.loginSeek);
router.post(
  '/logoutSeek/:id',
  checkprov.checkifLoggedIn,
  authController.logoutSeek
);
router.post("/update-profile/:id" ,checkprov.checkifLoggedIn , authController.updateSickInfo)
router.delete("/delete-sick-account", checkprov.checkifLoggedIn , ckeckSeek.authMiddlewareforSeek, authController.deleteSeekAccount );
router.get("/get-sick-profile/:id" , checkprov.checkifLoggedIn , async(req,res)=>{
  const { id } = req.params
   if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await Seek.findById(id)
    if(!user){
       return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({success:true , data:user})
})
router.post("/forgot-password-for-sick" , authController.forgetPassForSick);

router.post("/verify-code-for-sick", authController.verifyCodeSick);

router.post("/reset-password-for-sick", authController.resetSickPass);

router.get('/search', checkprov.checkifLoggedIn , authController.searchPharmaticsByName);
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
router.delete("/delete-pharmatic-account", checkprov.authMiddlewareforPharmatic, authController.deletePharmaticAccount );

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
  checkprov.checkifLoggedOut,
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
      const existCity = await City.findById(city)
          const existRegion = existCity.regions.find(r=>r._id.toString()===region)
          if (!existRegion) return res.status(400).json({ success: false, message: 'Region not found in the selected city' });
          const cityname = existCity.name
          const regionname = existRegion.name

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
        city:cityname,
        region:regionname,
        status: "unread",
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
      { $set: { status: "read" } }
    );
    const formattedRequests = requests.map((req) => ({
      ...req.toObject(),
      status: req.status,
      dateFormatted: new Date(req.date).toISOString().split('T')[0], // yyyy-mm-dd
      timeFormatted: new Date(req.date).toISOString().split('T')[1].slice(0, 5), // hh:mm
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
    request.pharmacistsResponded.push({ pharmacistId:specId, price, accepted  });
    await request.save();

    res.status(200).json({ message: 'تم إرسال الرد بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء الرد على الطلب', error });
  }
});
router.get('/patient-responses/:patientId', async (req, res) => {
  try {
    console.log(req.params.patientId)
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
    res.status(500).json({ message: ` ${error}خطأ أثناء جلب الردود`, error:error });
  }
});
router.put("/update-request-status/:requestId", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["read", "unread"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const request = await PrescriptionRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "الطلب غير موجود" });

    request.status = status;
    await request.save();

    res.status(200).json({ message: `تم تحديث حالة الطلب إلى ${status}` });
  } catch (error) {
    res.status(500).json({ message: "خطأ أثناء تحديث الحالة", error });
  }
});

router.post(
  '/logoutSpec',
  checkprov.checkifLoggedIn,
  authController.logoutSpec
);

router.post('/add-to-famous'  , authController.addToFamousPhars);
router.get('/famous', authController.getFamousPhars);
router.get("/user-bookings/:patientId", checkprov.checkifLoggedIn , authController.getUserBookings);
router.post("/forgot-password-for-pharmatic" , authController.forgetPassForPharmatic);

router.post("/verify-code-for-pharmatic", authController.verifyCodePharmatic);

router.post("/reset-password-for-pharmatic", authController.resetPharmaPass);


router.get("/get-profile/:id" , checkprov.checkifLoggedIn , async(req,res)=>{
  const { id } = req.params
   if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await Pharmatic.findById(id)
    if(!user){
       return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({success:true , data:user})
})

router.post('/add-pharma-to-favourite', 
  checkprov.checkifLoggedIn ,
  authController.togglePharmaFavourite);
router.get('/my-favourites/:userId',checkprov.checkifLoggedIn, authController.getFavourites);
router.delete('/from-favourite/:cardId' , checkprov.checkifLoggedIn , authController.deleteFromFavo)
router.get("/patient-orders/:patientId", checkprov.checkifLoggedIn  , async (req, res) => {
  try {
    const { patientId } = req.params;
    const requests = await PrescriptionRequest.find({ patientId }, "-pharmacistsResponded")
      if(!requests)return res.status(404).json({message:"No orders "});
    return res.status(200).json({message:requests});
  } catch (error) {
   return res.status(500).json({ error: error.message });
  }
});
// router.delete("/delete-notification/:id", checkprov.checkifLoggedIn, async (req, res) => {
//   try {
//     const notificationId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(notificationId)) {
//       return res.status(400).json({ message: "Invalid notification ID" });
//     }

//     const notification = await Notification.findById(notificationId);

//     if (!notification) {
//       return res.status(404).json({ message: "Notification not found" });
//     }

//     if (notification.userId.toString() !== req.user.id) {
//       return res.status(403).json({ message: "Unauthorized action" });
//     }

//     await Notification.findByIdAndDelete(notificationId);

//     res.json({ message: "Notification deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

//End Pharmatic

module.exports = router;
