const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema(
  {
    notes: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("notes", notesSchema);
