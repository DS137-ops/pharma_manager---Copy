const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const analystController = require('../controllers/analyst.controller');
const RadiologyController = require('../controllers/radiology.controller');
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const ckeckSeek = require('../middleware/seek.middleware');
const Pharmacy = require('../model/auth.model');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dqk8dzdoo',
  api_key: '687124232966245',
  api_secret: 'LhIKcexhYtHUK-bZSiIoT8jsMqc',
});

// Multer Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `pharmacies/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const upload = multer({ storage: storage });
//api doctor
router.post(
  '/send-image/:city/:region/:sickId',
  upload.single('image'),
  authController.sendImageToPhar
);
router.post(
  '/createNewDoctor',
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
    body('specilizate')
      .trim()
      .notEmpty()
      .withMessage('specilizate is required'),

    body('city').trim().notEmpty().withMessage('City is required'),
    body('phone').notEmpty().withMessage('phone is required'),
  ],
  authController.createNewDoctor
);
router.get('/approve/doctor/:id', authController.approveDoctor);
router.get('/reject/doctor/:id', authController.rejectDoctor);
router.post('/signinDoctor', checkprov.isProvved, authController.loginDoctor);
router.post(
  '/rateDoctor/:DoctorId',
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  authController.rateDoctor
);
router.get(
  '/final-rate-doctor/:doctorId',
  authController.getFinalRateforDoctor
);
router.get(
  '/getDoctorsinCity/:city?/:region?/:spec?',
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  authController.getDoctors
);
router.post(
  '/updateDoctorInfo/:id',
  checkprov.checkifLoggedIn,
  checkprov.isDoctor,
  authController.updateDoctorInfo
);
router.post(
  '/upload-pharmacy-image/:id/:Seekid',
  upload.single('image'),
  async (req, res) => {
    try {
      const { id, Seekid } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid pharmacy ID' });
      }

      const pharmacy = await Pharmacy.findById(id);
      if (!pharmacy) {
        return res.status(404).json({ message: 'Pharmacy not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const imageUrl = req.file.path; // Cloudinary URL

      pharmacy.notifications.push({
        sickId: Seekid,
        imageUrl: imageUrl,
        date: new Date(),
      });

      await pharmacy.save();

      res.status(200).json({
        message: 'Image uploaded successfully',
        data: pharmacy,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);
//End Doctor

//Seek Section
router.post(
  '/createNewSeek',
  [
    body('fullName')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 3 characters long'),
    body('phone').notEmpty().withMessage('phone is required'),
  ],
  authController.createNewSeek
);
router.post(
  '/logoutSeek/:id',
  checkprov.checkifLoggedIn,
  authController.logoutSeek
);
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
router.post(
  '/ratePharmacy/:pharmaticId',
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  authController.ratePharmatic
);
router.get('/final-rate-pharmacy/:pharmaticId', authController.getFinalRate);
router.get('/approve/pharmatic/:id', authController.approvePharmatic);
router.get('/reject/pharmatic/:id', authController.rejectPharmatic);
router.post('/signinPharmatic', checkprov.isProvved, authController.loginPhar);
router.post(
  '/updatePharInfo/:id',
  checkprov.checkifLoggedIn,
  checkprov.isPharmatic,
  authController.updatePharmaticInfo
);
router.get(
  '/getPharmainCity/:city?/:region?',
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  authController.getPharmas
);
router.post(
  '/logoutSpec',
  checkprov.checkifLoggedIn,
  authController.logoutSpec
);
//router.post('/sendMessageToPharmatic/:city?/:address?',authController.sendMessage);
//router.get('/getMessages/:userId', authController.getMessages);
//End Pharmatic

//Radiology Section
router.post(
  '/createNewRadiology',
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
  RadiologyController.createNewRadiology
);
router.get('/approve/radiology/:id', RadiologyController.approveRadiology);
router.get('/reject/radiology/:id', RadiologyController.rejectRadiology);
router.get(
  '/getradiologiesinCity/:city?/:region?',
  checkprov.checkifLoggedIn,
  RadiologyController.getradiology
);

//End Radiology

//Analyst Section

router.post(
  '/createNewAnalyst',
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
  analystController.createNewAnalyst
);

router.get('/approve/analyst/:id', analystController.approveAnalyst);
router.get('/reject/analyst/:id', analystController.rejectAnalyst);
router.get(
  '/getAnalystsinCity/:city?/:region?',
  checkprov.checkifLoggedIn,
  analystController.getAnalyst
);
//End Analyst
module.exports = router;
