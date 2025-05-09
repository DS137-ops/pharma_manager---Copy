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
const { Client } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
app.use('/uploads', express.static('uploads'));
const mongoose = require('mongoose');
const PORT = process.env.PORT;
const path = require('path');
app.use(express.static(path.join(__dirname, 'assests')));
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
app.use(express.urlencoded({ extended: true }));
const { default: helmet } = require('helmet');
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
app.use(helmet());

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

const docs = specialties.map((name, index) => ({
  name: name.trim(),
  specId: index + 1,
}));
(async () => {
  await Specialty.deleteMany();
  await Specialty.insertMany(docs);
})();

app.use('/api/Pharmatic', PharmaticRouter);
app.use('/api/Analyst', AnalystRouter);
app.use('/api/Radiology', RadiologyRouter);
app.use('/api/Doctor', DoctorRouter);
app.use('/admin', adminRouter);

let currentQR = null;

const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

client.on('qr', (qr) => {
  currentQR = qr;
  console.log('qr11')
  qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp Client is ready!');
});

client.initialize();

app.get('/qr', (req, res) => {
  if (!currentQR) {
    return res.status(404).send('QR not available yet. Please wait...');
  }

  const qrImageURL = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(currentQR)}`;

  res.send(`
    <html>
      <body>
        <h2>Scan this QR code with WhatsApp:</h2>
        <img src="${qrImageURL}" alt="WhatsApp QR Code"/>
        <p>If the QR code doesn’t load, <a href="${qrImageURL}" target="_blank">click here</a></p>
      </body>
    </html>
  `);
});


server.listen(PORT, () => {
  console.log(`Server is Running ${PORT}`);
});
