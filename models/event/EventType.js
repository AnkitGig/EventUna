const mongoose = require("mongoose");

const eventType = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventType", eventType);
