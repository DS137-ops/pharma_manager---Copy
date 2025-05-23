const mongoose = require("mongoose");

const aboutUsSchema = new mongoose.Schema({
  content: {
    en: {
      type: String,
      required: true,
      trim: true
    },
    ar: {
      type: String,
      required: true,
      trim: true
    }
  },
}, { timestamps: true });

module.exports = mongoose.model("AboutUs", aboutUsSchema);
