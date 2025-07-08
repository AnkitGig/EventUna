const mongoose = require("mongoose");
const preferences = require("../../utils/placePreference")

const placePreferenceSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    option: {
      type: String,
      required: true,
      enum: Object.values(preferences),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlacePreference", placePreferenceSchema);
