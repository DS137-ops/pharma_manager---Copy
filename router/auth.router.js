const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const analystController = require('../controllers/analyst.controller');
const RadiologyController = require('../controllers/radiology.controller');
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const ckeckSeek = require('../middleware/seek.middleware');
const Pharmacy = require('../model/auth.model');
const Doctor = require('../model/doctor.model');
const Pharmatic = require('../model/auth.model');
const Radiology = require('../model/radiology.model');
const Analyst = require('../model/analyst.model');
const mongoose = require('mongoose');
const Booking = require('../model/book.model');
const PrescriptionRequest = require('../model/PrescriptionRequest.model');
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
    folder: `pharmacies/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const upload = multer({ storage: storage });

// For radiology
const storage_for_radiology = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `radiology/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const uploadForRadiology = multer({ storage: storage_for_radiology });

// For doctor
const storage_for_Doctor = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `Doctors/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const uploadfordoctor = multer({ storage: storage_for_Doctor });
//api doctor
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
router.post('/signinDoctor', authController.loginDoctor);
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
  // checkprov.checkifLoggedIn,
  // ckeckSeek.authenticateSeek,
  authController.getDoctors
);

router.post(
  '/createNewBook',
  // checkprov.checkifLoggedIn,
  // ckeckSeek.authenticateSeek,
  authController.createNewBook
);
router.post(
  '/updateDoctorInfo/:id',
  body('phone').notEmpty().withMessage('phone is required'),
  checkprov.isDoctor,
  checkprov.checkifLoggedIn,
  authController.updateDoctorInfo
);
router.post(
  '/upload-doctor-photo/:id',
  checkprov.checkifLoggedIn,
  uploadfordoctor.single('image'),
  async (req, res) => {
    try {
      const DoctorId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(DoctorId)) {
        return res.status(400).json({ message: 'Invalid pharmacy ID' });
      }
      const TheDoctor = await Doctor.findById(DoctorId);
      if (!TheDoctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const image = req.file.path;
      TheDoctor.doctorimage.push({
        imageUrl: image,
        date: new Date(),
      });
      await TheDoctor.save();
      res.status(200).json({
        message: 'Image uploaded successfully',
        data: TheDoctor,
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server', error });
    }
  }
);

router.get('/get-doctor-image/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId);
    const notify = doctor.doctorimage;

    res.status(201).json({ success: true, notify });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
    .status(201)
    .json({ success: true, message: 'user is  approved sucessfully!' });
});
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
  '/send-request/:patientId/:city/:region',
  upload.single('image'),
  async (req, res) => {
    try {
      const { patientId, city, region } = req.params;

      const imageUrl = req.file.path; // رابط الصورة
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ message: 'Invalid Seek ID' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'no image upload' });
      }
      const newRequest = new PrescriptionRequest({
        patientId,
        imageUrl,
        city,
        region,

      });

      await newRequest.save();
      res
        .status(201)
        .json({ message: 'تم إرسال الطلب بنجاح', request: newRequest });
    } catch (error) {
      console.error('خطأ أثناء إرسال الطلب:', error);
      res
        .status(500)
        .json({ message: 'حدث خطأ أثناء إرسال الطلب', error: error.message });
    }
  }
);
router.get('/pharmacist-requests/:pharmacistId', async (req, res) => {
  try {
    const pharmacist = await Pharmatic.findById(req.params.pharmacistId);
    if (!pharmacist)
      return res.status(404).json({ message: 'الصيدلي غير موجود' });

    // البحث عن الطلبات في نفس المدينة والمنطقة
    const requests = await PrescriptionRequest.find({
      city: pharmacist.city,
      region: pharmacist.region,
    }).populate('patientId');

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء جلب الطلبات',error: error.message });
  }
});
router.post('/respond-request', async (req, res) => {
  try {
    const { requestId, pharmacistId, price, accepted } = req.body;

    const request = await PrescriptionRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });
    if (accepted && !price) {
      res.status(400).json({ message: 'price is required' });
    }
    // إضافة رد الصيدلي إلى الطلب
    request.pharmacistsResponded.push({ pharmacistId, price, accepted });
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
    }).populate('pharmacistsResponded.pharmacistId', 'fullName phone city region');
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
          });
        }
      });
    });

    res.status(200).json({ responses });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء جلب الردود', error });
  }
});


router.post(
  '/logoutSpec',
  checkprov.checkifLoggedIn,
  authController.logoutSpec
);

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
router.post('/isApprovedRadiology', async (req, res) => {
  const email = req.body.email;
  if (!email) {
    res.status(404).json({ success: false, message: 'Email Not found' });
  }
  const user = await Radiology.findOne({ email });
  if (!user) {
    res.status(404).json({ success: false, message: 'User Not found' });
  }
  if (!user.approved) {
    res
      .status(400)
      .json({ success: false, message: 'user is not approved yet!' });
  }
  res
    .status(201)
    .json({ success: true, message: 'user is  approved sucessfully!' });
});
router.get('/approve/radiology/:id', RadiologyController.approveRadiology);
router.get('/reject/radiology/:id', RadiologyController.rejectRadiology);
router.get(
  '/getradiologiesinCity/:city?/:region?',
  checkprov.checkifLoggedIn,
  RadiologyController.getradiology
);
router.post(
  '/rateRadiology/:radiologyId',
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  RadiologyController.rateRadiology
);
router.get(
  '/final-rate-radiology/:radiologyId',
  RadiologyController.getFinalRateForRadiology
);
router.post(
  '/signinRadiology',
  checkprov.isProvved,
  RadiologyController.loginRadio
);
router.post(
  '/updateRadioInfo/:id',
  checkprov.checkifLoggedIn,
  RadiologyController.updateRadiologyInfo
);

router.post(
  '/send-request-for-radiology/:patientId/:city/:region',
  uploadForRadiology.single('image'),
  async (req, res) => {
    try {
      const { patientId, city, region } = req.params;

      const imageUrl = req.file.path;
      if (!mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({ message: 'Invalid Seek ID' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'no image upload' });
      }
      const newRequest = new PrescriptionRadiologyRequest({
        patientId,
        imageUrl,
        city,
        region,

      });

      await newRequest.save();
      res
        .status(201)
        .json({ message: 'تم إرسال الطلب بنجاح', request: newRequest });
    } catch (error) {
      console.error('خطأ أثناء إرسال الطلب:', error);
      res
        .status(500)
        .json({ message: 'حدث خطأ أثناء إرسال الطلب', error: error.message });
    }
  }
);
router.get('/radiology-requests/:radiologyId', async (req, res) => {
  try {
    const radiology = await Radiology.findById(req.params.radiologyId);
    if (!radiology)
      return res.status(404).json({ message: 'الصيدلي غير موجود' });

    // البحث عن الطلبات في نفس المدينة والمنطقة
    const requests = await PrescriptionRadiologyRequest.find({
      city: radiology.city,
      region: radiology.region,
    }).populate('patientId');

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء جلب الطلبات',error: error.message });
  }
});
router.post('/respond-request-from-radiology', async (req, res) => {
  try {
    const { requestId, radiologyId, price, accepted } = req.body;

    const request = await PrescriptionRadiologyRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });
    if (accepted && !price) {
      res.status(400).json({ message: 'price is required' });
    }
    // إضافة رد الصيدلي إلى الطلب
    request.PrescriptionRadiologyRequest.push({ radiologyId, price, accepted });
    await request.save();

    res.status(200).json({ message: 'تم إرسال الرد بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء الرد على الطلب', error });
  }
});

router.get('/patient-responses-from-radiology/:patientId', async (req, res) => {
  try {
    const patientRequests = await PrescriptionRadiologyRequest.find({
      patientId: req.params.patientId,
    }).populate('PrescriptionRadiologyRequest.radiologyId', 'fullName phone city region');
    let responses = [];
    patientRequests.forEach((request) => {
      request.PrescriptionRadiologyRequest.forEach((response) => {
        if (response.accepted) {
          responses.push({
            radiologyName: response.radiologyId.fullName,
            phone: response.radiologyId.phone,
            city: response.radiologyId.city,
            region: response.radiologyId.region,
            price: response.price,
          });
        }
      });
    });

    res.status(200).json({ responses });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء جلب الردود', error });
  }
});
  
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
router.post('/isApprovedAnalyst', async (req, res) => {
  const email = req.body.email;
  if (!email) {
    res.status(404).json({ success: false, message: 'Email Not found' });
  }
  const user = await Analyst.findOne({ email });
  if (!user) {
    res.status(404).json({ success: false, message: 'User Not found' });
  }
  if (!user.approved) {
    res
      .status(400)
      .json({ success: false, message: 'user is not approved yet!' });
  }
  res
    .status(201)
    .json({ success: true, message: 'user is  approved sucessfully!' });
});
router.get('/approve/analyst/:id', analystController.approveAnalyst);
router.get('/reject/analyst/:id', analystController.rejectAnalyst);
router.get(
  '/getAnalystsinCity/:city?/:region?',
  checkprov.checkifLoggedIn,
  analystController.getAnalyst
);
//End Analyst
module.exports = router;
