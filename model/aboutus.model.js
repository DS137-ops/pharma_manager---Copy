const mongoose = require('mongoose');

const aboutUsSchema = new mongoose.Schema(
  {
    content: {
      en: {
        type: String,
        required: true,
      },
      ar: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AboutUs', aboutUsSchema);
