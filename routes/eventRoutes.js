const express = require("express")
const router = express.Router()
const event = require("../controllers/eventController")
const { protect, isAdmin } = require("../middleware/authMiddleware")
const { uploadEvent } = require("../middleware/multer")

router.post("/event-type", event.addEventType)
router.post("/event-category", event.addEventCategory)
router.get("/event-type", event.allEventType)
router.get("/event-category/:id", event.categoryByEventType)
router.get("/place-preferences", event.placePreferences)
router.post("/create-event", protect, uploadEvent.single("image"), event.createEvent)
router.get("/event-user", protect, event.eventByUser)
router.patch("/event-poll-vote", protect, event.voteOrUnvotePoll)
router.get("/notes", protect, event.eventNotes)
router.post("/registry", protect, event.createRegistry)
router.get("/registry", protect, event.registryByUser)
router.get("/registry/search", protect, event.searchRegistry)
router.get("/additional-services", protect, event.additionalServices)
router.post("/poll", protect, event.createPoll)
router.get("/events", protect, event.getEvents)
router.get("/events/:id", protect, event.getEventById)
router.post("/respond-to-invitation", protect, event.respondToInvitation) // New route
router.get("/my-invitations", protect, event.getEventInvitations) // New route

// New routes added here
router.post("/send-reminder", protect, event.sendInvitationReminder) // New route for sending reminders
router.get("/pending-invitations", protect, event.getEventPendingInvitations) // New route for getting pending invitations

// Example protected route
router.get("/admin-only", protect, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" })
})

module.exports = router
