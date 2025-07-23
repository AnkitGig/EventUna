const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const { getTeacherProfile, updateTeacherProfile, updateAvailability } = require("../controllers/teacherController")

const router = express.Router()

/**
 * ===========================================
 * 👩‍🏫 TEACHER APIS - TEACHER APP SCREENS
 * ===========================================
 * These APIs handle teacher-specific screens and functionality
 */

// 📱 SCREEN: Teacher Dashboard/Profile Screen
// API: GET /api/teachers/profile
// Purpose: Show teacher profile with subjects, schedule, school info
// Features: Personal info, subjects taught, qualifications, schedule
router.get("/profile", auth, authorize("teacher"), getTeacherProfile)

// 📱 SCREEN: Edit Teacher Profile Screen
// API: PUT /api/teachers/profile
// Purpose: Update teacher profile information
// Features: Bio, subjects, qualifications, contact preferences
router.put("/profile", auth, authorize("teacher"), updateTeacherProfile)

// 📱 SCREEN: Teacher Availability Settings Screen
// API: PUT /api/teachers/availability
// Purpose: Update availability for chat and calls
// Features: Available for chat, available for calls, accepting new chats
router.put("/availability", auth, authorize("teacher"), updateAvailability)

module.exports = router
