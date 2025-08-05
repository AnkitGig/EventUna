const express = require("express")
const router = express.Router()
const authRoutes = require("./authRoutes")
const eventRoutes = require("./eventRoutes")
const merchantRoutes = require("./merchantRoutes")
const adminRoutes = require("./adminRoutes")
const noticationRoutes = require("./notificationRoutes")
const chatRoutes = require("./chatRoutes") // Import new chat routes

router.use("/auth", authRoutes)
router.use("/event", eventRoutes)
router.use("/merchant", merchantRoutes)
router.use("/admin", adminRoutes)
router.use("/notifications", noticationRoutes)
router.use("/chat", chatRoutes) // Use new chat routes

module.exports = router
