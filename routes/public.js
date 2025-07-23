const express = require("express")
const {
  submitPublicApplication,
  checkApplicationStatus,
  getApplicationsByEmail,
} = require("../controllers/publicApplicationController")

const router = express.Router()

/**
 * ===========================================
 * 📝 PUBLIC APPLICATION APIS - NO LOGIN REQUIRED
 * ===========================================
 * These APIs handle public school applications without authentication
 * Based on Figma screens showing public application submission flow
 */

// 📱 SCREEN: School Application Form (Public)
// API: POST /api/public/applications
// Purpose: Submit school application without login (as shown in Figma)
// Features: Child info, parent details, emergency contact, address, notes
router.post("/applications", submitPublicApplication)

// 📱 SCREEN: Application Status Check (Public)
// API: GET /api/public/applications/status/:applicationId?email=parent@example.com
// Purpose: Check application status using application ID and email
// Features: Status tracking, review notes, account creation status
router.get("/applications/status/:applicationId", checkApplicationStatus)

// 📱 SCREEN: My Applications List (Public)
// API: GET /api/public/applications/by-email/:email
// Purpose: Get all applications submitted by an email address
// Features: Application history, status overview, school details
router.get("/applications/by-email/:email", getApplicationsByEmail)

module.exports = router
