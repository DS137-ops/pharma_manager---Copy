const User = require('../model/auth.model');
const Doctor = require('../model/doctor.model');
const Blacklist = require('../model/Blacklist.model');
const RefreshToken = require('../model/RefreshToken.model');
const Seek = require('../model/seek.model');
//if the spec is approved  Common for all specs
exports.isProvved = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(email);
    if (!email) {
      return res
        .status(401)
        .json({ success: false, message: 'Email is required' });
    }
    const userlog = await User.find({ email });
    if (!userlog) {
      return res
        .status(404)
        .json({ success: false, message: 'Email is inCorrect' });
    }
    if (!userlog[0].approved) {
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
//if the spec is logged in ==> next()   Common for all specs
exports.checkifLoggedIn = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  console.log(token);

  const refreshtoken = await RefreshToken.findOne({ token });
  console.log(refreshtoken);
  if (!refreshtoken) {
    return res.status(401).json({ message: ' You are Logged Out' });
  }
  next();
};

exports.isPharmatic = async(req,res,next)=>{
  try{
    const {pharmaticId} = req.params
    if(!pharmaticId){
     return res
      .status(404)
      .json({success:false , message:'No access available'})
    }
    const isphar = await User.find({pharmaticId})
    if(!isphar){
     return res
      .status(404)
      .json({success:false , message:'Allow for pharmatics'})
    }
    next()
  }catch(error){
    res
      .status(500)
      .json({ success: false, message: 'Internal server error', error });
  }
  }

  exports.isDoctor = async(req,res,next)=>{
    try{
      const {DoctorId} = req.params
      if(!DoctorId){
       return res
        .status(404)
        .json({success:false , message:'No access available'})
      }
      const isDoctor = await Doctor.find({DoctorId})
      if(!isDoctor){
       return res
        .status(404)
        .json({success:false , message:'Allow for Doctors'})
      }
      next()
    }catch(error){
      res
        .status(500)
        .json({ success: false, message: 'Internal server error', error });
    }
    }