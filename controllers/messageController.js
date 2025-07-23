const Message = require("../models/Message")
const Conversation = require("../models/Conversation")
const User = require("../models/User")
const Application = require("../models/Application")
const TeacherProfile = require("../models/TeacherProfile")

// @desc    Get conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query

    const conversations = await Conversation.find({
      "participants.userId": req.user._id,
      isActive: true,
    })
      .populate("participants.userId", "firstName lastName profileImage role")
      .populate("schoolId", "name images")
      .populate("lastMessage.senderId", "firstName lastName")
      .sort({ "lastMessage.timestamp": -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    // Format conversations for frontend
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find((p) => p.userId._id.toString() !== req.user._id.toString())

      return {
        id: conv._id,
        title: conv.title || `${otherParticipant.userId.firstName} ${otherParticipant.userId.lastName}`,
        participant: {
          id: otherParticipant.userId._id,
          name: `${otherParticipant.userId.firstName} ${otherParticipant.userId.lastName}`,
          profileImage: otherParticipant.userId.profileImage,
          role: otherParticipant.userId.role,
          lastSeen: otherParticipant.lastSeen,
        },
        school: {
          id: conv.schoolId._id,
          name: conv.schoolId.name,
          image: conv.schoolId.images?.[0]?.url,
        },
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount?.get(req.user._id.toString()) || 0,
        updatedAt: conv.updatedAt,
      }
    })

    res.json({
      success: true,
      data: {
        conversations: formattedConversations,
        pagination: {
          current: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: conversations.length,
        },
      },
    })
  } catch (error) {
    console.error("Get conversations error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    })
  }
}

// @desc    Get messages in a conversation
// @route   GET /api/messages/conversations/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 50 } = req.query

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": req.user._id,
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      })
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
    })
      .populate("senderId", "firstName lastName profileImage role")
      .populate("receiverId", "firstName lastName profileImage role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    )

    // Update unread count
    conversation.unreadCount.set(req.user._id.toString(), 0)
    await conversation.save()

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          current: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: messages.length,
        },
      },
    })
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    })
  }
}

// @desc    Send a message
// @route   POST /api/messages/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, content, messageType = "text", fileUrl, fileName, fileSize } = req.body

    // Validation
    if (!conversationId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID and receiver ID are required",
      })
    }

    if (messageType === "text" && !content) {
      return res.status(400).json({
        success: false,
        message: "Content is required for text messages",
      })
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": req.user._id,
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      })
    }

    // Create message
    const message = new Message({
      conversationId,
      senderId: req.user._id,
      receiverId,
      messageType,
      content,
      fileUrl,
      fileName,
      fileSize,
    })

    await message.save()

    // Update conversation last message
    conversation.lastMessage = {
      content: messageType === "text" ? content : `Sent a ${messageType}`,
      senderId: req.user._id,
      timestamp: new Date(),
      messageType,
    }

    // Update unread count for receiver
    const currentUnreadCount = conversation.unreadCount.get(receiverId.toString()) || 0
    conversation.unreadCount.set(receiverId.toString(), currentUnreadCount + 1)

    await conversation.save()

    // Populate message for response
    await message.populate("senderId", "firstName lastName profileImage role")
    await message.populate("receiverId", "firstName lastName profileImage role")

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    })
  } catch (error) {
    console.error("Send message error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    })
  }
}

// @desc    Start a conversation with teacher
// @route   POST /api/messages/start-conversation
// @access  Private (Parent only)
const startConversation = async (req, res) => {
  try {
    const { teacherId, applicationId } = req.body

    // Validation
    if (!teacherId || !applicationId) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID and Application ID are required",
      })
    }

    // Verify application belongs to parent
    const application = await Application.findOne({
      _id: applicationId,
      parentId: req.user.parentProfile, // Assuming we have parent profile ID
    }).populate("schoolId")

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      })
    }

    // Verify teacher belongs to the school
    const teacher = await TeacherProfile.findOne({
      userId: teacherId,
      schoolId: application.schoolId._id,
    }).populate("userId")

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found in this school",
      })
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      applicationId,
      "participants.userId": { $all: [req.user._id, teacherId] },
    })

    if (conversation) {
      return res.json({
        success: true,
        message: "Conversation already exists",
        data: conversation,
      })
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [
        {
          userId: req.user._id,
          role: "parent",
        },
        {
          userId: teacherId,
          role: "teacher",
        },
      ],
      schoolId: application.schoolId._id,
      applicationId,
      unreadCount: new Map([
        [req.user._id.toString(), 0],
        [teacherId.toString(), 0],
      ]),
    })

    await conversation.save()

    // Populate conversation for response
    await conversation.populate("participants.userId", "firstName lastName profileImage role")
    await conversation.populate("schoolId", "name images")

    res.status(201).json({
      success: true,
      message: "Conversation started successfully",
      data: conversation,
    })
  } catch (error) {
    console.error("Start conversation error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to start conversation",
      error: error.message,
    })
  }
}

