const Admin = require("../model/adminModel.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const RefreshToken = require('../model/RefreshToken.model');

exports.createAdmin = async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) return res.status(403).json({ message: "Admin already exists" });

    const { username, password } = req.body;
    const newAdmin = new Admin({ username, password });
     const token = await jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
    await newAdmin.save();
        await RefreshToken.create({ token, userRef: newAdmin._id });
    
    res.status(200).json({ message: "Admin created successfully" , token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if(!admin)return res.status(404).json({message:'no admin'})
    await RefreshToken.deleteMany({ userRef: admin._id });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

  const token = jwt.sign({ id: admin._id, role: 'admin' }, '1001110');

    await RefreshToken.create({ token, userRef: admin._id });    
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${error}` });
  }
};



