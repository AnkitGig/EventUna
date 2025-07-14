const express = require('express');
const router = express.Router();
const admin = require("../controllers/adminController");
const merchant = require("../controllers/merchantController")
const {protect, isAdmin} = require("../middleware/authMiddleware");

// Route to add services
router.post('/add-services', protect, isAdmin, admin.addServices);
router.patch("/update-status", protect, isAdmin, admin.merchantAccountStatus)
router.get("/all-merchants", protect, isAdmin, admin.getAllMerchants);
// router.




module.exports = router;