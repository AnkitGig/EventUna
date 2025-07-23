const express = require("express")
const Application = require("../models/Application")
const Parent = require("../models/Parent")
const School = require("../models/School")
const { auth, authorize } = require("../middleware/auth")
const {
  submitApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  cancelApplication,
  getApplicationStats,
} = require("../controllers/applicationController")

const router = express.Router()

/**
 * ===========================================
 * 📝 SCHOOL APPLICATION APIS - APPLICATION SCREENS
 * ===========================================
 * These APIs handle school application process screens
 */

// 📱 SCREEN: Application Form Screen
// API: POST /api/applications
// Purpose: Submit new school application
// Features: Child info, parent details, emergency contacts, notes
router.post("/", auth, authorize("parent"), submitApplication)

// 📱 SCREEN: My Applications Screen (Application History)
// API: GET /api/applications/my-applications?status=pending
// Purpose: Show all applications submitted by parent
// Features: Application status, school info, submission date
router.get("/my-applications", auth, authorize("parent"), getMyApplications)

// 📱 SCREEN: Application Details Screen
// API: GET /api/applications/:id
// Purpose: Show detailed view of specific application
// Features: Full application info, status updates, school details
router.get("/:id", auth, authorize("parent"), getApplicationById)

// 📱 SCREEN: Edit Application Screen
// API: PUT /api/applications/:id
// Purpose: Update pending application details
// Features: Edit child info, parent details, notes (only if pending)
router.put("/:id", auth, authorize("parent"), updateApplication)

// 📱 SCREEN: Cancel Application Screen
// API: DELETE /api/applications/:id
// Purpose: Cancel/withdraw pending application
// Features: Application cancellation, confirmation dialog
router.delete("/:id", auth, authorize("parent"), cancelApplication)

// 📱 SCREEN: Application Statistics Screen
// API: GET /api/applications/stats
// Purpose: Show application statistics for parent
// Features: Total applications, status breakdown, success rate
router.get("/stats", auth, authorize("parent"), getApplicationStats)

module.exports = router
