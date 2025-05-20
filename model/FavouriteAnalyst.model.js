const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seek', required: true },
  specId: { type: mongoose.Schema.Types.ObjectId, ref: 'analyst', required: true },
  isFavourite: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FavouriteAnalyst', favouriteSchema);
