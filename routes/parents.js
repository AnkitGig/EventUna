const express = require("express")
const Parent = require("../models/Parent")
const User = require("../models/User")
const { auth, authorize } = require("../middleware/auth")
const { uploadChildImage } = require("../middleware/upload")
const {
  getParentProfile,
  updateParentProfile,
  addChild,
  updateChild,
  updateChildWithImage,
  deleteChild,
  getChildren,
} = require("../controllers/parentController")

const router = express.Router()

/**
 * ===========================================
 * 👨‍👩‍👧‍👦 PARENT PROFILE APIS - PARENT SCREENS
 * ===========================================
 * These APIs handle parent profile and children management screens
 */

// 📱 SCREEN: Parent Dashboard/Profile Screen
// API: GET /api/parents/profile
// Purpose: Get parent profile with all children information
router.get("/profile", auth, authorize("parent"), getParentProfile)

// 📱 SCREEN: Edit Parent Profile Screen
// API: PUT /api/parents/profile
// Purpose: Update parent contact info, emergency contacts, preferences
router.put("/profile", auth, authorize("parent"), updateParentProfile)

// 📱 SCREEN: Children List Screen
// API: GET /api/parents/children
// Purpose: Get list of all children for parent
router.get("/children", auth, authorize("parent"), getChildren)

// 📱 SCREEN: Add Child Screen
// API: POST /api/parents/children
// Purpose: Add new child to parent profile
router.post("/children", auth, authorize("parent"), addChild)

// 📱 SCREEN: Edit Child Profile Screen
// API: PUT /api/parents/children/:childId
// Purpose: Update child information (name, age, school, etc.)
router.put("/children/:childId", auth, authorize("parent"), updateChild)

// 📱 SCREEN: Child Photo Upload Screen
// API: PUT /api/parents/children/:childId/image
// Purpose: Upload/update child profile photo
router.put("/children/:childId/image", auth, authorize("parent"), uploadChildImage, updateChildWithImage)

// 📱 SCREEN: Remove Child Confirmation Screen
// API: DELETE /api/parents/children/:childId
// Purpose: Remove child from parent profile
router.delete("/children/:childId", auth, authorize("parent"), deleteChild)

module.exports = router
