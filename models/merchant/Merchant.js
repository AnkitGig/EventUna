const mongoose = require("mongoose")

const merchantSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    mobile: { type: String, unique: true },
    password: String,
    otp: String,
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: "merchant" },
    isActive: { type: Boolean, default: false }, // Overall active status
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Services",
      required: true,
    },
    register_id: { type: String, default: null },
    ios_register_id: { type: String, default: null },

    // Fields for initial application status and history
    applicationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    // Comprehensive history of all status changes
    applicationHistory: [
      {
        status: { type: String, required: true }, // e.g., "Join App Request", "Approved", "Deactivate request", "Deactivated", "Reactivation request", "Activated"
        date: { type: Date, default: Date.now },
        description: { type: String },
      },
    ],

    // Fields for deactivation/reactivation requests
    deactivationRequest: {
      status: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
      reason: { type: String, default: null },
      requestedAt: { type: Date, default: null },
      handledAt: { type: Date, default: null },
    },
    reactivationRequest: {
      status: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
      reason: { type: String, default: null },
      requestedAt: { type: Date, default: null },
      handledAt: { type: Date, default: null },
    },

    // Profile Information
    serviceSubcategoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subservices",
      },
    ],
    serviceName: String,
    serviceDescription: String,
    webUrl: String,
    cuisineName: String,
    menuUrl: String,
    phone: String,
    onlineReservation: { type: Boolean, default: false },

    // Images
    businessRegistrationImage: String,
    vatRegistrationImage: String,
    otherImage: String,
    bannerImage: String,

    // Business Details
    commercialPermitNumber: String,
    vatNumber: String,
    serviceSlogan: String,

    // References
    serviceLocationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceLocation",
      },
    ],
    couponIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
    ],
  },
  { timestamps: true },
)

module.exports = mongoose.model("Merchant", merchantSchema)
