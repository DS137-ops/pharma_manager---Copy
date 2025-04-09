const Seek = require('../model/seek.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();
//if the user is seek
exports.authenticateSeek = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract Bearer Token
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, '1001110');
    console.log('decoded', decoded);
    req.user = await Seek.findById(decoded.id);

    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Invalid token. User not found.' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: `Invalid token. ${error}` });
  }
};


exports.authMiddlewareforSeek = async (req, res, next) => {
  try {
    // 1️⃣ Extract token from Authorization header
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    console.log("Token received:", token); // Debugging log

    // 2️⃣ Verify JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    // 3️⃣ Fetch user from the database
    const user = await Seek.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // Attach user to request
    next(); // Proceed to next middleware

  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
};
