const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    mobile: { type: String, unique: true },
    password: String,
    otp: String,
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: "merchant" },
    isActive: { type: Boolean, default: true },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Services",
      required: true,
    },
    register_id: { type: String, default: null },
    ios_register_id: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Merchant", merchantSchema);
