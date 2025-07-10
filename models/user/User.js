const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  mobile: { type: String, unique: true },
  password: String,
  otp: String,
  dob: {type: String, default: null },
  gender: {type: String, enum: ['male', 'female'], default: null},
  profilePic: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  register_id: { type: String, default: null },
  ios_register_id: { type: String, default: null },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
