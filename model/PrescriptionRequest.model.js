const mongoose = require('mongoose');
const prescriptionRequestSchema = new mongoose.Schema({
  Seekid: { type: mongoose.Schema.Types.ObjectId, ref: 'Seek', required: true },
  city: { type: String, required: true },
  region: { type: String, required: true },
  imageUrl: { type: String, required: true }, // رابط صورة الروشتة
  responses: [
    {
      pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'pharmatic' },
      price: { type: Number },
      status: {
        type: String,
        enum: ['pending', 'accepted'],
        default: 'pending',
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  'PrescriptionRequest',
  prescriptionRequestSchema
);
