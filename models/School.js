const mongoose = require("mongoose")

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    contactInfo: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: String,
    },
    images: [
      {
        url: String,
        caption: String,
      },
    ],
    facilities: [String],
    ageGroups: [
      {
        name: String,
        minAge: Number,
        maxAge: Number,
      },
    ],
    fees: {
      admissionFee: Number,
      monthlyFee: Number,
      annualFee: Number,
    },
    timings: {
      openTime: String,
      closeTime: String,
      workingDays: [String],
    },
    rating: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Create geospatial index
schoolSchema.index({ location: "2dsphere" })

module.exports = mongoose.model("School", schoolSchema)
