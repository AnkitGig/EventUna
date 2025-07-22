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
<<<<<<< HEAD
router.post("/coupon", protect, merchant.addCoupon)
router.get("/coupon", protect, merchant.allCoupans)
// router.get("/coupons", protect, merchant.allCoupans)
=======
>>>>>>> bcbbe10b557abde7a489487f6a9ab6cd36dfc272

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
  "/update-location/:locationId",
  protect,
  uploadLocationMedia.array("locationPhotoVideoList", 10),
  merchant.updateServiceLocation,
)
router.get("/location/:locationId", protect, merchant.getServiceLocation)

router.post("/add-coupon", protect, merchant.addCoupon)
router.get("/coupons", protect, merchant.getCouponList)
router.get("/profile", protect, merchant.getMerchantProfile)

module.exports = router
