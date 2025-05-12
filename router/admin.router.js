const express = require("express");
const doctorAdvert = require('../model/doctorAdvert.model');
const PharmacyAdvert = require('../model/pharmacyAdvert.model');
const RadiologyAdvert = require('../model/radiologyAdvert.model');
const AnalystAdvert = require('../model/analystAdvert.model');
const SupportTicket = require('../model/supportSchema.model');
const SeekAdvert = require('../model/seekAdvert.model');
const { createAdmin, adminLogin ,setPrivacyPolicy ,getPrivacyPolicy , addAboutUs ,getAboutUs } = require("../controllers/adminController.controller");
const City = require("../model/cities.model");
const mongoose = require("mongoose")
const { body } = require("express-validator");
const multer = require("multer")
const { v4: uuidv4 } = require("uuid");
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


const storage2 = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `seekAdvert`,
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const Advert_for_seek = multer({ storage: storage2 });

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
    res.status(200).json({ message: 'تمت إضافة الإعلان بنجاح', data: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/addprivacy", setPrivacyPolicy);

router.get("/getprivacy", getPrivacyPolicy);

router.post("/add-aboutus", addAboutUs)

router.get("/get-aboutus", getAboutUs)

router.get('/adverts-for-doctor', async (req, res) => {
  try {
    const adverts = await doctorAdvert.find().sort({ createdAt: -1 });
    if (adverts.length === 0) {
      return res.status(404).json({ message: 'No Adverts Yet' });
    }
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
    res.status(200).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/adverts-for-pharmacy', async (req, res) => {
  try {
    const adverts = await PharmacyAdvert.find().sort({ createdAt: -1 });
    if (adverts.length === 0) {
      return res.status(404).json({ message: 'No Adverts Yet' });
    }
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
    res.status(200).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/adverts-for-radiology', async (req, res) => {
  try {
    const adverts = await RadiologyAdvert.find().sort({ createdAt: -1 });
    if (adverts.length === 0) {
      return res.status(404).json({ message: 'No Adverts Yet' });
    }
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
    res.status(200).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/adverts-for-analyst', async (req, res) => {
  try {
    const adverts = await AnalystAdvert.find().sort({ createdAt: -1 });
    if (adverts.length === 0) {
      return res.status(404).json({ message: 'No Adverts Yet' });
    }
    res.status(200).json({ adverts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/add-advert-for-seek',Advert_for_seek.single('image'), async (req, res) => {
  if(!req.file){
    return res.status(404).json({message:'no file uploaded'})
  }
  const imageUrl = req.file.path;

    if (!imageUrl) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }
  try {
    
    const newAdvert = new SeekAdvert({
      imageUrl
    });

    await newAdvert.save();
    res.status(200).json({ message: 'تمت إضافة الإعلان بنجاح', advert: newAdvert });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/adverts-for-seek', async (req, res) => {
  try {
    const adverts = await SeekAdvert.find().sort({ createdAt: -1 });

    if (adverts.length === 0) {
      return res.status(404).json({ message: 'No Adverts Yet' });
    }

    res.status(200).json({ adverts });
  } catch (error) {
    console.error('Error fetching adverts:', error);
    res.status(500).json({ error: error.message });
  }
});



router.post("/contact-us", async (req, res) => {
  try {
    const { userId, userType, name, email, message } = req.body;

    if (!userId || !userType || !name || !email || !message) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }
    const ticketNumber = `TICKET-${uuidv4().slice(0, 8)}`;
    const newTicket = new SupportTicket({
      userId,
      userType,
      name,
      email,
      message,
      ticketNumber,
    });

    await newTicket.save();

    res.status(200).json({
      message: "تم استلام رسالتك بنجاح",
      ticketNumber,
    });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء إرسال الرسالة", err:error });
  }
});

router.get("/support-tickets", async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 }); // ترتيب من الأحدث إلى الأقدم
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء جلب الرسائل" });
  }
});

router.get("/support-tickets/:ticketNumber", async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const ticket = await SupportTicket.findOne({ ticketNumber });

    if (!ticket) {
      return res.status(404).json({ error: "لم يتم العثور على التذكرة" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء جلب تفاصيل التذكرة" , err:error });
  }
});

router.post("/add-city", async(req,res)=>{
  try {
    const { name } = req.body;
    const newCity = new City({ name, regions: [] });
    await newCity.save();
    res.status(201).json({ message: "City added successfully", city: newCity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/cities/:cityId/add-region", async(req,res)=>{
  try {
    const { cityId } = req.params;
    const { name } = req.body;

    const city = await City.findById(cityId);
    if (!city) return res.status(404).json({ error: "City not found" });

    const newRegion = { _id: new mongoose.Types.ObjectId(), name };
    city.regions.push(newRegion);
    await city.save();

    res.status(201).json({ message: "Region added successfully", region: newRegion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/cities", async(req,res)=>{
  try {
    const cities = await City.find();
    
    if (!cities || cities.length === 0) {
        return res.status(404).json({ message: "No cities found" });
    }
  
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/add-famous-doctor/:id" , async(req,res)=>{
  try{
    const newDoctor = await Doctor.findById(id)
    if(!newDoctor)return res.status(404).json({success:false , messsage:"No doctor found"})
      
  }catch(err){
    return res.status(500).json({success:false , message:`server error ${err}`})
  }
})

module.exports = router;