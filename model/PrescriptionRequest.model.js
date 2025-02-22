const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "seek" },
  imageUrl: String, // رابط صورة الروشتة
  city: String,
  region: String,
  pharmacistsResponded: [
    {
      pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: "pharmatic" },
      price: Number,
      accepted: Boolean,
    },
  ],
});

module.exports = mongoose.model("PrescriptionRequest", requestSchema);
