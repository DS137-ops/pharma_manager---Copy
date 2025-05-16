require('dotenv').config();
const bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
const SeekSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    match: [
      /^201[0-9]{9}$/,
      'Please enter a valid Egyptian phone number',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },
  role: {
    type: String,
    default: 'user',
    enum: ['user'],
  },
  age: {
    type: Number,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  region: {
    type: String,
    default: null,
  },
  accountDate: {
    type: Date,
  },
  notifications: {
    type: Array,
    default: null,
  },
});

SeekSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

SeekSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});
module.exports = mongoose.model('Seek', SeekSchema);
