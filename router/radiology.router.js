const router = require('express').Router();
const RadiologyController = require('../controllers/radiology.controller');
const { body } = require('express-validator');
const FavouriteRadiologies = require('../model/FavouriteRadiology.model');
const checkprov = require('../middleware/auth.middleware');
const ckeckSeek = require('../middleware/seek.middleware');
const Radiology = require('../model/radiology.model');
const City = require('../model/cities.model');
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

router.delete(
  '/delete-radiology-account',
  checkprov.authMiddlewareforRadiology,
  RadiologyController.deleteRadiologyAccount
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
    .status(200)
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
router.get(
  '/getTopRadiology/:city/:region',
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

      const topRadiology = await Radiology.aggregate([
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

      const favouriteRadiolgy = await FavouriteRadiologies.find({ userId });
      const favouriteRadiologyIds = favouriteRadiolgy.map((fav) =>
        fav.radiologyId.toString()
      );

      const radiolgyWithFavStatus = topRadiology.map((radiology) => ({
        ...radiology,
        isFavourite: favouriteRadiologyIds.includes(radiology._id.toString()),
      }));

      return res
        .status(200)
        .json({ success: true, data: radiolgyWithFavStatus });
    } catch (err) {
      return res.status(500).json({ success: false, err: err.message });
    }
  }
);
router.post(
  '/add-radiology-to-favourite',
  checkprov.checkifLoggedIn,
  RadiologyController.toggleRadiologyFavourite
);
router.get(
  '/my-radiology-favourites/:userId',
  checkprov.checkifLoggedIn,
  RadiologyController.getFavourites
);
router.delete(
  '/from-favourite/:cardId',
  checkprov.checkifLoggedIn,
  RadiologyController.deleteFromFavo
);
router.get(
  '/patient-orders/:patientId',
  checkprov.checkifLoggedIn,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const requests = await PrescriptionRadiologyRequest.find(
        { patientId },
        '-pharmacistsResponded'
      );
      if (!requests) return res.status(404).json({ message: 'No orders' });
      return res.status(200).json({ message: requests });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);
router.post(
  '/send-request-for-radiology/:patientId/:city/:region',
  uploadForRadiology.single('image'),
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
      const newRequest = new PrescriptionRadiologyRequest({
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

    res.status(200).json({ requests: formattedRequests });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'خطأ أثناء جلب الطلبات', error: error.message });
  }
});
router.get(
  '/search',
  checkprov.checkifLoggedIn,
  RadiologyController.searchradiologyByName
);

router.post('/respond-request-from-Radiology', async (req, res) => {
  try {
    const { requestId, specId, price, accepted } = req.body;

    const request = await PrescriptionRadiologyRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });
    if (accepted && !price) {
      res.status(400).json({ message: 'price is required' });
    }
    console.log(1111111);
    request.radiologysResponded.push({ radiologyId: specId, price, accepted });
    console.log(222222);
    await request.save();

    res.status(200).json({ message: 'تم إرسال الرد بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء الرد على الطلب', error });
  }
});

router.get('/patient-responses-from-radiology/:patientId', async (req, res) => {
  try {
    console.log(33333333);
    const patientRequests = await PrescriptionRadiologyRequest.find({
      patientId: req.params.patientId,
    }).populate(
      'radiologysResponded.radiologyId',
      'fullName phone city region'
    );
    console.log(44444444);
    let responses = [];

    patientRequests.forEach((request) => {
      request.radiologysResponded.forEach((response) => {
        if (response.accepted && response.radiologyId) {
          // ✅ Check if radiologyId exists
          responses.push({
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

    res.status(200).json({ responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ message: 'خطأ أثناء جلب الردود', error });
  }
});

router.put('/update-request-status/:requestId', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['read', 'unread'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const request = await PrescriptionRadiologyRequest.findById(
      req.params.requestId
    );
    if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });

    request.status = status;
    await request.save();

    res.status(200).json({ message: `تم تحديث حالة الطلب إلى ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء تحديث الحالة', error });
  }
});

router.post('/add-to-famous', RadiologyController.addToFamousRadiologies);
router.get('/famous', RadiologyController.getFamousRadiologies);

router.post(
  '/forgot-password-for-radiology',
  RadiologyController.forgetPassForRadiology
);

router.post(
  '/verify-code-for-radiology',
  RadiologyController.verifyCodeRadiology
);

router.post(
  '/reset-password-for-radiology',
  RadiologyController.resetRadiologyPass
);

router.get('/get-profile/:id', checkprov.checkifLoggedIn, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  const user = await Radiology.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json({ success: true, data: user });
});

module.exports = router;
