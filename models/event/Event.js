const { required } = require("joi");
const mongoose = require("mongoose");

// const eventSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     eventTitle: {
//       type: String,
//       required: true,
//     },

//     invitationMessage: {
//       type: String,
//     },

//     eventType: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "EventType",
//       required: true,
//     },

//     eventCategory: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "EventCategory",
//       required: true,
//     },

//     eventDates: [
//       {
//         type: Date,
//       },
//     ],

//     timeDuration: {
//       startTime: { type: String }, // e.g. "10:00 AM"
//       endTime: { type: String },   // e.g. "2:00 PM"
//     },

//     pollId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Poll",
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eventDate: {
      type: String,
      required: true,
    },

    eventStartDate: {
      type: String,
      required: true,
    },

    eventEndDate: {
      type: String,
      required: true,
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

    eventTitle: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacePreferenses",
      required: true,
    },

    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },

    contactList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    bringaLongGuest: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },

    bringaLongGuest: {
      type: String,
    },

    rvsp: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },

    rvspDate: {
      type: String,
    },

    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notes",
      required: true,
    },

    registryUrl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registry",
      required: true,
    },

    additionalServices: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdditionalService",
      required: true,
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
