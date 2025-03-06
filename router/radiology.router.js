const router = require('express').Router();
const RadiologyController = require('../controllers/radiology.controller');
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const ckeckSeek = require('../middleware/seek.middleware');
const Radiology = require('../model/radiology.model');
const PrescriptionRadiologyRequest = require('../model/PrescriptionRadiology.model');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dqk8dzdoo',
  api_key: '687124232966245',
  api_secret: 'LhIKcexhYtHUK-bZSiIoT8jsMqc',
});
const storage_for_radiology = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `radiology/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const uploadForRadiology = multer({ storage: storage_for_radiology });

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
router.post(
  '/signinRadiology',
  checkprov.isProvvedRadio,
  checkprov.checkifLoggedOut,
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
router.get('/Radiology-requests/:radiologyId', async (req, res) => {
  const radiology = await Radiology.findById(req.params.radiologyId);
  if (!radiology) return res.status(404).json({ message: 'الصيدلي غير موجود' });

  try {
    const requests = await PrescriptionRadiologyRequest.find({
      city: radiology.city,
      region: radiology.region,
    }).populate('patientId');
    const formattedRequests = requests.map((req) => ({
      ...req.toObject(),
      dateFormatted: new Date(req.date).toISOString().split('T')[0], // yyyy-mm-dd
      timeFormatted: new Date(req.date).toISOString().split('T')[1].slice(0, 5), // hh:mm
    }));

    res.status(200).json({ requests: formattedRequests , reqs:requests });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'خطأ أثناء جلب الطلبات', error: error.message });
  }
});
router.post('/respond-request-from-Radiology', async (req, res) => {
  try {
    const { requestId, specId, price, accepted } = req.body;

    const request = await PrescriptionRadiologyRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });
    if (accepted && !price) {
      res.status(400).json({ message: 'price is required' });
    }
    request.PrescriptionRadiologyRequest.push({ specId, price, accepted });
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
    }).populate(
      'PrescriptionRadiologyRequest.radiologyId',
      'fullName phone city region'
    );
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

module.exports = router;
