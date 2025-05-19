const User = require('../model/auth.model');
const Analyst = require('../model/analyst.model');
const Doctor = require('../model/doctor.model');
const Radiology = require('../model/radiology.model');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
const Seek = require('../model/seek.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();
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
  const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header." });
    }

    const token = authHeader.split(" ")[1];

    if (!token.trim()) {
        return res.status(401).json({ message: "Invalid or missing token." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("Decoded token:", decoded);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token." });
    }
};

exports.isPharmatic = async (req, res, next) => {
  try {
    const  pharmaticId  = req.params.id;
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





exports.authMiddlewareforPharmatic = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });
  try {
    const decoded = jwt.verify(token,  process.env.JWT_SECRET);
    req.user = await Pharmatic.findById(decoded.id);
    if (!req.user) return res.status(404).json({ message: "User not found" });

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token"  , error:error});
  }
};

exports.authMiddlewareforAnalyst = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });
console.log(token)
  try {
    const decoded = jwt.verify(token,  process.env.JWT_SECRET);
    req.user = await Analyst.findById(decoded.id);
    if (!req.user) return res.status(404).json({ message: "User not found" });

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token"  , error:error});
  }
};
exports.authMiddlewareforRadiology = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });
console.log(token)
  try {
    const decoded = jwt.verify(token,  process.env.JWT_SECRET);
    req.user = await Radiology.findById(decoded.id);
    if (!req.user) return res.status(404).json({ message: "User not found" });

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token"  , error:error});
  }
};

exports.authMiddlewareforDoctor = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });
console.log(token)
  try {
    const decoded = jwt.verify(token,  process.env.JWT_SECRET);
    req.user = await Doctor.findById(decoded.id);
    if (!req.user) return res.status(404).json({ message: "User not found" });

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token"  , error:error});
  }
};