const User = require('../model/auth.model');
const Analyst = require('../model/analyst.model');
const Doctor = require('../model/doctor.model');
const Radiology = require('../model/radiology.model');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
const Seek = require('../model/seek.model');
const jwt = require('jsonwebtoken');

//if the spec is approved  Common for all specs
exports.isProvvedPharm = async (req, res, next) => {
  const { email } = req.body;
  if(!email){
   return  res.status(404).json({message:'email should not empty'})
  }
  try {

    if (!email) {
      return res
        .status(401)
        .json({ success: false, message: 'Email is required' });
    }
    const userlog = await User.findOne({ email });
    if (!userlog) {
      return res
        .status(404)
        .json({ success: false, message: 'Email is inCorrect' });
    }
    if (!userlog.approved) {
      return res.status(403).json({
        success: false,
        message:
          'Your account is not approved yet. Please wait for admin approval.',
      });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal server error', error });
  }
};

exports.isProvvedDoctor = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(401)
        .json({ success: false, message: 'Email is required' });
    }
    const userlog = await Doctor.findOne({ email });
    if (!userlog) {
      return res
        .status(404)
        .json({ success: false, message: 'Email is inCorrect' });
    }
    if (!userlog.approved) {
      return res.status(403).json({
        success: false,
        message:
          'Your account is not approved yet. Please wait for admin approval.',
      });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal server error', error });
  }
};
exports.isProvvedAna = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(404)
      .json({ success: false, message: 'Email is required' });
  }
  try {
    const userlog = await Analyst.findOne({ email });
    if (!userlog) {
      return res
        .status(404)
        .json({ success: false, message: 'Email is inCorrect' });
    }
    if (!userlog.approved) {
      return res.status(403).json({
        success: false,
        message:
          'Your account is not approved yet. Please wait for admin approval.',
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: 'Internal server error', error });
  }
};

exports.isProvvedRadio = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(404)
      .json({ success: false, message: 'Email is required' });
  }
  try {
    const userlog = await Radiology.findOne({ email });
    if (!userlog) {
      return res
        .status(404)
        .json({ success: false, message: 'Email is inCorrect' });
    }
    if (!userlog.approved) {
      return res.status(403).json({
        success: false,
        message:
          'Your account is not approved yet. Please wait for admin approval.',
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: 'Internal server error', error });
  }
};
//if the spec is logged in ==> next()   Common for all specs
exports.checkifLoggedIn = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  console.log(token);

  const refreshtoken = await RefreshToken.findOne({ token });
  console.log(refreshtoken);
  if (!refreshtoken) {
    return res.status(401).json({ message: 'You are Logged Out' });
  }
  next();
};

exports.isPharmatic = async (req, res, next) => {
  try {
    const { pharmaticId } = req.params;
    if (!pharmaticId) {
      return res
        .status(404)
        .json({ success: false, message: 'No access available' });
    }
    const isphar = await User.find({ pharmaticId });
    if (!isphar) {
      return res
        .status(404)
        .json({ success: false, message: 'Allow for pharmatics' });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal server error', error });
  }
};

exports.isDoctor = async (req, res, next) => {
  try {
    const DoctorId = req.params.id;
    console.log(DoctorId);
    if (!DoctorId) {
      return res
        .status(404)
        .json({ success: false, message: 'No access available' });
    }
    const isDoctor = await Doctor.findById(DoctorId);
    if (!isDoctor) {
      return res
        .status(404)
        .json({ success: false, message: 'Allow for Doctors' });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal server error', error });
  }
};

exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'يجب تسجيل الدخول' });
    }

    const decoded = jwt.verify(token, '1001110');
    const patient = await Seek.findById(decoded.id);

    if (!patient) {
      return res.status(404).json({ message: 'المريض غير موجود' });
    }

    req.user = {
      patientId: patient._id,
      name: patient.name,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'المصادقة فشلت', error: error.message });
  }
};

exports.checkifLoggedOut = async (req, res, next) => {
  try {
      const token = req.header('Authorization')?.split(' ')[1];

      if (!token) {
          // No token found → User is logged out → Allow login
          return next();
      }

      // Check if the token is in the blacklist (meaning the user logged out)
      const isBlacklisted = await Blacklist.findOne({ token });

      if (isBlacklisted) {
          // Token is blacklisted → Allow login
          return next();
      }

      // If token exists but is not blacklisted → User is still logged in
      return res.status(401).json({ message: 'You are already logged in. Please logout first.' });

  } catch (error) {
      console.error("Error in checkifLoggedOut middleware:", error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


