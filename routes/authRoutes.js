const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.post('/signup', auth.signup);
router.post('/verify-otp', auth.verifyOtp);
router.post('/login', auth.login);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.post('/resend-otp', auth.resendOtp);

// Example protected route
router.get('/admin-only', protect, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

module.exports = router;
