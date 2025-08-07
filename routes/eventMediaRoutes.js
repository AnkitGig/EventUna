const express = require("express")
const router = express.Router()
const eventMediaController = require("../controllers/eventMediaController")
const { protect } = require("../middleware/authMiddleware")
const { uploadEventMedia } = require("../middleware/eventMediaMulter")

// Media upload and retrieval
router.post("/upload", protect, uploadEventMedia.array("media", 10), eventMediaController.uploadEventMedia)
router.get("/media", protect, eventMediaController.getEventMedia)
router.delete("/media", protect, eventMediaController.deleteEventMedia)

// Media likes
router.post("/media/like", protect, eventMediaController.toggleMediaLike)

// Comments
router.post("/media/comment", protect, eventMediaController.addMediaComment)
router.get("/media/comments", protect, eventMediaController.getMediaComments)
router.post("/media/comment/like", protect, eventMediaController.toggleCommentLike)
router.delete("/media/comment", protect, eventMediaController.deleteMediaComment)

module.exports = router
