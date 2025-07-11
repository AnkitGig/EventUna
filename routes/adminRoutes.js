const express = require('express');
const router = express.Router();
const admin = require("../controllers/adminController");
const {protect, isAdmin} = require("../middleware/authMiddleware");

// Route to add services
router.post('/add-services', protect, isAdmin, admin.addServices);




module.exports = router;