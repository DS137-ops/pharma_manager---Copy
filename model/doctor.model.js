require('dotenv').config();
var mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
//enum:['admin','pharmatic','doctor','radiology' , 'Analyst'  ]        enum:['teeth','internal','baby','Gynecologist','eyes' , 'Orthopedic','surgeon','heart','Neurologist' , 'Urologist'  ]
//enum:['teeth','internal','baby','Gynecologist','eyes' , 'Orthopedic','surgeon','heart','Neurologist' , 'Urologist'  ]

const doctorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    minlength: [3, 'Full name must be at least 3 characters'],
  },
  email: {
    type: String,
    unique: true,
    match: [/.+@.+\..+/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
  },
  role: {
    type: String,
    default: 'doctor',
    enum: ['doctor'],
  },
  city: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: [true, 'address is required'],
  },
  phone: {
    type: String,
    required: [true, 'phone is required'],
    match: [
      /^(\+20|0)1[0-9]{9}$/,
      'Please enter a valid Egyptian phone number',
    ],
  },
  specilizate: {
    type: String,
    required: true,
    enum: [
      'teeth',
      'internal',
      'baby',
      'Gynecologist',
      'eyes',
      'Orthopedic',
      'surgeon',
      'heart',
      'Neurologist',
      'Urologist',
    ],
  },
  NumberState: { type: String, required: true },
  jobHour: {
    Monday: { start: String, end: String },
    Tuesday: { start: String, end: String },
    Wednesday: { start: String, end: String },
    Thursday: { start: String, end: String },
    Friday: { start: String, end: String },
    Saturday: { start: String, end: String },
    Sunday: { start: String, end: String },
  },
  rate: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor' },
      rating: { type: Number, min: 1, max: 5, required: true },
      review: { type: String, maxlength: 500 },
      date: { type: Date, default: Date.now },
    },
  ],
  approved: { type: Boolean, default: false },

  accountDate: {
    type: Date,
  },
  notifications: {
    type: Array,
    default: null,
  },
});

doctorSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('doctor', doctorSchema);
