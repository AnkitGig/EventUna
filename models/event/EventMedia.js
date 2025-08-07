const mongoose = require("mongoose")

const eventMediaSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
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
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

// Index for better query performance
eventMediaSchema.index({ eventId: 1, createdAt: -1 })
eventMediaSchema.index({ uploadedBy: 1 })

module.exports = mongoose.model("EventMedia", eventMediaSchema)
