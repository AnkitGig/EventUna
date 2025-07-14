const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { upload } = require("../middleware/multer");
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.post('/signup', auth.signup);
router.post('/verify-otp', auth.verifyOtp);
router.post('/login', auth.login);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.post('/resend-otp', auth.resendOtp);
router.put('/update-profile', protect, upload.single('profilePic'), auth.updateProfile);
router.get('/privacy-policy', protect,auth.privacyPolicy);
router.get('/user-profile', protect, auth.getUserProfile);
router.post('/add-address', protect, auth.addAddress);
router.get('/address', protect, auth.getAddress);
router.get("/all-users", protect, auth.allUsers)
router.delete('/delete-user', protect, auth.deleteUser);

// Example protected route
router.get('/admin-only', protect, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

module.exports = router;
