const mongoose = require("mongoose");


const placePreferenceSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true, // One preference per event
    },

    option: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacePreferences",
      required: true
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
