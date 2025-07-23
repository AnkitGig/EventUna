const mongoose = require("mongoose")

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["parent", "teacher"],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastSeen: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    conversationType: {
      type: String,
      enum: ["individual", "group"],
      default: "individual",
    },
    title: String, // For group conversations
    lastMessage: {
      content: String,
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: Date,
      messageType: {
        type: String,
        enum: ["text", "image", "file", "audio", "video_call", "audio_call"],
        default: "text",
      },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
conversationSchema.index({ "participants.userId": 1 })
conversationSchema.index({ schoolId: 1 })
conversationSchema.index({ applicationId: 1 })

module.exports = mongoose.model("Conversation", conversationSchema)
