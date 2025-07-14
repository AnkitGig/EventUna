const express = require('express');
const router = express.Router();
const merchant = require("../controllers/merchantController");
const {protect} = require("../middleware/authMiddleware");

router.post("/signup", merchant.signup)
router.post("/verify-otp", merchant.verifyOtp)
router.post("/login", merchant.login)
router.get("/services", protect, merchant.services)




module.exports = router;