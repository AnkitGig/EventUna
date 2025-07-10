const mongoose = require("mongoose");
const preferences = require("../../utils/placePreference");

const placePreferenceSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true, // One preference per event
    },

    option: {
      type: String,
      required: true,
      enum: Object.values(preferences), // e.g., "Choose from map", etc.
    },

    // For "Private location"
    address: {
      type: String,
    },

    // For "Choose from map"
    coordinates: {
      lat: Number,
      lng: Number,
      formattedAddress: String,
    },

    // For "Restaurant from list"
    selectedRestaurants: [
      {
        name: String,
        placeId: String,
        address: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlacePreference", placePreferenceSchema);
