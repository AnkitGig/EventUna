const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const { uploadDocuments } = require("../middleware/upload")
const {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  getAvailableTeachers,
  initiateCall,
  updateCallStatus,
} = require("../controllers/messageController")

const router = express.Router()

/**
 * ===========================================
 * 💬 MESSAGING APIS - COMMUNICATION SCREENS
 * ===========================================
 * These APIs handle parent-teacher communication screens
 */

// 📱 SCREEN: Messages/Chat List Screen
// API: GET /api/messages/conversations
// Purpose: Shows list of all conversations for parent/teacher
// Features: Last message, unread count, participant info
router.get("/conversations", auth, getConversations)

// 📱 SCREEN: Chat Conversation Screen
// API: GET /api/messages/conversations/:conversationId
// Purpose: Shows all messages in a specific conversation
// Features: Text messages, photos, files, call history
router.get("/conversations/:conversationId", auth, getMessages)

// 📱 SCREEN: Send Message Screen/Interface
// API: POST /api/messages/send
// Purpose: Send text message in conversation
// Features: Text content, read receipts, timestamps
router.post("/send", auth, sendMessage)

// 📱 SCREEN: File/Photo Sharing Screen
// API: POST /api/messages/send-file
// Purpose: Send photos or documents in chat
// Features: File upload, image sharing, document sharing
router.post("/send-file", auth, uploadDocuments, async (req, res) => {
  try {
    const { conversationId, receiverId, messageType = "file" } = req.body

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const file = req.files[0]
    const { getFileUrl } = require("../middleware/upload")

    const messageData = {
      conversationId,
      receiverId,
      messageType,
      fileUrl: getFileUrl(req, file.filename, "documents"),
      fileName: file.originalname,
      fileSize: file.size,
    }

    req.body = messageData
    const messageController = require("../controllers/messageController")
    await messageController.sendMessage(req, res)
  } catch (error) {
    console.error("Send file message error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send file message",
      error: error.message,
    })
  }
})

// 📱 SCREEN: Teacher Selection Screen (Start New Chat)
// API: GET /api/messages/teachers/:applicationId
// Purpose: Shows available teachers for a school application
// Features: Teacher profiles, subjects, availability status
router.get("/teachers/:applicationId", auth, authorize("parent"), getAvailableTeachers)

// 📱 SCREEN: Start Conversation Screen
// API: POST /api/messages/start-conversation
// Purpose: Start new conversation with selected teacher
// Features: Create conversation, link to application
router.post("/start-conversation", auth, authorize("parent"), startConversation)

// 📱 SCREEN: Video/Audio Call Screen
// API: POST /api/messages/call/initiate
// Purpose: Start video or audio call with teacher
// Features: Call initiation, call types (video/audio)
router.post("/call/initiate", auth, initiateCall)

// 📱 SCREEN: Call Status/History Screen
// API: PUT /api/messages/call/:messageId/status
// Purpose: Update call status (answered, missed, ended)
// Features: Call duration tracking, call history
router.put("/call/:messageId/status", auth, updateCallStatus)

module.exports = router
