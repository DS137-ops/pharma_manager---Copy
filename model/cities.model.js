const mongoose = require("mongoose");

// Subdocument Schema for Region
const RegionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: {
    type: String, required: true, trim: true
  },
}, { _id: false });


const CitySchema = new mongoose.Schema({
  name: {
   type: String, required: true, trim: true
  },
  regions: [RegionSchema],
}, { timestamps: true });

module.exports = mongoose.model("City", CitySchema);
