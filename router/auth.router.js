const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const ckeckSeek = require('../middleware/seek.middleware');
const Pharmatic = require('../model/auth.model');
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
  // checkprov.checkifLoggedIn,
  // ckeckSeek.authenticateSeek,
  authController.getPharmas
);

router.post(
  '/send-request/:patientId/:city/:region',
  upload.single('image'),
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

router.get('/Pharmatic-requests/:pharmacistId', async (req, res) => {
  const pharmacist = await Pharmatic.findById(req.params.pharmacistId);
  if (!pharmacist)
    return res.status(404).json({ message: 'الصيدلي غير موجود' });

  try {
    const requests = await PrescriptionRequest.find({
      city: pharmacist.city,
      region: pharmacist.region,
    }).populate('patientId');
    const formattedRequests = requests.map((req) => ({
      ...req.toObject(),
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
    request.pharmacistsResponded.push({ specId, price, accepted });
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

module.exports = router;
