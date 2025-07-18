const express = require('express');
const router = express.Router();
const { protect } = require("../middleware/authMiddleware")
const notication = require("../controllers/notificationController")



router.get("/user-event-notification", protect, notication.getNotifications)




module.exports = router;