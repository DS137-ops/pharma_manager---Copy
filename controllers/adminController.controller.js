const Admin = require("../model/adminModel.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.createAdmin = async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) return res.status(403).json({ message: "Admin already exists" });

    const { username, password } = req.body;
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    
    res.status(200).json({ message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id }, '1001110');
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${error}` });
  }
};

