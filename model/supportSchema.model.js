const mongoose = require("mongoose");

const SupportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  userType: { type: String, enum: ["sick", "pharmatic", "doctor" ,"analyst" , "radiology" ], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  ticketNumber: { type: String, unique: true, required: true },
  status: { type: String, enum: ["open", "pending", "closed"], default: "open" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SupportTicket", SupportTicketSchema);
