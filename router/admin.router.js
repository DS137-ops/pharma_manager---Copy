const express = require("express");
const doctorAdvert = require('../model/doctorAdvert.model');
const PharmacyAdvert = require('../model/pharmacyAdvert.model');
const RadiologyAdvert = require('../model/radiologyAdvert.model');
const AnalystAdvert = require('../model/analystAdvert.model');
const SeekAdvert = require('../model/seekAdvert.model');
const { createAdmin, adminLogin } = require("../controllers/adminController.controller");
const { body } = require("express-validator");
const multer = require("multer")
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dqk8dzdoo',
  api_key: '687124232966245',
  api_secret: 'LhIKcexhYtHUK-bZSiIoT8jsMqc',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `pharmacyAdvert`,
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const Advert_for_pharmacy = multer({ storage: storage });

const router = express.Router();
  const validateAdmin = [
   body("username").isString().notEmpty().withMessage("Username is required"),
   body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
 ];

router.post("/create", validateAdmin, createAdmin);
router.post("/login", validateAdmin, adminLogin);

router.post('/add-advert-for-doctor', async (req, res) => {
  try {
    const {  imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    const newAdvert = new doctorAdvert({
      imageUrl
    });

    await newAdvert.save();
    res.status(201).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/adverts-for-doctor', async (req, res) => {
  try {
    const adverts = await doctorAdvert.find().sort({ createdAt: -1 });
    res.status(200).json({ adverts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/add-advert-for-pharmacy',Advert_for_pharmacy.single('image'), async (req, res) => {
  if(!req.file){
    return res.status(404).json({message:'no file uploaded'})
  }
  const {imageUrl} = req.file.path;

    if (!imageUrl) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }
  try {
    
    const newAdvert = new PharmacyAdvert({
      imageUrl
    });

    await newAdvert.save();
    res.status(201).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/adverts-for-pharmacy', async (req, res) => {
  try {
    const adverts = await PharmacyAdvert.find().sort({ createdAt: -1 });
    res.status(200).json({ adverts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/add-advert-for-radiology', async (req, res) => {
  const {imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }
  try {
    
    const newAdvert = new RadiologyAdvert({
      imageUrl
    });

    await newAdvert.save();
    res.status(201).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/adverts-for-radiology', async (req, res) => {
  try {
    const adverts = await RadiologyAdvert.find().sort({ createdAt: -1 });
    res.status(200).json({ adverts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/add-advert-for-analyst', async (req, res) => {
  const {imageUrl } = req.body;

    if ( !imageUrl) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }
  try {
    
    const newAdvert = new AnalystAdvert({
      imageUrl
    });

    await newAdvert.save();
    res.status(201).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/adverts-for-analyst', async (req, res) => {
  try {
    const adverts = await AnalystAdvert.find().sort({ createdAt: -1 });
    res.status(200).json({ adverts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/add-advert-for-seek', async (req, res) => {
  const {imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }
  try {
    
    const newAdvert = new SeekAdvert({
      imageUrl
    });

    await newAdvert.save();
    res.status(201).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/adverts-for-analyst', async (req, res) => {
  try {
    const adverts = await AnalystAdvert.find().sort({ createdAt: -1 });
    res.status(200).json({ adverts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;