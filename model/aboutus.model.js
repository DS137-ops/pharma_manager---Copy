const mongoose = require("mongoose");

const aboutUsSchema = new mongoose.Schema({
  content: {
    type: String,
      required: true,
      trim: true
  },
}, { timestamps: true });

module.exports = mongoose.model("AboutUs", aboutUsSchema);
