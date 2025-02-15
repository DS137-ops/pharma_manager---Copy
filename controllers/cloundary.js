const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: 'dqk8dzdoo',
  api_key: '687124232966245',
  api_secret: 'LhIKcexhYtHUK',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'doctors', // Folder name in Cloudinary
    format: async (req, file) => 'png', // File format
    public_id: (req, file) => `doctor_${Date.now()}`, // Unique filename
  },
});

const upload = multer({ storage });

module.exports = upload;
