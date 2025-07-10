const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({

  email: { type: String, unique: true },
  mobile: { type: String, unique: true },
  password: String,
  otp: String,
  isVerified: { type: Boolean, default: false },
  role: { type: String, default: 'merchant' },
  isActive: { type: Boolean, default: true},
  register_id: { type: String, default: null },
  ios_register_id: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Merchant', merchantSchema);
