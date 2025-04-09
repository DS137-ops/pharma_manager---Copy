const mongoose = require("mongoose");

const RegionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Unique ID for each region
  name: { type: String, required: true },
});

const CitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  regions: [RegionSchema], // List of regions with unique IDs
});

module.exports = mongoose.model("City", CitySchema);
