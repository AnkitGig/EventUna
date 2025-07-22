const express = require('express');
const router = express.Router();
const merchant = require("../controllers/merchantController");
const {protect} = require("../middleware/authMiddleware");

router.post("/signup", merchant.signup)
router.post("/verify-otp", merchant.verifyOtp)
router.post("/login", merchant.login)
router.get("/services", merchant.services)
router.get("/sub-services", merchant.subServices)
router.post("/coupon", protect, merchant.addCoupon)
router.get("/coupon", protect, merchant.allCoupans)
// router.get("/coupons", protect, merchant.allCoupans)




module.exports = router;