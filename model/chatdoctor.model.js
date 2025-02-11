const mongoose = require("mongoose");

const messageDoctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    message: { type: String, required: true },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null }, // Reply to a message
  },
  { timestamps: true }
);

module.exports = mongoose.model("MessageDoctor", messageDoctorSchema);
