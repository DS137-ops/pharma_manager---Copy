const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'seek', required: true },
  specId: { type: mongoose.Schema.Types.ObjectId, ref: 'radiology', required: true },
  isFavourite: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FavouriteRadiology', favouriteSchema);
