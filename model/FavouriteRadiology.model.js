const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'seek', required: true },
  radiologyId: { type: mongoose.Schema.Types.ObjectId, ref: 'radiology', required: true },
  isFavourite: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FavouriteRadiology', favouriteSchema);
