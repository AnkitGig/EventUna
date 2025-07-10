const express = require('express');
const router = express.Router();
const merchant = require("../controllers/merchantController");

router.post("/signup", merchant.signup)
router.post("/verify-otp", merchant.verifyOtp)
router.post("/login", merchant.login)


module.exports = router;