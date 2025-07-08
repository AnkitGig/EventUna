const express = require('express');
const router = express.Router();
const event = require('../controllers/eventController');

const { protect, isAdmin } = require('../middleware/authMiddleware');

router.post('/event-type', event.addEventType);
router.post('/event-category', event.addEventCategory);
router.get('/event-type', event.allEventType);
router.get('/event-category/:id', event.categoryByEventType);
router.get('/place-preferences', event.placePreferences);
router.post('/create-event', protect, event.createEvent)
router.get('/event-user', protect, event.eventByUser);

// Example protected route
router.get('/admin-only', protect, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

module.exports = router;
