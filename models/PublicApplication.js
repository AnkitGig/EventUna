const mongoose = require("mongoose")

const publicApplicationSchema = new mongoose.Schema(
  {
    // School Information
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    // Child Information
    childName: {
      type: String,
      required: true,
      trim: true,
    },
    childAge: {
      type: Number,
      required: true,
      min: 1,
      max: 18,
    },

    // Parent Information
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    emailAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Emergency Contact
    emergencyContact: {
      type: String,
      required: true,
      trim: true,
    },

    // Address
    address: {
      type: String,
      required: true,
      trim: true,
    },

    // Additional Notes
    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // Application Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "account_created"],
      default: "pending",
    },

    // Admin Processing
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewNotes: String,

    // Account Creation
    parentAccountCreated: {
      type: Boolean,
      default: false,
    },
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    accountCreatedAt: Date,

    // Source tracking
    sourceIP: String,
    userAgent: String,
    referrer: String,

    // Submission timestamp
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better performance
publicApplicationSchema.index({ emailAddress: 1 })
publicApplicationSchema.index({ schoolId: 1, status: 1 })
publicApplicationSchema.index({ status: 1, submittedAt: -1 })
publicApplicationSchema.index({ parentAccountCreated: 1 })

module.exports = mongoose.model("PublicApplication", publicApplicationSchema)
