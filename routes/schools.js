const express = require("express")
const School = require("../models/School")
const { auth } = require("../middleware/auth")
const {
  getAllSchools,
  getSchoolById,
  getNearbySchools,
  getSchoolStats,
  getFeaturedSchools,
  getSearchSuggestions,
} = require("../controllers/schoolController")

const router = express.Router()

/**
 * ===========================================
 * 🏫 SCHOOL DISCOVERY APIS - PARENT/PUBLIC SCREENS
 * ===========================================
 * These APIs handle school search and discovery screens for parents
 * Based on Figma screens for school browsing and application flow
 */

// 📱 SCREEN: School Search/Browse Screen (Main Discovery)
// API: GET /api/schools?search=bright&city=mumbai&minFee=5000&maxFee=15000&sortBy=rating
// Purpose: Search and filter schools by various criteria for parents
// Features: Name search, location filter, fee range, ratings, facilities, curriculum
router.get("/", getAllSchools)

// 📱 SCREEN: Featured/Recommended Schools Screen (Home Page)
// API: GET /api/schools/featured?limit=6
// Purpose: Show featured/recommended schools on home page
// Features: High-rated schools, recently added, curated list
router.get("/featured", getFeaturedSchools)

// 📱 SCREEN: Search Suggestions/Autocomplete
// API: GET /api/schools/search/suggestions?q=bright&type=schools
// Purpose: Provide autocomplete suggestions while typing
// Features: School names, cities, facilities suggestions
router.get("/search/suggestions", getSearchSuggestions)

// 📱 SCREEN: School Details Screen (Before Application)
// API: GET /api/schools/:id
// Purpose: Show detailed information about a specific school
// Features: Photos, facilities, fees, contact info, ratings, reviews
router.get("/:id", getSchoolById)

// 📱 SCREEN: Nearby Schools Screen (Map View)
// API: GET /api/schools/nearby/:latitude/:longitude?radius=10&minRating=4
// Purpose: Find schools near user's location with map integration
// Features: GPS-based search, distance calculation, map markers
router.get("/nearby/:latitude/:longitude", getNearbySchools)

// 📱 SCREEN: School Statistics/Filters Screen (Advanced Search)
// API: GET /api/schools/stats
// Purpose: Show overall statistics and available filter options
// Features: Total schools, fee ranges, city breakdown, facilities, curriculum types
router.get("/stats", getSchoolStats)

module.exports = router
