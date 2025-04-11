const mongoose = require('mongoose');

const requestRadiologySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seek' },
  imageUrl: String,
  city: String,
  region: String,
  date: {
    type: Date,
    default: Date.now(),
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
  },
  radiologysResponded: [
    {
      radiologyId: { type: mongoose.Schema.Types.ObjectId, ref: 'radiology' },
      price: Number,
      accepted: Boolean,
    },
  ],
});

module.exports = mongoose.model(
  'requestRadiologySchema',
  requestRadiologySchema
);
