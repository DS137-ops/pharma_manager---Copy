const router = require('express').Router();
const doctorController = require('../controllers/doctor.controller');
const { body } = require('express-validator');
const checkprov = require('../middleware/auth.middleware');
const ckeckSeek = require('../middleware/seek.middleware');
const adminmiddleware = require('../middleware/admin.middleware');
const Doctor = require('../model/doctor.model');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'dqk8dzdoo',
  api_key: '687124232966245',
  api_secret: 'LhIKcexhYtHUK-bZSiIoT8jsMqc',
});
const storage_for_Doctor = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `Doctors/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const uploadfordoctor = multer({ storage: storage_for_Doctor });

const storage_for_gallery_Doctor = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `gallery/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const galleryfordoctor = multer({ storage: storage_for_gallery_Doctor });

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
  doctorController.createNewDoctor
);
router.get('/search', checkprov.checkifLoggedIn , doctorController.searchdoctorByName);
router.post('/add-to-famous'  , doctorController.addToFamousDoctors);
router.post("/createrangeBooking/:id" , checkprov.checkifLoggedIn , doctorController.createBooking)
router.get("/getAvailableAppointments/:id", checkprov.checkifLoggedIn, doctorController.getAvailableAppointments);

router.delete("/delete-doctor-account", checkprov.authMiddlewareforDoctor, doctorController.deleteDoctorAccount );

router.get('/approve/doctor/:id', doctorController.approveDoctor);
router.get('/reject/doctor/:id', doctorController.rejectDoctor);
router.post(
  '/signinDoctor',
  checkprov.isProvvedDoctor,
  checkprov.checkifLoggedOut,
  doctorController.loginDoctor
);
router.post(
  '/rateDoctor/:DoctorId',
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  doctorController.rateDoctor
);
router.get(
  '/final-rate-doctor/:doctorId',
  doctorController.getFinalRateforDoctor
);
router.get(
  '/getDoctorsinCity/:city?/:region?/:spec?',
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  doctorController.getDoctors
);

router.post(
  '/createNewBook',
  checkprov.checkifLoggedIn,
  ckeckSeek.authenticateSeek,
  doctorController.createNewBook
);
router.post(
  '/updateDoctorInfo/:id',
  body('phone').notEmpty().withMessage('phone is required'),
  checkprov.isDoctor,
  checkprov.checkifLoggedIn,
  doctorController.updateDoctorInfo
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

    res.status(200).json({ success: true, notify });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/add-for-gallery/:id',
  galleryfordoctor.single('image'),
  async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({ message: 'no Id available' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    try {
      const doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({ message: 'No Doctor here' });
      }
      const imageUrl = req.file.path;
      doctor.Gallery.push({
        imageUrl: imageUrl,
      });
      await doctor.save();
      return res.status(200).json({message:'image add to gallery'})
    } catch (err) {
      res.status(500).json({ err: err });
    }
  }
);

router.delete('/remove-from-gallery/:doctorId/:imageId', async (req, res) => {
  const { doctorId, imageId } = req.params;

  if (!doctorId || !imageId) {
    return res.status(400).json({ message: 'Doctor ID and Image ID are required' });
  }

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const updatedGallery = doctor.Gallery.filter(image => image._id.toString() !== imageId);

    if (doctor.Gallery.length === updatedGallery.length) {
      return res.status(404).json({ message: 'Image not found in gallery' });
    }

    doctor.Gallery = updatedGallery;
    await doctor.save();

    return res.status(200).json({ message: 'Image removed successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/forgot-password-for-doctor", doctorController.forgetPassForDoctor);

router.post("/verify-code-for-doctor", doctorController.verifyCodeDoctor);

router.post("/reset-password-for-doctor", doctorController.resetDoctorPass);

router.get("/get-profile/:id" , checkprov.checkifLoggedIn , async(req,res)=>{
  const { id } = req.params
   if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await Doctor.findById(id)
    if(!user){
       return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({success:true , data:user})
})

router.post('/add-doctor-to-favourite', 
  checkprov.checkifLoggedIn ,
  doctorController.toggleDoctorFavourite);
router.get('/my-favourites/:userId',checkprov.checkifLoggedIn, doctorController.getFavourites);
router.delete('/from-favourite/:cardId' , checkprov.checkifLoggedIn , doctorController.deleteFromFavo)
module.exports = router;
