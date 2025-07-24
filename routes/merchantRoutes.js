const express = require("express")
const router = express.Router()
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
router.put(
  "/update-location",
  protect,
  uploadLocationMedia.array("locationPhotoVideoList", 10),
  merchant.updateServiceLocation,
)
router.get("/location", protect, merchant.getServiceLocation)
router.get("/locations", protect, merchant.getAllServiceLocations)


// Coupon CRUD routes
router.post("/add-coupon", protect, merchant.addCoupon)
router.get("/coupons", protect, merchant.getCouponList)
router.get("/coupon", protect, merchant.getCouponById) // expects ?couponId=...
router.put("/coupon", protect, merchant.updateCoupon)   // expects ?couponId=... in query
router.delete("/coupon", protect, merchant.deleteCoupon) // expects ?couponId=... in query

router.get("/profile", protect, merchant.getMerchantProfile)

module.exports = router
