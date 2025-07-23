const School = require("../models/School")

/**
 * ===========================================
 * 🏫 SCHOOL DISCOVERY APIS - PARENT SCREENS
 * ===========================================
 * These APIs handle school search and discovery for parents
 * Based on Figma screens for school browsing and selection
 */

// @desc    Get all schools with search and filters (Parent View)
// @route   GET /api/schools
// @access  Public
const getAllSchools = async (req, res) => {
  try {
    const {
      search,
      city,
      minFee,
      maxFee,
      latitude,
      longitude,
      radius = 10,
      page = 1,
      limit = 10,
      ageGroup,
      facilities,
      curriculum,
      sortBy = "rating",
    } = req.query

    const query = { isActive: true }

    // Search by name, description, or principal name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { principalName: { $regex: search, $options: "i" } },
        { affiliation: { $regex: search, $options: "i" } },
      ]
    }

    // Filter by city
    if (city) {
      query["address.city"] = { $regex: city, $options: "i" }
    }

    // Filter by fee range
    if (minFee || maxFee) {
      query["fees.monthlyFee"] = {}
      if (minFee) query["fees.monthlyFee"].$gte = Number.parseInt(minFee)
      if (maxFee) query["fees.monthlyFee"].$lte = Number.parseInt(maxFee)
    }

    // Filter by age group
    if (ageGroup) {
      query["ageGroups.name"] = { $regex: ageGroup, $options: "i" }
    }

    // Filter by facilities
    if (facilities) {
      const facilitiesArray = facilities.split(",").map((f) => f.trim())
      query.facilities = { $in: facilitiesArray.map((f) => new RegExp(f, "i")) }
    }

    // Filter by curriculum
    if (curriculum) {
      const curriculumArray = curriculum.split(",").map((c) => c.trim())
      query.curriculum = { $in: curriculumArray.map((c) => new RegExp(c, "i")) }
    }

    let schools
    let sortOptions = {}

    // Determine sort order
    switch (sortBy) {
      case "rating":
        sortOptions = { "rating.average": -1, "rating.totalReviews": -1 }
        break
      case "fee_low":
        sortOptions = { "fees.monthlyFee": 1 }
        break
      case "fee_high":
        sortOptions = { "fees.monthlyFee": -1 }
        break
      case "name":
        sortOptions = { name: 1 }
        break
      case "newest":
        sortOptions = { createdAt: -1 }
        break
      default:
        sortOptions = { "rating.average": -1 }
    }

    // Location-based search with distance
    if (latitude && longitude) {
      const lat = Number.parseFloat(latitude)
      const lng = Number.parseFloat(longitude)

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude",
        })
      }

      schools = await School.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat],
            },
            distanceField: "distance",
            maxDistance: radius * 1000, // Convert km to meters
            spherical: true,
            query: query,
          },
        },
        {
          $addFields: {
            distanceInKm: { $round: [{ $divide: ["$distance", 1000] }, 2] },
          },
        },
        { $sort: sortOptions },
        { $skip: (page - 1) * limit },
        { $limit: Number.parseInt(limit) },
      ])
    } else {
      schools = await School.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(Number.parseInt(limit))
        .lean()
    }

    const total = await School.countDocuments(query)

    // Add computed fields for frontend
    const enrichedSchools = schools.map((school) => ({
      ...school,
      hasImages: school.images && school.images.length > 0,
      facilitiesCount: school.facilities ? school.facilities.length : 0,
      ageGroupsCount: school.ageGroups ? school.ageGroups.length : 0,
      ratingDisplay: school.rating?.average ? school.rating.average.toFixed(1) : "0.0",
      feeRange: {
        monthly: school.fees?.monthlyFee || 0,
        admission: school.fees?.admissionFee || 0,
        annual: school.fees?.annualFee || 0,
      },
      contactDisplay: {
        phone: school.contactInfo?.phone || "",
        email: school.contactInfo?.email || "",
        website: school.contactInfo?.website || "",
      },
      addressDisplay:
        `${school.address?.street || ""}, ${school.address?.city || ""}, ${school.address?.state || ""} ${school.address?.zipCode || ""}`.trim(),
    }))

    res.json({
      success: true,
      data: {
        schools: enrichedSchools,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        filters: {
          search: search || "",
          city: city || "",
          minFee: minFee || "",
          maxFee: maxFee || "",
          ageGroup: ageGroup || "",
          facilities: facilities || "",
          curriculum: curriculum || "",
          sortBy: sortBy || "rating",
        },
      },
    })
  } catch (error) {
    console.error("Get schools error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch schools",
      error: error.message,
    })
  }
}

