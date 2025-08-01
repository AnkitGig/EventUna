const express = require("express")
const router = express.Router()
const merchantController = require("../controllers/merchantController")
const merchant = require("../controllers/merchantController")
const { protect } = require("../middleware/authMiddleware")
const { uploadMerchantProfile, uploadLocationMedia } = require("../middleware/merchantMulter")

// Existing routes
router.post("/signup", merchant.signup)
router.post("/verify-otp", merchant.verifyOtp)
router.post("/resend-otp", merchant.resendOtp)
router.post("/login", merchant.login)
router.get("/services", merchant.services)
router.get("/sub-services", merchant.subServices)
router.get("/restaurant-categories", merchant.getRestaurantCategories)

// New profile and location management routes
router.get("/profile", protect, merchant.getMerchantProfile)
router.put(
  "/update-profile",
  protect,
  uploadMerchantProfile.fields([
    { name: "businessRegistrationImage", maxCount: 1 },
    { name: "vatRegistrationImage", maxCount: 1 },
    { name: "otherImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  merchant.updateServiceProfile,
)

router.post("/add-location", protect, merchant.addServiceLocation)
router.post("/update-location", protect, merchant.updateServiceLocation)
router.get("/location", protect, merchant.getServiceLocation)
router.get("/locations", protect, merchant.getAllServiceLocations)

// Coupon CRUD routes

// Coupon CRUD routes

// Coupon CRUD routes
router.post("/add-coupon", protect, merchant.addCoupon)
router.post("/update-coupon", protect, merchant.updateCoupon)
router.post("/delete-coupon", protect, merchant.deleteCoupon)
router.get("/all-coupons", protect, merchant.getAllCoupons)
router.get("/coupon", protect, merchant.getCouponById)
// Add more images/videos to a service location by locationId
router.post(
  "/add-location-media",
  protect,
  uploadLocationMedia.fields([
    { name: "media", maxCount: 10 }, // Main media files
    { name: "thumbnails", maxCount: 10 }, // Optional thumbnail files
    { name: "attachment", maxCount: 10 },
  ]),
  merchant.addLocationMedia,
)

// Update a specific media item by its id in a service location
router.put("/update-location-media", protect, uploadLocationMedia.single("media"), merchant.updateLocationMediaById)

// Delete a specific media item by its id in a service location
router.delete("/delete-location-media", protect, merchant.deleteLocationMediaById)
router.get("/restaurants/nearby", merchantController.getNearbyRestaurantMerchants)
module.exports = router
