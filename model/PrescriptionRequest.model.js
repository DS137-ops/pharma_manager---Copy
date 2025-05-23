const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seek' },
  imageUrl: String,
    city: {
    en: {
      type: String,
    },
    ar: {
      type: String,
    },
  },
  region: {
    en: {
      type: String,
    },
    ar: {
      type: String,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread',
  },
  pharmacistsResponded: [
    {
      pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'pharmatic' },
      price: Number,
      accepted: Boolean,
    },
  ],
});

module.exports = mongoose.model('PrescriptionRequest', requestSchema);
