const GroupChat = require("../models/chat/GroupChat")
const Event = require("../models/event/Event")
const Message = require("../models/chat/Message") // Import the new Message model
const joi = require("joi")

exports.createOrAddMembersToGroupChat = async (eventId, userId, session) => {
  try {
    let groupChat = await GroupChat.findOne({ eventId })

    if (!groupChat) {
      // Create new group chat if it doesn't exist
      groupChat = new GroupChat({
        eventId,
        members: [userId],
      })
      await groupChat.save({ session })

      // Link chat group to event
      await Event.findByIdAndUpdate(eventId, { chatGroupId: groupChat._id }, { session })
      console.log(`Created new group chat for event ${eventId}`)
    } else {
      // Add user to existing group chat if not already a member
      if (!groupChat.members.includes(userId)) {
        groupChat.members.push(userId)
        await groupChat.save({ session })
        console.log(`Added user ${userId} to group chat for event ${eventId}`)
      } else {
        console.log(`User ${userId} is already a member of group chat for event ${eventId}`)
      }
    }
    return groupChat
  } catch (error) {
    console.error("Error creating or adding members to group chat:", error)
    throw error // Re-throw to be caught by the transaction
  }
}

exports.getEventGroupChat = async (req, res) => {
  try {
    const { eventId } = req.query
    const userId = req.user.id

    const schema = joi.object({
      eventId: joi.string().required(),
    })

    const { error } = schema.validate(req.query)
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ status: false, message: "Event not found." })
    }

    // Check if the user is invited to the event and has accepted, or is the event creator
    const isEventCreator = event.userId.toString() === userId
    const invitedUser = event.invitedUsers.find((inv) => inv.userId.toString() === userId && inv.status === "accepted")

    if (!invitedUser && !isEventCreator) {
      return res
        .status(403)
        .json({ status: false, message: "Access denied. You must be the event creator or an accepted invitee." })
    }

    const groupChat = await GroupChat.findOne({ eventId }).populate("members", "fullName email")

    if (!groupChat) {
      return res.status(404).json({ status: false, message: "No group chat found for this event." })
    }

    res.status(200).json({
      status: true,
      message: "Group chat retrieved successfully.",
      data: groupChat,
    })
  } catch (error) {
    console.error("Error getting event group chat:", error)
    res.status(500).json({ status: false, message: "Internal server error." })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body
    const senderId = req.user.id

    const schema = joi.object({
      chatId: joi.string().required(),
      content: joi.string().trim().min(1).required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const groupChat = await GroupChat.findById(chatId)
    if (!groupChat) {
      return res.status(404).json({ status: false, message: "Group chat not found." })
    }

    // Ensure the sender is a member of this group chat
    if (!groupChat.members.includes(senderId)) {
      return res.status(403).json({ status: false, message: "You are not a member of this chat group." })
    }

    const newMessage = new Message({
      chatId,
      sender: senderId,
      content,
    })

    await newMessage.save()

    // Optionally, you could emit a real-time event here using WebSockets
    // For now, we just save to DB and return.

    res.status(201).json({
      status: true,
      message: "Message sent successfully.",
      data: newMessage,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ status: false, message: "Internal server error." })
  }
}

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.query
    const userId = req.user.id // User requesting messages

    const schema = joi.object({
      chatId: joi.string().required(),
    })

    const { error } = schema.validate(req.query)
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const groupChat = await GroupChat.findById(chatId)
    if (!groupChat) {
      return res.status(404).json({ status: false, message: "Group chat not found." })
    }

    // Ensure the requesting user is a member of this group chat
    if (!groupChat.members.includes(userId)) {
      return res.status(403).json({ status: false, message: "You are not a member of this chat group." })
    }

    const messages = await Message.find({ chatId })
      .populate("sender", "fullName email profilePic") // Populate sender details
      .sort({ createdAt: 1 }) // Sort by oldest first
      .exec()

    // Format profilePic URLs
    const formattedMessages = messages.map((message) => {
      const msgObj = message.toObject()
      if (msgObj.sender && msgObj.sender.profilePic) {
        msgObj.sender.profilePic = `${process.env.BASE_URL}/profile/${msgObj.sender.profilePic}`
      } else if (msgObj.sender) {
        msgObj.sender.profilePic = process.env.DEFAULT_PROFILE_PIC
      }
      return msgObj
    })

    res.status(200).json({
      status: true,
      message: "Messages retrieved successfully.",
      data: formattedMessages,
    })
  } catch (error) {
    console.error("Error retrieving messages:", error)
    res.status(500).json({ status: false, message: "Internal server error." })
  }
}
