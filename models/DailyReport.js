const mongoose = require("mongoose")

const dailyReportSchema = new mongoose.Schema(
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
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    attendance: {
      status: {
        type: String,
        enum: ["present", "absent", "late", "early_pickup"],
        default: "present",
      },
      checkInTime: Date,
      checkOutTime: Date,
    },
    meals: [
      {
        type: {
          type: String,
          enum: ["breakfast", "lunch", "snack", "dinner"],
        },
        items: [String],
        amountEaten: {
          type: String,
          enum: ["all", "most", "some", "little", "none"],
        },
        time: Date,
        notes: String,
      },
    ],
    sleepSessions: [
      {
        startTime: Date,
        endTime: Date,
        duration: Number, // in minutes
        quality: {
          type: String,
          enum: ["good", "restless", "poor"],
        },
        notes: String,
      },
    ],
    diaperChanges: [
      {
        time: Date,
        type: {
          type: String,
          enum: ["wet", "soiled", "dry"],
        },
        notes: String,
      },
    ],
    activities: [
      {
        name: String,
        time: Date,
        duration: Number,
        participation: {
          type: String,
          enum: ["active", "moderate", "passive", "reluctant"],
        },
        notes: String,
      },
    ],
    moodTracking: [
      {
        time: Date,
        mood: {
          type: String,
          enum: ["happy", "sad", "excited", "calm", "fussy", "sleepy", "energetic"],
        },
        notes: String,
      },
    ],
    overallMood: {
      type: String,
      enum: ["very_happy", "happy", "neutral", "fussy", "difficult"],
      default: "happy",
    },
    teacherNotes: String,
    photos: [
      {
        url: String,
        caption: String,
        timestamp: Date,
      },
    ],
    milestones: [
      {
        description: String,
        category: {
          type: String,
          enum: ["physical", "cognitive", "social", "emotional", "language"],
        },
        timestamp: Date,
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    parentViewed: {
      type: Boolean,
      default: false,
    },
    parentViewedAt: Date,
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
dailyReportSchema.index({ childId: 1, date: -1 })
dailyReportSchema.index({ parentId: 1, date: -1 })
dailyReportSchema.index({ roomId: 1, date: -1 })

module.exports = mongoose.model("DailyReport", dailyReportSchema)
