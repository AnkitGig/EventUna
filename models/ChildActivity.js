const mongoose = require("mongoose")

const childActivitySchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent.children",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    activityType: {
      type: String,
      enum: ["diaper", "sleep", "meal", "activity", "mood", "attendance", "check_in", "check_out"],
      required: true,
    },
    // Diaper tracking
    diaperDetails: {
      type: {
        type: String,
        enum: ["wet", "soiled", "dry"],
      },
      notes: String,
    },
    // Sleep tracking
    sleepDetails: {
      startTime: Date,
      endTime: Date,
      duration: Number, // in minutes
      quality: {
        type: String,
        enum: ["good", "restless", "poor"],
      },
      notes: String,
    },
    // Meal tracking
    mealDetails: {
      mealType: {
        type: String,
        enum: ["breakfast", "lunch", "snack", "dinner"],
      },
      items: [String],
      amountEaten: {
        type: String,
        enum: ["all", "most", "some", "little", "none"],
      },
      notes: String,
    },
    // Activity tracking
    activityDetails: {
      activityName: String,
      description: String,
      duration: Number, // in minutes
      participation: {
        type: String,
        enum: ["active", "moderate", "passive", "reluctant"],
      },
      notes: String,
    },
    // Mood tracking
    moodDetails: {
      mood: {
        type: String,
        enum: ["happy", "sad", "excited", "calm", "fussy", "sleepy", "energetic"],
      },
      notes: String,
    },
    // Attendance
    attendanceDetails: {
      status: {
        type: String,
        enum: ["present", "absent", "late", "early_pickup"],
      },
      checkInTime: Date,
      checkOutTime: Date,
      notes: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    photos: [String], // URLs to photos
    isNotificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
childActivitySchema.index({ childId: 1, timestamp: -1 })
childActivitySchema.index({ parentId: 1, activityType: 1 })
childActivitySchema.index({ roomId: 1, timestamp: -1 })

module.exports = mongoose.model("ChildActivity", childActivitySchema)
