const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const {
  getChildTimeline,
  addChildActivity,
  getAttendanceCalendar,
  getDailyReport,
  getRoomSchedule,
} = require("../controllers/childActivityController")

const router = express.Router()

/**
 * ===========================================
 * 👶 CHILD ACTIVITY APIS - MAIN DAYCARE SCREENS
 * ===========================================
 * These are the core APIs for daycare management screens shown in Figma
 */

// 📱 SCREEN: Child Daily Timeline Screen (Main Parent View)
// API: GET /api/activities/timeline/:childId?date=2024-01-15&activityType=diaper
// Purpose: Shows chronological list of all activities for a child on specific date
// Features: Diaper changes, meals, sleep, activities, mood tracking
router.get("/timeline/:childId", auth, getChildTimeline)

// 📱 SCREEN: Diaper Timeline Screen (Specific Diaper Tracking)
// API: GET /api/activities/timeline/:childId?activityType=diaper&date=2024-01-15
// Purpose: Filter timeline to show only diaper changes for the day
// Shows: Time, type (wet/soiled/dry), notes, photos
router.get("/timeline/:childId", auth, getChildTimeline) // Same endpoint, filtered

// 📱 SCREEN: Attendance Calendar Screen (Monthly View)
// API: GET /api/activities/attendance/:childId?month=1&year=2024
// Purpose: Shows monthly calendar with attendance status for each day
// Features: Present/Absent/Late status, check-in/out times
router.get("/attendance/:childId", auth, getAttendanceCalendar)

// 📱 SCREEN: Daily Report Screen (Comprehensive Daily Summary)
// API: GET /api/activities/daily-report/:childId?date=2024-01-15
// Purpose: Complete daily report with all activities, meals, sleep, mood
// Features: Teacher notes, photos, milestones, parent acknowledgment
router.get("/daily-report/:childId", auth, getDailyReport)

// 📱 SCREEN: Room/Class Schedule Screen
// API: GET /api/activities/room-schedule/:roomId?date=2024-01-15
// Purpose: Shows daily schedule for a specific room/class
// Features: Time slots, activities, teacher info, current children
router.get("/room-schedule/:roomId", auth, getRoomSchedule)

// 📱 SCREEN: Teacher Activity Logging Screen (Teacher App)
// API: POST /api/activities/add
// Purpose: Teachers use this to log activities for children
// Features: Add diaper changes, meals, sleep, activities, mood, photos
router.post("/add", auth, authorize("teacher"), addChildActivity)

module.exports = router
