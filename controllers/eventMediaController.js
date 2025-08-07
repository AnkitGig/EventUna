const EventMedia = require("../models/event/EventMedia")
const EventMediaComment = require("../models/event/EventMediaComment")
const Event = require("../models/event/Event")
const User = require("../models/user/User")
const joi = require("joi")
const mongoose = require("mongoose")

// Helper function to check if user has access to event
const checkEventAccess = async (eventId, userId) => {
  const event = await Event.findById(eventId)
  if (!event) {
    return { hasAccess: false, error: "Event not found" }
  }

  // Check if user is event creator
  if (event.userId.toString() === userId) {
    return { hasAccess: true, event }
  }

  // Check if user is an accepted invitee
  const invitedUser = event.invitedUsers.find(
    (inv) => inv.userId.toString() === userId && inv.status === "accepted"
  )

  if (!invitedUser) {
    return { hasAccess: false, error: "Access denied. You must be the event creator or an accepted invitee." }
  }

  return { hasAccess: true, event }
}

// Upload media to event
exports.uploadEventMedia = async (req, res) => {
  try {
    const { eventId, caption } = req.body
    const userId = req.user.id

    const schema = joi.object({
      eventId: joi.string().required(),
      caption: joi.string().optional().allow(""),
    })

    const { error } = schema.validate({ eventId, caption })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: false, message: "No media files uploaded" })
    }

    // Check event access
    const { hasAccess, error: accessError } = await checkEventAccess(eventId, userId)
    if (!hasAccess) {
      return res.status(403).json({ status: false, message: accessError })
    }

    // Process uploaded files
    const mediaItems = []
    for (const file of req.files) {
      const mediaType = file.mimetype.startsWith("image/") ? "image" : "video"
      
      const eventMedia = new EventMedia({
        eventId,
        uploadedBy: userId,
        mediaType,
        fileName: file.filename,
        originalName: file.originalname,
        caption: caption || "",
      })

      await eventMedia.save()
      mediaItems.push(eventMedia)
    }

    // Populate user details for response
    const populatedMedia = await EventMedia.find({
      _id: { $in: mediaItems.map(item => item._id) }
    })
      .populate("uploadedBy", "fullName profilePic")
      .exec()

    // Format response with full URLs
    const formattedMedia = populatedMedia.map(media => {
      const mediaObj = media.toObject()
      mediaObj.mediaUrl = `${process.env.BASE_URL}/event/media/${media.fileName}`
      if (mediaObj.uploadedBy.profilePic) {
        mediaObj.uploadedBy.profilePic = `${process.env.BASE_URL}/profile/${mediaObj.uploadedBy.profilePic}`
      } else {
        mediaObj.uploadedBy.profilePic = process.env.DEFAULT_PROFILE_PIC
      }
      return mediaObj
    })

    res.status(201).json({
      status: true,
      message: "Media uploaded successfully",
      data: formattedMedia,
    })
  } catch (error) {
    console.error("Error uploading event media:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Get all media for an event
exports.getEventMedia = async (req, res) => {
  try {
    const { eventId } = req.query
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const schema = joi.object({
      eventId: joi.string().required(),
      page: joi.number().integer().min(1).optional(),
      limit: joi.number().integer().min(1).max(50).optional(),
    })

    const { error } = schema.validate({ eventId, page: parseInt(page), limit: parseInt(limit) })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    // Check event access
    const { hasAccess, error: accessError } = await checkEventAccess(eventId, userId)
    if (!hasAccess) {
      return res.status(403).json({ status: false, message: accessError })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const media = await EventMedia.find({ eventId })
      .populate("uploadedBy", "fullName profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec()

    const totalCount = await EventMedia.countDocuments({ eventId })

    // Format response with full URLs
    const formattedMedia = media.map(mediaItem => {
      const mediaObj = mediaItem.toObject()
      mediaObj.mediaUrl = `${process.env.BASE_URL}/event/media/${mediaItem.fileName}`
      if (mediaObj.uploadedBy.profilePic) {
        mediaObj.uploadedBy.profilePic = `${process.env.BASE_URL}/profile/${mediaObj.uploadedBy.profilePic}`
      } else {
        mediaObj.uploadedBy.profilePic = process.env.DEFAULT_PROFILE_PIC
      }
      
      // Check if current user has liked this media
      mediaObj.isLikedByCurrentUser = mediaItem.likes.some(like => like.userId.toString() === userId)
      
      return mediaObj
    })

    res.status(200).json({
      status: true,
      message: "Event media retrieved successfully",
      data: {
        media: formattedMedia,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    })
  } catch (error) {
    console.error("Error getting event media:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Like or unlike media
exports.toggleMediaLike = async (req, res) => {
  try {
    const { mediaId } = req.body
    const userId = req.user.id

    const schema = joi.object({
      mediaId: joi.string().required(),
    })

    const { error } = schema.validate({ mediaId })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const media = await EventMedia.findById(mediaId)
    if (!media) {
      return res.status(404).json({ status: false, message: "Media not found" })
    }

    // Check event access
    const { hasAccess, error: accessError } = await checkEventAccess(media.eventId, userId)
    if (!hasAccess) {
      return res.status(403).json({ status: false, message: accessError })
    }

    // Check if user already liked this media
    const existingLikeIndex = media.likes.findIndex(like => like.userId.toString() === userId)

    let action = ""
    if (existingLikeIndex > -1) {
      // Unlike - remove the like
      media.likes.splice(existingLikeIndex, 1)
      media.likesCount = Math.max(0, media.likesCount - 1)
      action = "unliked"
    } else {
      // Like - add the like
      media.likes.push({ userId, likedAt: new Date() })
      media.likesCount += 1
      action = "liked"
    }

    await media.save()

    res.status(200).json({
      status: true,
      message: `Media ${action} successfully`,
      data: {
        mediaId: media._id,
        likesCount: media.likesCount,
        isLiked: action === "liked",
      },
    })
  } catch (error) {
    console.error("Error toggling media like:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Add comment to media
exports.addMediaComment = async (req, res) => {
  try {
    const { mediaId, comment } = req.body
    const userId = req.user.id

    const schema = joi.object({
      mediaId: joi.string().required(),
      comment: joi.string().required().trim().min(1).max(500),
    })

    const { error } = schema.validate({ mediaId, comment })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const media = await EventMedia.findById(mediaId)
    if (!media) {
      return res.status(404).json({ status: false, message: "Media not found" })
    }

    // Check event access
    const { hasAccess, error: accessError } = await checkEventAccess(media.eventId, userId)
    if (!hasAccess) {
      return res.status(403).json({ status: false, message: accessError })
    }

    // Create new comment
    const newComment = new EventMediaComment({
      mediaId,
      userId,
      comment: comment.trim(),
    })

    await newComment.save()

    // Update comment count on media
    media.commentsCount += 1
    await media.save()

    // Populate user details for response
    const populatedComment = await EventMediaComment.findById(newComment._id)
      .populate("userId", "fullName profilePic")
      .exec()

    // Format response
    const commentObj = populatedComment.toObject()
    if (commentObj.userId.profilePic) {
      commentObj.userId.profilePic = `${process.env.BASE_URL}/profile/${commentObj.userId.profilePic}`
    } else {
      commentObj.userId.profilePic = process.env.DEFAULT_PROFILE_PIC
    }

    res.status(201).json({
      status: true,
      message: "Comment added successfully",
      data: commentObj,
    })
  } catch (error) {
    console.error("Error adding media comment:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Get comments for media
exports.getMediaComments = async (req, res) => {
  try {
    const { mediaId } = req.query
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const schema = joi.object({
      mediaId: joi.string().required(),
      page: joi.number().integer().min(1).optional(),
      limit: joi.number().integer().min(1).max(50).optional(),
    })

    const { error } = schema.validate({ mediaId, page: parseInt(page), limit: parseInt(limit) })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const media = await EventMedia.findById(mediaId)
    if (!media) {
      return res.status(404).json({ status: false, message: "Media not found" })
    }

    // Check event access
    const { hasAccess, error: accessError } = await checkEventAccess(media.eventId, userId)
    if (!hasAccess) {
      return res.status(403).json({ status: false, message: accessError })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const comments = await EventMediaComment.find({ mediaId, parentCommentId: null })
      .populate("userId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec()

    const totalCount = await EventMediaComment.countDocuments({ mediaId, parentCommentId: null })

    // Format response with full URLs
    const formattedComments = comments.map(comment => {
      const commentObj = comment.toObject()
      if (commentObj.userId.profilePic) {
        commentObj.userId.profilePic = `${process.env.BASE_URL}/profile/${commentObj.userId.profilePic}`
      } else {
        commentObj.userId.profilePic = process.env.DEFAULT_PROFILE_PIC
      }
      
      // Check if current user has liked this comment
      commentObj.isLikedByCurrentUser = comment.likes.some(like => like.userId.toString() === userId)
      
      return commentObj
    })

    res.status(200).json({
      status: true,
      message: "Comments retrieved successfully",
      data: {
        comments: formattedComments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          hasNextPage: skip + parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    })
  } catch (error) {
    console.error("Error getting media comments:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Like or unlike comment
exports.toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.body
    const userId = req.user.id

    const schema = joi.object({
      commentId: joi.string().required(),
    })

    const { error } = schema.validate({ commentId })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const comment = await EventMediaComment.findById(commentId).populate("mediaId")
    if (!comment) {
      return res.status(404).json({ status: false, message: "Comment not found" })
    }

    // Check event access through media
    const { hasAccess, error: accessError } = await checkEventAccess(comment.mediaId.eventId, userId)
    if (!hasAccess) {
      return res.status(403).json({ status: false, message: accessError })
    }

    // Check if user already liked this comment
    const existingLikeIndex = comment.likes.findIndex(like => like.userId.toString() === userId)

    let action = ""
    if (existingLikeIndex > -1) {
      // Unlike - remove the like
      comment.likes.splice(existingLikeIndex, 1)
      comment.likesCount = Math.max(0, comment.likesCount - 1)
      action = "unliked"
    } else {
      // Like - add the like
      comment.likes.push({ userId, likedAt: new Date() })
      comment.likesCount += 1
      action = "liked"
    }

    await comment.save()

    res.status(200).json({
      status: true,
      message: `Comment ${action} successfully`,
      data: {
        commentId: comment._id,
        likesCount: comment.likesCount,
        isLiked: action === "liked",
      },
    })
  } catch (error) {
    console.error("Error toggling comment like:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Delete media (only by uploader or event creator)
exports.deleteEventMedia = async (req, res) => {
  try {
    const { mediaId } = req.body
    const userId = req.user.id

    const schema = joi.object({
      mediaId: joi.string().required(),
    })

    const { error } = schema.validate({ mediaId })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const media = await EventMedia.findById(mediaId)
    if (!media) {
      return res.status(404).json({ status: false, message: "Media not found" })
    }

    const event = await Event.findById(media.eventId)
    if (!event) {
      return res.status(404).json({ status: false, message: "Event not found" })
    }

    // Check if user can delete (uploader or event creator)
    if (media.uploadedBy.toString() !== userId && event.userId.toString() !== userId) {
      return res.status(403).json({ 
        status: false, 
        message: "You can only delete media you uploaded or if you're the event creator" 
      })
    }

    // Delete associated comments
    await EventMediaComment.deleteMany({ mediaId })

    // Delete the media file from filesystem
    const fs = require("fs")
    const path = require("path")
    const filePath = path.join(__dirname, "../public/event/media", media.fileName)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete media record
    await EventMedia.findByIdAndDelete(mediaId)

    res.status(200).json({
      status: true,
      message: "Media deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting event media:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Delete comment (only by commenter or event creator)
exports.deleteMediaComment = async (req, res) => {
  try {
    const { commentId } = req.body
    const userId = req.user.id

    const schema = joi.object({
      commentId: joi.string().required(),
    })

    const { error } = schema.validate({ commentId })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const comment = await EventMediaComment.findById(commentId).populate("mediaId")
    if (!comment) {
      return res.status(404).json({ status: false, message: "Comment not found" })
    }

    const event = await Event.findById(comment.mediaId.eventId)
    if (!event) {
      return res.status(404).json({ status: false, message: "Event not found" })
    }

    // Check if user can delete (commenter or event creator)
    if (comment.userId.toString() !== userId && event.userId.toString() !== userId) {
      return res.status(403).json({ 
        status: false, 
        message: "You can only delete comments you made or if you're the event creator" 
      })
    }

    // Update comment count on media
    const media = await EventMedia.findById(comment.mediaId._id)
    if (media) {
      media.commentsCount = Math.max(0, media.commentsCount - 1)
      await media.save()
    }

    // Delete the comment
    await EventMediaComment.findByIdAndDelete(commentId)

    res.status(200).json({
      status: true,
      message: "Comment deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting media comment:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}
