const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const analystController = require("../controllers/analyst.controller");
const RadiologyController = require("../controllers/radiology.controller");
const { body } = require("express-validator");
const checkprov = require("../middleware/auth.middleware");
const ckeckSeek = require("../middleware/seek.middleware");
const Pharmacy = require("../model/auth.model");
const Doctor = require("../model/doctor.model");
const Pharmatic = require("../model/auth.model");
const Radiology = require("../model/radiology.model");
const Analyst = require("../model/analyst.model");
const mongoose = require("mongoose");
const Booking = require("../model/book.model");
const PrescriptionRequest = require("../model/PrescriptionRequest.model");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "dqk8dzdoo",
  api_key: "687124232966245",
  api_secret: "LhIKcexhYtHUK-bZSiIoT8jsMqc",
});

// For pharmacy
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `pharmacies/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ["jpg", "png", "jpeg"],
  }),
});
const upload = multer({ storage: storage });

// For radiology
const storage_for_radiology = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `radiology/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ["jpg", "png", "jpeg"],
  }),
});
const uploadForRadiology = multer({ storage: storage_for_radiology });

// For doctor
const storage_for_Doctor = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `Doctors/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ["jpg", "png", "jpeg"],
  }),
});
const uploadfordoctor = multer({ storage: storage_for_Doctor });
//api doctor
router.post(
  "/createNewDoctor",
  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 3 characters long"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("region").trim().notEmpty().withMessage("region is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("specilizate")
      .trim()
      .notEmpty()
      .withMessage("specilizate is required"),

    body("city").trim().notEmpty().withMessage("City is required"),
    body("phone").notEmpty().withMessage("phone is required"),
  ],
  authController.createNewDoctor
);

router.get("/approve/doctor/:id", authController.approveDoctor);
router.get("/reject/doctor/:id", authController.rejectDoctor);
router.post("/signinDoctor", authController.loginDoctor);
router.post(
  "/rateDoctor/:DoctorId",
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  authController.rateDoctor
);
router.get(
  "/final-rate-doctor/:doctorId",
  authController.getFinalRateforDoctor
);
router.get(
  "/getDoctorsinCity/:city?/:region?/:spec?",
  // checkprov.checkifLoggedIn,
  // ckeckSeek.authenticateSeek,
  authController.getDoctors
);

router.post(
  "/createNewBook",
  // checkprov.checkifLoggedIn,
  // ckeckSeek.authenticateSeek,
  authController.createNewBook
);
router.post(
  "/updateDoctorInfo/:id",
  body("phone").notEmpty().withMessage("phone is required"),
  checkprov.isDoctor,
  checkprov.checkifLoggedIn,
  authController.updateDoctorInfo
);
router.post(
  "/upload-doctor-photo/:id",
  checkprov.checkifLoggedIn,
  uploadfordoctor.single("image"),
  async (req, res) => {
    try {
      const DoctorId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(DoctorId)) {
        return res.status(400).json({ message: "Invalid pharmacy ID" });
      }
      const TheDoctor = await Doctor.findById(DoctorId);
      if (!TheDoctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const image = req.file.path;
      TheDoctor.doctorimage.push({
        imageUrl: image,
        date: new Date(),
      });
      await TheDoctor.save();
      res.status(200).json({
        message: "Image uploaded successfully",
        data: TheDoctor,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server", error });
    }
  }
);

router.get("/get-doctor-image/:id", async (req, res) => {
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
  "/createNewSeek",
  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 3 characters long"),
    body("phone").notEmpty().withMessage("phone is required"),
  ],
  authController.createNewSeek
);
router.post(
  "/logoutSeek/:id",
  checkprov.checkifLoggedIn,
  authController.logoutSeek
);

//End Seek

//Pharmatic Section
router.post(
  "/createNewPharmatic",
  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 3 characters long"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("region").trim().notEmpty().withMessage("region is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),

    body("city").trim().notEmpty().withMessage("City is required"),
    body("phone").notEmpty().withMessage("phone is required"),
  ],
  
  authController.createNewPharmatic
);
router.post("/isApprovedPharmatic" , async(req,res)=>{
  const email = req.body.email
  if(!email){
    res.status(404).json({success:false , message:"Email Not found"})
  }
  const user = await Pharmatic.findOne({email})
  if(!user){
    res.status(404).json({success:false , message:"User Not found"})
  }
  if(!user.approved){
    res.status(400).json({success:false , message:"user is not approved yet!"})
  }
  res.status(201).json({success:true , message:"user is  approved sucessfully!"})

})
router.post(
  "/ratePharmacy/:pharmaticId",
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  authController.ratePharmatic
);
router.get("/final-rate-pharmacy/:pharmaticId", authController.getFinalRate);
router.get("/approve/pharmatic/:id", authController.approvePharmatic);
router.get("/reject/pharmatic/:id", authController.rejectPharmatic);
router.post("/signinPharmatic", checkprov.isProvved, authController.loginPhar);
router.post(
  "/updatePharInfo/:id",
  checkprov.checkifLoggedIn,
  checkprov.isPharmatic,
  authController.updatePharmaticInfo
);
router.get(
  "/getPharmainCity/:city?/:region?",
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  authController.getPharmas
);
router.post(
  "/upload-image-for-pharmacy/:Seekid/:city/:region",
  upload.single("image"),
  async (req, res) => {
    try {
      const { Seekid, city, region } = req.params;
      if (!mongoose.Types.ObjectId.isValid(Seekid)) {
        return res.status(400).json({ message: "Invalid Seek ID" });
      }
      if (!req.file) return res.status(400).json({ message: "يرجى رفع صورة" });
      const imageUrl = req.file.path;
      const prescription = new PrescriptionRequest({
        Seekid,
        city,
        region,
        imageUrl,
      });
      await prescription.save();
      res
        .status(201)
        .json({ message: "تم إرسال الروشتة بنجاح إلى الصيادلة", prescription });
    } catch (error) {
      res.status(500).json({ error: error });
    }
  }
);
router.post("/prescriptions/:id/respond", async (req, res) => {
  try {
    const { pharmacistId, price } = req.body;
    const prescription = await PrescriptionRequest.findById(req.params.id);

    if (!prescription)
      return res.status(404).json({ message: "طلب الروشتة غير موجود" });

    // إضافة رد الصيدلي
    prescription.responses.push({
      pharmacistId,
      price,
      status: "pending",
    });

    await prescription.save();

    res.json({ message: "تم إرسال السعر بنجاح", prescription });
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء إرسال السعر" });
  }
});
router.get("/prescriptions/patient/:patientId", async (req, res) => {
  try {
    const prescriptions = await PrescriptionRequest.find({
      Seekid: req.params.patientId,
    }).populate("responses.pharmacistId");
    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ أثناء جلب الطلبات", error });
  }
});
router.get("/prescriptions/pharmacist/:pharmacistId", async (req, res) => {
  try {
    const prescriptions = await PrescriptionRequest.find({
      "responses.pharmacistId": req.params.pharmacistId,
    });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء جلب الطلبات" });
  }
});

// router.post(
//   '/upload-image-for-pharmacy/:id/:Seekid',
//   upload.single('image'),
//   async (req, res) => {
//     try {
//       const { id, Seekid } = req.params;

//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ message: 'Invalid pharmacy ID' });
//       }

//       const pharmacy = await Pharmacy.findById(id);
//       if (!pharmacy) {
//         return res.status(404).json({ message: 'Pharmacy not found' });
//       }

//       if (!req.file) {
//         return res.status(400).json({ message: 'No file uploaded' });
//       }

//       const imageUrl = req.file.path; // Cloudinary URL

//       await pharmacy.notifications.push({
//         sickId: Seekid,
//         imageUrl: imageUrl,
//         date: new Date(),
//       });

//       await pharmacy.save();

//       res.status(200).json({
//         message: 'Image uploaded successfully',
//         data: pharmacy,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   }
// );
router.get("/imagesForPharmacy/:pharmacistId", async (req, res) => {
  try {
    const { pharmacistId } = req.params;
    const pharmacy = await Pharmacy.findById(pharmacistId);
    const notify = [pharmacy.notifications];
    res.status(201).json({ success: true, notify });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/logoutSpec",
  checkprov.checkifLoggedIn,
  authController.logoutSpec
);
//router.post('/sendMessageToPharmatic/:city?/:address?',authController.sendMessage);
//router.get('/getMessages/:userId', authController.getMessages);
//End Pharmatic

//Radiology Section
router.post(
  "/createNewRadiology",
  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 3 characters long"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("region").trim().notEmpty().withMessage("region is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),

    body("city").trim().notEmpty().withMessage("City is required"),
    body("phone").notEmpty().withMessage("phone is required"),
  ],
  RadiologyController.createNewRadiology
);
router.post("/isApprovedRadiology" , async(req,res)=>{
  const email = req.body.email
  if(!email){
    res.status(404).json({success:false , message:"Email Not found"})
  }
  const user = await Radiology.findOne({email})
  if(!user){
    res.status(404).json({success:false , message:"User Not found"})
  }
  if(!user.approved){
    res.status(400).json({success:false , message:"user is not approved yet!"})
  }
  res.status(201).json({success:true , message:"user is  approved sucessfully!"})

})
router.get("/approve/radiology/:id", RadiologyController.approveRadiology);
router.get("/reject/radiology/:id", RadiologyController.rejectRadiology);
router.get(
  "/getradiologiesinCity/:city?/:region?",
  checkprov.checkifLoggedIn,
  RadiologyController.getradiology
);
router.post(
  "/rateRadiology/:radiologyId",
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  RadiologyController.rateRadiology
);
router.get(
  "/final-rate-radiology/:radiologyId",
  RadiologyController.getFinalRateForRadiology
);
router.post(
  "/signinRadiology",
  checkprov.isProvved,
  RadiologyController.loginRadio
);
router.post(
  "/updateRadioInfo/:id",
  checkprov.checkifLoggedIn,
  RadiologyController.updateRadiologyInfo
);
router.post(
  "/upload-image-for-radiology/:id/:Seekid",
  uploadForRadiology.single("image"),
  async (req, res) => {
    try {
      const { id, Seekid } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid radiology ID" });
      }

      const radiology = await Radiology.findById(id);
      if (!radiology) {
        return res.status(404).json({ message: "radiology not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageUrl = req.file.path; // Cloudinary URL

      await radiology.notifications.push({
        sickId: Seekid,
        imageUrl: imageUrl,
        date: new Date(),
      });

      await radiology.save();

      res.status(200).json({
        message: "Image uploaded successfully",
        data: radiology,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);
router.get("/imagesForRadiology/:radiologyId", async (req, res) => {
  try {
    const { radiologyId } = req.params;
    const radiology = await Pharmacy.findById(radiologyId);
    const notify = [radiology.notifications];
    res.status(201).json({ success: true, notify });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//End Radiology

//Analyst Section

router.post(
  "/createNewAnalyst",
  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 3 characters long"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("region").trim().notEmpty().withMessage("region is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),

    body("city").trim().notEmpty().withMessage("City is required"),
    body("phone").notEmpty().withMessage("phone is required"),
  ],
  analystController.createNewAnalyst
);
router.post("/isApprovedAnalyst" , async(req,res)=>{
  const email = req.body.email
  if(!email){
    res.status(404).json({success:false , message:"Email Not found"})
  }
  const user = await Analyst.findOne({email})
  if(!user){
    res.status(404).json({success:false , message:"User Not found"})
  }
  if(!user.approved){
    res.status(400).json({success:false , message:"user is not approved yet!"})
  }
  res.status(201).json({success:true , message:"user is  approved sucessfully!"})

})
router.get("/approve/analyst/:id", analystController.approveAnalyst);
router.get("/reject/analyst/:id", analystController.rejectAnalyst);
router.get(
  "/getAnalystsinCity/:city?/:region?",
  checkprov.checkifLoggedIn,
  analystController.getAnalyst
);
//End Analyst
module.exports = router;
