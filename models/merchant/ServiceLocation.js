const mongoose = require("mongoose")

const serviceLocationSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    addressName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    long: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
    },
    floorPlan: {
      type: String, // URL or file path
    },
    locationPhone: {
      type: String,
    },
    openTwoShifts: {
      type: Boolean,
      default: false,
    },
    weeklySchedule: [
      {
        day: {
          type: String,
          enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          required: true,
        },
        morning: {
          from: String,
          to: String,
        },
        evening: {
          from: String,
          to: String,
        },
      },
    ],
   locationPhotoVideoList: [
  {
    file: { type: String }, // file path
    mediaType: { type: String, enum: ["photo", "video"] },
    description: String,
  },
],
  },
  { timestamps: true },
)

module.exports = mongoose.model("ServiceLocation", serviceLocationSchema)
