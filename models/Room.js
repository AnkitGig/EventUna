const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    primaryTeacher: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: String,
      profileImage: String,
    },
    assistantTeachers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        profileImage: String,
      },
    ],
    ageGroup: {
      minAge: Number,
      maxAge: Number,
      description: String, // "Toddlers", "Preschool", etc.
    },
    capacity: {
      type: Number,
      default: 20,
    },
    currentEnrollment: {
      type: Number,
      default: 0,
    },
    dailySchedule: [
      {
        time: String, // "08:00 AM"
        activity: String, // "Breakfast", "Play time", etc.
        description: String,
        duration: Number, // in minutes
      },
    ],
    facilities: [String], // ["Play area", "Reading corner", etc.]
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Room", roomSchema)
