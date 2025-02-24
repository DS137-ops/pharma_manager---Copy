const mongoose = require("mongoose");

const requestAnalystSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Seek" },
  imageUrl: String, // رابط صورة الروشتة
  city: String,
  region: String,
  analystsResponded: [
    {
      analystId: { type: mongoose.Schema.Types.ObjectId, ref: "analyst" },
      price: Number,
      accepted: Boolean,
    },
  ],
});

module.exports = mongoose.model("requestAnalystSchema", requestAnalystSchema);