// @desc    Get available teachers for a school application
// @route   GET /api/messages/teachers/:applicationId
// @access  Private (Parent only)
const getAvailableTeachers = async (req, res) => {
  try {
    const { applicationId } = req.params

    // Verify application belongs to parent
    const application = await Application.findOne({
      _id: applicationId,
      parentId: req.user.parentProfile,
    }).populate("schoolId")

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      })
    }

    // Get teachers from the school
    const teachers = await TeacherProfile.find({
      schoolId: application.schoolId._id,
      isActive: true,
      isAvailableForNewChats: true,
    })
      .populate("userId", "firstName lastName profileImage email")
      .sort({ "userId.firstName": 1 })

    const formattedTeachers = teachers.map((teacher) => ({
      id: teacher.userId._id,
      name: `${teacher.userId.firstName} ${teacher.userId.lastName}`,
      profileImage: teacher.userId.profileImage,
      email: teacher.userId.email,
      employeeId: teacher.employeeId,
      subjects: teacher.subjects,
      bio: teacher.bio,
      availability: teacher.availability,
      contactPreferences: teacher.contactPreferences,
    }))

    res.json({
      success: true,
      data: {
        school: {
          id: application.schoolId._id,
          name: application.schoolId.name,
        },
        teachers: formattedTeachers,
      },
    })
  } catch (error) {
    console.error("Get available teachers error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch available teachers",
      error: error.message,
    })
  }
}

// @desc    Initiate video/audio call
// @route   POST /api/messages/call/initiate
// @access  Private
const initiateCall = async (req, res) => {
  try {
    const { conversationId, receiverId, callType } = req.body

    // Validation
    if (!conversationId || !receiverId || !["video_call", "audio_call"].includes(callType)) {
      return res.status(400).json({
        success: false,
        message: "Valid conversation ID, receiver ID, and call type are required",
      })
    }

    // Verify conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": req.user._id,
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      })
    }

    // Create call message
    const callMessage = new Message({
      conversationId,
      senderId: req.user._id,
      receiverId,
      messageType: callType,
      content: `${callType === "video_call" ? "Video" : "Audio"} call initiated`,
      callStatus: "initiated",
      callDuration: 0,
    })

    await callMessage.save()

    // Update conversation last message
    conversation.lastMessage = {
      content: `${callType === "video_call" ? "Video" : "Audio"} call`,
      senderId: req.user._id,
      timestamp: new Date(),
      messageType: callType,
    }

    await conversation.save()

    // Populate message for response
    await callMessage.populate("senderId", "firstName lastName profileImage")
    await callMessage.populate("receiverId", "firstName lastName profileImage")

    res.status(201).json({
      success: true,
      message: "Call initiated successfully",
      data: callMessage,
    })
  } catch (error) {
    console.error("Initiate call error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to initiate call",
      error: error.message,
    })
  }
}

// @desc    Update call status
// @route   PUT /api/messages/call/:messageId/status
// @access  Private
const updateCallStatus = async (req, res) => {
  try {
    const { messageId } = req.params
    const { status, duration } = req.body

    // Validation
    if (!["answered", "missed", "ended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid call status",
      })
    }

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
      messageType: { $in: ["video_call", "audio_call"] },
    })

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Call message not found",
      })
    }

    message.callStatus = status
    if (duration) {
      message.callDuration = duration
    }

    await message.save()

    res.json({
      success: true,
      message: "Call status updated successfully",
      data: message,
    })
  } catch (error) {
    console.error("Update call status error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update call status",
      error: error.message,
    })
  }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  getAvailableTeachers,
  initiateCall,
  updateCallStatus,
}
