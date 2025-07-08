// // models/eventType.model.js
// const mongoose = require('mongoose');

// const eventTypeSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     unique: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('EventType', eventTypeSchema);


// // models/category.model.js
// const categorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   eventTypeId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'EventType',
//     required: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Category', categorySchema);


// // models/place.model.js
// const placeSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   address: String,
//   latitude: Number,
//   longitude: Number
// }, { timestamps: true });

// module.exports = mongoose.model('Place', placeSchema);


// // models/facility.model.js
// const facilitySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   description: String
// }, { timestamps: true });

// module.exports = mongoose.model('Facility', facilitySchema);


// // models/slot.model.js
// const slotSchema = new mongoose.Schema({
//   facilityId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Facility',
//     required: true
//   },
//   startTime: {
//     type: Date,
//     required: true
//   },
//   endTime: {
//     type: Date,
//     required: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Slot', slotSchema);


// // models/user.model.js
// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   mobile: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     required: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('User', userSchema);
