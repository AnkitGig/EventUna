const express = require("express")
const router = express.Router()
const admin = require("../controllers/adminController")
const merchant = require("../controllers/merchantController")
const { protect, isAdmin } = require("../middleware/authMiddleware")

// Route to add services
router.post("/add-services", protect, isAdmin, admin.addServices)
router.patch("/update-status", protect, isAdmin, admin.merchantAccountStatus)
router.get("/all-merchants", protect, isAdmin, admin.getAllMerchants)
router.post("/add-notes", protect, isAdmin, admin.addNotes)
router.get("/all-users", protect, isAdmin, admin.allUsers)
router.post("/additional-services", protect, isAdmin, admin.addAdditionalServices)
router.post("/place-preference", protect, isAdmin, admin.placePreferences)
router.post("/add-subservices", protect, isAdmin, admin.subServices)
router.post("/add-restaurant-category", protect, isAdmin, admin.addRestaurantCategory)
router.get("/restaurant-categories", protect, isAdmin, admin.getRestaurantCategories)
router.patch("/update-merchant-approval-status", protect, isAdmin, admin.updateMerchantApprovalStatus) // Existing route
router.patch("/handle-deactivation-request", protect, isAdmin, admin.handleDeactivationRequest) // New route
router.patch("/handle-reactivation-request", protect, isAdmin, admin.handleReactivationRequest) // New route

module.exports = router
