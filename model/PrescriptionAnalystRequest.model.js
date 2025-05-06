const mongoose = require('mongoose');

const requestAnalystSchema = new mongoose.Schema({
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
  analystsResponded: [
    {
      analystId: { type: mongoose.Schema.Types.ObjectId, ref: 'analyst' },
      price: Number,
      accepted: Boolean,
    },
  ],
});

module.exports = mongoose.model('PrescriptionAnalystRequest', requestAnalystSchema);
