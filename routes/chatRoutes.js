const express = require("express")
const router = express.Router()
const chatController = require("../controllers/chatController")
const { protect } = require("../middleware/authMiddleware")

router.get("/event-group-chat", protect, chatController.getEventGroupChat)
router.post("/send-message", protect, chatController.sendMessage) // New route for sending messages
router.get("/messages", protect, chatController.getMessages) // New route for getting messages

module.exports = router
