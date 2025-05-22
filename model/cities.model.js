const mongoose = require("mongoose");

const RegionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
});

const CitySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  regions: [RegionSchema], 
});

module.exports = mongoose.model("City", CitySchema);
