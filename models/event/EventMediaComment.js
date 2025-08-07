const mongoose = require("mongoose")

const eventMediaCommentSchema = new mongoose.Schema(
  {
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventMedia",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    // For nested replies (optional - can be implemented later)
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventMediaComment",
      default: null,
    },
  },
  { timestamps: true },
)

// Index for better query performance
eventMediaCommentSchema.index({ mediaId: 1, createdAt: -1 })
eventMediaCommentSchema.index({ userId: 1 })

module.exports = mongoose.model("EventMediaComment", eventMediaCommentSchema)
