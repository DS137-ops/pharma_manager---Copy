const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const analystController = require('../controllers/analyst.controller');
const RadiologyController = require('../controllers/radiology.controller');
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pharmacy_images',
    format: async (req, file) => 'png',
    public_id: (req, file) => Date.now() + '-' + file.originalname,
  },
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
router.get('/approve/doctor/:id', authController.approvePharmatic);
router.get('/reject/doctor/:id', authController.rejectPharmatic);
router.get(
  '/getDoctorsinCity/:city?/:region?',
  checkprov.checkBlacklist,
  authController.getDoctors
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
  checkprov.checkBlacklist,
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
router.post('/rate/:pharmaticId', authController.ratePharmatic);
router.get('/final-rate/:pharmaticId', authController.getFinalRate);
router.get('/approve/pharmatic/:id', authController.approvePharmatic);
router.get('/reject/pharmatic/:id', authController.rejectPharmatic);
router.post('/signinPharmatic', checkprov.isProvved, authController.loginPhar);
router.post('/updatePharInfo/:id', authController.updatePharmaticInfo);
router.get(
  '/getPharmainCity/:city?/:region?',
  checkprov.checkBlacklist,
  authController.getPharmas
);
router.post('/logoutSpec', checkprov.checkBlacklist, authController.logoutSpec);
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
  checkprov.checkBlacklist,
  analystController.getAnalyst
);
//End Analyst
module.exports = router;