// @desc    Get school by ID with detailed information
// @route   GET /api/schools/:id
// @access  Public
const getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id).lean()

    if (!school || !school.isActive) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      })
    }

    // Enrich school data for detailed view
    const enrichedSchool = {
      ...school,
      hasImages: school.images && school.images.length > 0,
      facilitiesCount: school.facilities ? school.facilities.length : 0,
      ageGroupsCount: school.ageGroups ? school.ageGroups.length : 0,
      ratingDisplay: school.rating?.average ? school.rating.average.toFixed(1) : "0.0",
      feeRange: {
        monthly: school.fees?.monthlyFee || 0,
        admission: school.fees?.admissionFee || 0,
        annual: school.fees?.annualFee || 0,
        total: (school.fees?.monthlyFee || 0) * 12 + (school.fees?.admissionFee || 0),
      },
      contactDisplay: {
        phone: school.contactInfo?.phone || "",
        email: school.contactInfo?.email || "",
        website: school.contactInfo?.website || "",
      },
      addressDisplay:
        `${school.address?.street || ""}, ${school.address?.city || ""}, ${school.address?.state || ""} ${school.address?.zipCode || ""}`.trim(),
      timingsDisplay: {
        openTime: school.timings?.openTime || "08:00",
        closeTime: school.timings?.closeTime || "17:00",
        workingDays: school.timings?.workingDays || [],
        workingDaysText: (school.timings?.workingDays || []).join(", "),
      },
      establishmentInfo: {
        establishedYear: school.establishedYear || "Not specified",
        principalName: school.principalName || "Not specified",
        affiliation: school.affiliation || "Not specified",
      },
    }

    res.json({
      success: true,
      data: enrichedSchool,
    })
  } catch (error) {
    console.error("Get school by ID error:", error)

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid school ID format",
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch school",
      error: error.message,
    })
  }
}

// @desc    Get nearby schools with distance calculation
// @route   GET /api/schools/nearby/:latitude/:longitude
// @access  Public
const getNearbySchools = async (req, res) => {
  try {
    const { latitude, longitude } = req.params
    const { radius = 10, limit = 20, minRating = 0 } = req.query

    // Validate coordinates
    const lat = Number.parseFloat(latitude)
    const lng = Number.parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      })
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90, longitude between -180 and 180",
      })
    }

    const matchQuery = {
      isActive: true,
    }

    // Filter by minimum rating if specified
    if (minRating > 0) {
      matchQuery["rating.average"] = { $gte: Number.parseFloat(minRating) }
    }

    const schools = await School.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distance",
          maxDistance: radius * 1000, // Convert km to meters
          spherical: true,
          query: matchQuery,
        },
      },
      {
        $addFields: {
          distanceInKm: { $round: [{ $divide: ["$distance", 1000] }, 2] },
          ratingDisplay: {
            $cond: {
              if: { $gt: ["$rating.average", 0] },
              then: { $round: ["$rating.average", 1] },
              else: 0,
            },
          },
        },
      },
      {
        $sort: { distance: 1, "rating.average": -1 },
      },
      {
        $limit: Number.parseInt(limit),
      },
      {
        $project: {
          name: 1,
          description: 1,
          address: 1,
          contactInfo: 1,
          images: 1,
          facilities: 1,
          ageGroups: 1,
          fees: 1,
          rating: 1,
          ratingDisplay: 1,
          distance: 1,
          distanceInKm: 1,
          principalName: 1,
          establishedYear: 1,
          affiliation: 1,
        },
      },
    ])

    res.json({
      success: true,
      data: {
        schools,
        searchCenter: {
          latitude: lat,
          longitude: lng,
        },
        searchRadius: radius,
        totalFound: schools.length,
      },
    })
  } catch (error) {
    console.error("Get nearby schools error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby schools",
      error: error.message,
    })
  }
}

