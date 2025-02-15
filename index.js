require('dotenv').config();
const express = require('express');
const app = express();
const authRouter = require('./router/auth.router');
const adminRouter = require('./router/admin.router');
const http = require('http');
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
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dqk8dzdoo',
  api_key: '687124232966245',
  api_secret: 'LhIKcexhYtHUK-bZSiIoT8jsMqc',
});

// Multer Storage Configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: `pharmacies/${req.params.id}`, // Creates a unique folder for each pharmacy
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }),
});
const upload = multer({ storage: storage });

const server = http.createServer(app);
const localUri = 'mongodb://localhost:27017/medicalapp',
  GlobalUri =
    'mongodb+srv://feadkaffoura:YcQJ6vJSgdBFwX9b@cluster0.v3b0sud.mongodb.net/medicalapp?retryWrites=true&w=majority&appName=Cluster0';
mongoose
  .connect(GlobalUri)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api', authRouter);
app.use('/admin', adminRouter);

server.listen(PORT, () => {
  console.log(`server is Running ${PORT}`);
});
