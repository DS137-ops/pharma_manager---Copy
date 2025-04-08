const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seek', required: true },
  pharmaId: { type: mongoose.Schema.Types.ObjectId, ref: 'pharmatic', required: true },
  isFavourite: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FavouritePharma', favouriteSchema);