// @desc    Get school statistics and filters data
// @route   GET /api/schools/stats
// @access  Public
const getSchoolStats = async (req, res) => {
  try {
    const totalSchools = await School.countDocuments({ isActive: true })

    const avgRating = await School.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating.average" } } },
    ])

    const feeRanges = await School.aggregate([
      { $match: { isActive: true, "fees.monthlyFee": { $gt: 0 } } },
      {
        $group: {
          _id: null,
          minFee: { $min: "$fees.monthlyFee" },
          maxFee: { $max: "$fees.monthlyFee" },
          avgFee: { $avg: "$fees.monthlyFee" },
        },
      },
    ])

    const cityCounts = await School.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$address.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    const facilitiesCounts = await School.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$facilities" },
      { $group: { _id: "$facilities", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ])

    const ageGroupCounts = await School.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$ageGroups" },
      { $group: { _id: "$ageGroups.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    const curriculumCounts = await School.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$curriculum" },
      { $group: { _id: "$curriculum", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    const ratingDistribution = await School.aggregate([
      { $match: { isActive: true } },
      {
        $bucket: {
          groupBy: "$rating.average",
          boundaries: [0, 1, 2, 3, 4, 5],
          default: "Unrated",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ])

    res.json({
      success: true,
      data: {
        overview: {
          totalSchools,
          averageRating: avgRating[0]?.avgRating || 0,
          feeRange: feeRanges[0] || { minFee: 0, maxFee: 0, avgFee: 0 },
        },
        filters: {
          topCities: cityCounts,
          popularFacilities: facilitiesCounts,
          availableAgeGroups: ageGroupCounts,
          curriculumTypes: curriculumCounts,
        },
        analytics: {
          ratingDistribution,
        },
      },
    })
  } catch (error) {
    console.error("Get school stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch school statistics",
      error: error.message,
    })
  }
}

// @desc    Get featured/recommended schools
// @route   GET /api/schools/featured
// @access  Public
const getFeaturedSchools = async (req, res) => {
  try {
    const { limit = 6 } = req.query

    // Get schools with high ratings and good reviews
    const featuredSchools = await School.find({
      isActive: true,
      "rating.average": { $gte: 4.0 },
      "rating.totalReviews": { $gte: 5 },
    })
      .sort({ "rating.average": -1, "rating.totalReviews": -1 })
      .limit(Number.parseInt(limit))
      .lean()

    // If not enough highly rated schools, fill with recent ones
    if (featuredSchools.length < limit) {
      const additionalSchools = await School.find({
        isActive: true,
        _id: { $nin: featuredSchools.map((s) => s._id) },
      })
        .sort({ createdAt: -1 })
        .limit(limit - featuredSchools.length)
        .lean()

      featuredSchools.push(...additionalSchools)
    }

    const enrichedSchools = featuredSchools.map((school) => ({
      ...school,
      ratingDisplay: school.rating?.average ? school.rating.average.toFixed(1) : "0.0",
      feeDisplay: school.fees?.monthlyFee ? `₹${school.fees.monthlyFee}/month` : "Contact for fees",
      addressDisplay: `${school.address?.city || ""}, ${school.address?.state || ""}`.trim(),
      hasImages: school.images && school.images.length > 0,
    }))

    res.json({
      success: true,
      data: {
        schools: enrichedSchools,
        total: enrichedSchools.length,
      },
    })
  } catch (error) {
    console.error("Get featured schools error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured schools",
      error: error.message,
    })
  }
}

// @desc    Search schools with autocomplete suggestions
// @route   GET /api/schools/search/suggestions
// @access  Public
const getSearchSuggestions = async (req, res) => {
  try {
    const { q, type = "all" } = req.query

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
        },
      })
    }

    const suggestions = []

    // School name suggestions
    if (type === "all" || type === "schools") {
      const schoolNames = await School.find({
        isActive: true,
        name: { $regex: q, $options: "i" },
      })
        .select("name")
        .limit(5)
        .lean()

      suggestions.push(
        ...schoolNames.map((school) => ({
          type: "school",
          text: school.name,
          value: school.name,
        })),
      )
    }

    // City suggestions
    if (type === "all" || type === "cities") {
      const cities = await School.aggregate([
        { $match: { isActive: true, "address.city": { $regex: q, $options: "i" } } },
        { $group: { _id: "$address.city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ])

      suggestions.push(
        ...cities.map((city) => ({
          type: "city",
          text: city._id,
          value: city._id,
          count: city.count,
        })),
      )
    }

    // Facility suggestions
    if (type === "all" || type === "facilities") {
      const facilities = await School.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$facilities" },
        { $match: { facilities: { $regex: q, $options: "i" } } },
        { $group: { _id: "$facilities", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ])

      suggestions.push(
        ...facilities.map((facility) => ({
          type: "facility",
          text: facility._id,
          value: facility._id,
          count: facility.count,
        })),
      )
    }

    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 10), // Limit total suggestions
        query: q,
      },
    })
  } catch (error) {
    console.error("Get search suggestions error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch search suggestions",
      error: error.message,
    })
  }
}

module.exports = {
  getAllSchools,
  getSchoolById,
  getNearbySchools,
  getSchoolStats,
  getFeaturedSchools,
  getSearchSuggestions,
}
