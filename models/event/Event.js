const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventTitle: {
      type: String,
      required: true,
    },

    invitationMessage: {
      type: String,
    },

    eventType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventType",
      required: true,
    },

    eventCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventCategory",
      required: true,
    },

    eventDates: [
      {
        type: Date,
      },
    ],

    timeDuration: {
      startTime: { type: String }, // e.g. "10:00 AM"
      endTime: { type: String },   // e.g. "2:00 PM"
    },

    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
