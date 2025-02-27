const mongoose = require('mongoose');

const advertSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String},
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('seekAdvert', advertSchema);
