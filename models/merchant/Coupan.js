const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  couponName: String,
  discount: Number,
  validFrom: Date,
  validTo: Date,
  description: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchant",
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Coupan", CouponSchema);
