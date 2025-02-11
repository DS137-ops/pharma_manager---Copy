const User = require('../model/auth.model');
const Blacklist = require('../model/Blacklist.model');
const jwt = require('jsonwebtoken');
exports.isProvved = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(email)
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
      return res
        .status(403)
        .json({
          success: false,
          message:
            'Your account is not approved yet. Please wait for admin approval.',
        });
    }
    next();
  } catch (error) {
    console.error('Error in isProvved middleware:', error);
    res.status(500).json({ success: false, message: 'Internal server error',error });
  }
};
exports.checkBlacklist = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(' ')[1];
  console.log(token);

  const blacklisted = await Blacklist.findOne({ token });
  if (blacklisted) {
    return res.status(401).json({ message: ' You are Logged Out' });
  }
  next();
};
