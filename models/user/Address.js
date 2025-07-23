const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  addressName: String,
  address1: String,
  address2: String,
  postcode: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
