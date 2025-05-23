const mongoose = require("mongoose");

// Subdocument Schema for Region
const RegionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: {
    en: { type: String, required: true, trim: true },
    ar: { type: String, required: true, trim: true },
  },
}, { _id: false }); // لأننا نضبط _id يدويًا

// Main Schema for City
const CitySchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true, trim: true },
    ar: { type: String, required: true, trim: true },
  },
  regions: [RegionSchema],
}, { timestamps: true });

module.exports = mongoose.model("City", CitySchema);
