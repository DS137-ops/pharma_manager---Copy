const router = require('express').Router();
const analystController = require('../controllers/analyst.controller');
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const Analyst = require('../model/analyst.model');
const PrescriptionAnalystRequest = require('../model/PrescriptionAnalystRequest.model');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dqk8dzdoo',
  api_key: '687124232966245',
  api_secret: 'LhIKcexhYtHUK-bZSiIoT8jsMqc',
});
const storage_for_analyst = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `analyst/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const uploadForAnalyst = multer({ storage: storage_for_analyst });
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
  router.post(
    '/signinAnalyst',
    checkprov.isProvvedAna,
    checkprov.checkifLoggedOut,
    analystController.loginAna
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
  router.post(
    '/send-request-for-analyst/:patientId/:city/:region',
    uploadForAnalyst.single('image'),
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
        const newRequest = new PrescriptionAnalystRequest({
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
  router.get('/analyst-requests/:analystId', async (req, res) => {
    try {
      const analyst = await Analyst.findById(req.params.analystId);
      if (!analyst)
        return res.status(404).json({ message: 'الصيدلي غير موجود' });
  
      const requests = await PrescriptionAnalystRequest.find({
        city: analyst.city,
        region: analyst.region,
      }).populate('patientId');
  
      res.status(200).json({ requests });
    } catch (error) {
      res.status(500).json({ message: 'خطأ أثناء جلب الطلبات',error: error.message });
    }
  });
  router.post('/respond-request-from-analyst', async (req, res) => {
    try {
      const { requestId, analystId, price, accepted } = req.body;
  
      const request = await PrescriptionAnalystRequest.findById(requestId);
      if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });
      if (accepted && !price) {
        res.status(400).json({ message: 'price is required' });
      }
      request.PrescriptionAnalystRequest.push({ analystId, price, accepted });
      await request.save();
  
      res.status(200).json({ message: 'تم إرسال الرد بنجاح' });
    } catch (error) {
      res.status(500).json({ message: 'خطأ أثناء الرد على الطلب', error });
    }
  });
  
  router.get('/patient-responses-from-analyst/:patientId', async (req, res) => {
    try {
      const patientRequests = await PrescriptionAnalystRequest.find({
        patientId: req.params.patientId,
      }).populate('PrescriptionAnalystRequest.analystId', 'fullName phone city region');
      let responses = [];
      patientRequests.forEach((request) => {
        request.PrescriptionAnalystRequest.forEach((response) => {
          if (response.accepted) {
            responses.push({
              analystName: response.analystId.fullName,
              phone: response.analystId.phone,
              city: response.analystId.city,
              region: response.analystId.region,
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

  //End Analyst
module.exports = router;