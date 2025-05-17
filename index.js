require('dotenv').config();
const express = require('express');
const app = express();
const PharmaticRouter = require('./router/auth.router');
const AnalystRouter = require('./router/analyst.router');
const adminRouter = require('./router/admin.router');
const RadiologyRouter = require('./router/radiology.router');
const DoctorRouter = require('./router/doctor.router');
const Specialty = require('./model/Specialty.model');
const http = require('http');
const cloudinary = require('./config/cloudinary');
app.use('/uploads', express.static('uploads'));
const mongoose = require('mongoose');
const PORT = process.env.PORT;
const path = require('path');
const fs = require('fs');
app.use(express.static(path.join(__dirname, 'assests')));
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
app.use(express.urlencoded({ extended: true }));
const { default: helmet } = require('helmet');
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
app.use(helmet());
//require('./utils/sendWhatsAppMessage');
const server = http.createServer(app);
const localUri = 'mongodb://localhost:27017/medicalapp',
  GlobalUri =
    'mongodb+srv://feadkaffoura:YcQJ6vJSgdBFwX9b@cluster0.v3b0sud.mongodb.net/medicalapp?retryWrites=true&w=majority&appName=Cluster0';
mongoose
  .connect(GlobalUri)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.error('MongoDB connection error:', err));


const specialties = [
  'أسنان',
  'مراكز تجميل',
  'جلدية و تناسلية',
  'باطنه',
  'قلب و أوعية دموية',
  'نساء و توليد',
  'أنف و أذن و حنجرة',
  'عظام',
  'مخ و أعصاب',
  'عيون',
  'مسالك بولية',
  'جهاز هضمي و كبد',
  'كلى',
  'أمراض دم',
  'أورام',
  'علاج طبيعي',
  'الطب النفسي',
  'تخسيس و تغذية',
  'نطق و تخاطب',
  'جراحة عامة',
  'جراحة تجميل ',
  'جراحة أطفال',
  'جراحة أوعية دموية',
  'جراحة قلب و صدر',
  'جراحة مخ و اعصاب و عمود فقري',
  'جراحة اورام',
];

(async () => {
  try {
    await Specialty.deleteMany();

    const docs = [];

    for (let i = 0; i < specialties.length; i++) {
      const name = specialties[i].trim();
      const specId = i + 1;

      const imagePath = path.join(__dirname, 'specialty_images', `${name}.jpg`);

      if (!fs.existsSync(imagePath)) {
        console.warn(`❌ الصورة غير موجودة: ${imagePath}`);
        continue;
      }

      const uploadResult = await cloudinary.uploader.upload(imagePath, {
        folder: 'specialties',
        public_id: `spec_${specId}`,
      });

      docs.push({
        specId,
        name,
        image: uploadResult.secure_url,
      });

      console.log(`✅ تم رفع: ${name}`);
    }

    await Specialty.insertMany(docs);
    console.log('🎉 تم إدخال جميع التخصصات مع الصور بنجاح!');
    process.exit();
  } catch (err) {
    console.error('❌ خطأ أثناء رفع الصور أو الإدخال:', err);
    process.exit(1);
  }
})();

app.use('/api/Pharmatic', PharmaticRouter);
app.use('/api/Analyst', AnalystRouter);
app.use('/api/Radiology', RadiologyRouter);
app.use('/api/Doctor', DoctorRouter);
app.use('/admin', adminRouter);



server.listen(PORT, () => {
  console.log(`Server is Running ${PORT}`);
});
