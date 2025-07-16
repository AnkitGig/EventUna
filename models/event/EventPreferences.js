const mongoose = require("mongoose");

const placePreferencesSchema = new mongoose.Schema(
  {
    preferences: {
      type: String,
      required: true,
      unique: true,   // 👈 This will make the serviceName unique
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlacePreferenses", placePreferencesSchema);
