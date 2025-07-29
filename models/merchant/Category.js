const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
