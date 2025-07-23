const mongoose = require("mongoose");

const pollResponseSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure one vote per poll per user
pollResponseSchema.index({ pollId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("PollVote", pollResponseSchema);
