const mongoose = require("mongoose");

const specialtySchema = new mongoose.Schema({
  specId: {
    type: Number,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  
});

module.exports = mongoose.model("Specialty", specialtySchema);
