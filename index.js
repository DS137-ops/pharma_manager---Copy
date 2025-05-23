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

// const specialties = [
//   'أسنان',
//   'مراكز تجميل',
//   'جلدية و تناسلية',
//   'باطنه',
//   'قلب و أوعية دموية',
//   'نساء و توليد',
//   'أنف و أذن و حنجرة',
//   'عظام',
//   'عيون',
//   'مسالك بولية',
//   'جهاز هضمي و كبد',
//   'كلى',
//   'أمراض دم',
//   'علاج طبيعي',
//   'الطب النفسي',
//   'تخسيس و تغذية',
//   'نطق و تخاطب',
//   'جراحة عامة',
//   'جراحة تجميل ',
//   'جراحة أطفال',
//   'جراحة أوعية دموية',
//   'جراحة قلب و صدر',
//   'جراحة اورام',
//   'مخ و أعصاب',
//   'أورام',
//   'جراحة مخ و اعصاب و عمود فقري',
// ];

const specialties = [
  {
    name: 'أسنان',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587467/أسنان_mu42va.jpg',
  },
  {
    name: 'قلب و أوعية دموية',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587466/قلب_و_أوعية_دموية_eptjaz.jpg',
  },
  {
    name: 'جراحة تجميل',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587462/جراحة_تجميل_ybapml.jpg',
  },
  {
    name: 'أنف و أذن و حنجرة',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587465/أنف_و_أذن_و_حنجرة_h9vnlx.jpg',
  },
  {
    name: 'جهاز هضمي و كبد',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587464/جهاز_هضمي_و_كبد_k7roij.jpg',
  },
  {
    name: 'نساء و توليد',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587465/نساء_و_توليد_loubcj.jpg',
  },
  {
    name: 'عيون',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587464/عيون_beu3pj.jpg',
  },
  {
    name: 'مراكز تجميل',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587466/مراكز_تجميل_tx00fk.jpg',
  },
  {
    name: 'باطنه',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587466/باطنه_uoirvo.jpg',
  },
  {
    name: 'جلدية و تناسلية',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587466/جلدية_و_تناسلية_fqhqrj.jpg',
  },
  {
    name: 'مسالك بولية',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587464/مسالك_بولية_n2u423.jpg',
  },
  {
    name: 'عظام',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587464/عظام_lv7sac.jpg',
  },
  {
    name: 'جراحة أطفال',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587462/جراحة_أطفال_qvnnew.jpg',
  },
  {
    name: 'كلى',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587464/كلى_x93p2b.jpg',
  },
  {
    name: 'نطق و تخاطب',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587462/نطق_و_تخاطب_f5spq9.jpg',
  },
  {
    name: 'جراحة عامة',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587462/جراحة_عامة_vbumyp.jpg',
  },
  {
    name: 'أمراض دم',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587463/أمراض_دم_gxqgsx.jpg',
  },
  {
    name: 'تخسيس و تغذية',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587462/تخسيس_و_تغذية_e3crgu.jpg',
  },
  {
    name: 'الطب النفسي',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587462/الطب_النفسي_d6fmdb.jpg',
  },
  {
    name: 'علاج طبيعي',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587463/علاج_طبيعي_aau9wg.jpg',
  },
  {
    name: 'جراحة أوعية دموية',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587460/جراحة_أوعية_دموية_ew7rpf.jpg',
  },
  {
    name: 'مخ و أعصاب',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587460/مخ_و_أعصاب_hw1ts3.jpg',
  },
  {
    name: 'جراحة أورام',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587459/جراحة_أورام_e3xymh.jpg',
  },
  {
    name: 'جراحة قلب و صدر',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587460/جراحة_قلب_و_صدر_uqawgh.jpg',
  },
  {
    name: 'جراحة مخ و أعصاب و عمود فقري',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587459/%D8%AC%D8%B1%D8%A7%D8%AD%D8%A9_%D9%85%D8%AE_%D9%88_%D8%A7_%D8%B9%D8%B5%D8%A7%D8%A8_%D9%88_%D8%B9%D9%85%D9%88%D8%AF_%D9%81%D9%82%D8%B1%D9%8A_lkpcnu.jpg',
  },
  {
    name: 'أورام',
    image:
      'https://res.cloudinary.com/dqk8dzdoo/image/upload/v1747587459/أورام_dxnoip.jpg',
  },
];
const docs = specialties.map((spec, index) => ({
  name: spec.name.trim(),
  specId: index + 1,
  image: spec.image,
}));

mongoose
  .connect(GlobalUri)
  .then(async () => {
    console.log('MongoDB connected!');

    // try {
    //   await Specialty.deleteMany();
    //   await Specialty.insertMany(docs);
    //   console.log('added images succesfully');
    //   process.exit(0);
    // } catch (err) {
    //   console.error('error', err);
    //   process.exit(1);
    // }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use('/api/Pharmatic', PharmaticRouter);
app.use('/api/Analyst', AnalystRouter);
app.use('/api/Radiology', RadiologyRouter);
app.use('/api/Doctor', DoctorRouter);
app.use('/admin', adminRouter);

app.listen(2000, '0.0.0.0', () => {
  console.log(`Server is Running ${PORT}`);
});
