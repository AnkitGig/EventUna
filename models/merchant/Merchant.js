const mongoose = require("mongoose")

const merchantSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    mobile: { type: String, unique: true },
    password: String,
    otp: String,
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: "merchant" },
    isActive: { type: Boolean, default: true },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Services",
      required: true,
    },
    register_id: { type: String, default: null },
    ios_register_id: { type: String, default: null },

    // Profile Information
    serviceSubcategoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subervices",
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
    serviceRestaurantCategoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RestaurantCategory",
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
