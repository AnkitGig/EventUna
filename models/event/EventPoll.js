const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    options: [
      {
        optionText: {
          type: String,
          required: true,
        },
        voteCount: {
          type: Number,
          default: 0,
          
        },
      },
    ],

    activeTill: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", pollSchema);
