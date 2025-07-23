const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio", "video_call", "audio_call"],
      default: "text",
    },
    content: {
      type: String,
      required: function () {
        return this.messageType === "text"
      },
    },
    fileUrl: {
      type: String,
      required: function () {
        return ["image", "file", "audio"].includes(this.messageType)
      },
    },
    fileName: String,
    fileSize: Number,
    callDuration: {
      type: Number, // in seconds
      required: function () {
        return ["video_call", "audio_call"].includes(this.messageType)
      },
    },
    callStatus: {
      type: String,
      enum: ["initiated", "answered", "missed", "ended"],
      required: function () {
        return ["video_call", "audio_call"].includes(this.messageType)
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1, receiverId: 1 })

module.exports = mongoose.model("Message", messageSchema)
