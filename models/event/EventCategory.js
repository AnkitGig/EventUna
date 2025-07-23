const mongoose = require("mongoose");

const eventCategory = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    eventType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventType",
      required: true,
    },
  },
  { timestamps: true }
);

// Optional: prevent duplicate category names per event type
eventCategory.index({ category: 1, eventType: 1 }, { unique: true });

module.exports = mongoose.model("EventCategory", eventCategory);

// const eventSchema = new mongoose.Schema(
//   {
//     eventType: {
//       type: String,
//       required: true,
//     },

//     category: {
//       type: [String],
//       default: [],
//     },

//     eventDate: {
//       type: Date,
//       required: true,
//     },

//     eventTime: {
//       startTime: {
//         type: Date,
//         required: true,
//       },
//       endTime: {
//         type: Date,
//         required: true,
//       },
//     },

//     eventTitle: {
//       type: String,
//       required: true,
//     },

//     eventMessage: {
//       type: String,
//       required: true,
//     },

//     locationType: {
//       type: String,
//       enum: ["private", "custom"],
//       required: true,
//     },

//     // Step 6: Location Details
//     selectedPlaceId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Place",
//     },

//     customAddress: {
//       type: String,
//     },

//     latitude: {
//       type: Number,
//     },

//     longitude: {
//       type: Number,
//     },

//     facilityId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Facility",
//       required: true,
//     },

//     slotId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Slot",
//       required: true,
//     },

//     reservationType: {
//       type: String,
//       enum: ["one-time", "recurring"],
//       required: true,
//     },

//     isRecurring: {
//       type: Boolean,
//       default: false,
//     },

//     repeatDays: {
//       type: [String], // e.g. ['Monday', 'Wednesday']
//       default: [],
//     },

//     repeatUntil: {
//       type: Date,
//     },

//     reservationPurpose: {
//       type: String,
//       required: true,
//     },

//     numberOfAttendees: {
//       type: Number,
//       required: true,
//     },

//     attendeeType: {
//       type: String,
//       enum: ["Students", "Faculty", "External"],
//       required: true,
//     },

//     customNote: {
//       type: String,
//     },

//     // Step 11: Resource Selection
//     requestedResources: {
//       type: [String], // e.g. ['Mic', 'Projector']
//       default: [],
//     },

//     // Step 12: Facility Instructions
//     facilityInstructions: {
//       type: String,
//     },

//     // Step 13: Agreements
//     disclaimerAccepted: {
//       type: Boolean,
//       required: true,
//       validate: {
//         validator: (v) => v === true,
//         message: "Disclaimer must be accepted",
//       },
//     },

//     termsAccepted: {
//       type: Boolean,
//       required: true,
//       validate: {
//         validator: (v) => v === true,
//         message: "Terms must be accepted",
//       },
//     },

//     // Meta
//     organizerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     status: {
//       type: String,
//       enum: ["draft", "submitted", "approved", "rejected"],
//       default: "draft",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Event", eventSchema);
