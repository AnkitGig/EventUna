const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const eventRoutes = require("./eventRoutes");
const merchantRoutes = require("./merchantRoutes");
const adminRoutes = require("./adminRoutes");
const noticationRoutes = require("./notificationRoutes");
const chatRoutes = require("./chatRoutes");
const eventMediaRoutes = require("./eventMediaRoutes"); // Import new event media routes

router.use("/auth", authRoutes);
router.use("/event", eventRoutes);
router.use("/merchant", merchantRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", noticationRoutes);
router.use("/chat", chatRoutes);
router.use("/event-media", eventMediaRoutes); // Use new event media routes

module.exports = router;
