const mongoose = require("mongoose")

const applicationSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    childName: {
      type: String,
      required: true,
    },
    childAge: {
      type: Number,
      required: true,
    },
    parentName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    emailAddress: {
      type: String,
      required: true,
    },
    emergencyContact: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    notes: String,
    documents: [
      {
        filename: String,
        originalName: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "waitlisted"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: String,
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Application", applicationSchema)
