const mongoose = require("mongoose")

const groupChatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true, // One chat group per event
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // You can add more fields here like chat name, messages, etc.
    // For this request, we'll keep it simple.
  },
  { timestamps: true },
)

module.exports = mongoose.model("GroupChat", groupChatSchema)
