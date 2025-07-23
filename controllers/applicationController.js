const Application = require("../models/Application")
const Parent = require("../models/Parent")
const School = require("../models/School")

// @desc    Submit school application
// @route   POST /api/applications
// @access  Private (Parent only)
const submitApplication = async (req, res) => {
  try {
    const { schoolId, childName, childAge, parentName, phoneNumber, emailAddress, emergencyContact, address, notes } =
      req.body

    // Validation
    if (
      !schoolId ||
      !childName ||
      !childAge ||
      !parentName ||
      !phoneNumber ||
      !emailAddress ||
      !emergencyContact ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      })
    }

    // Verify school exists
    const school = await School.findById(schoolId)
    if (!school || !school.isActive) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      })
    }

    // Get parent profile
    const parent = await Parent.findOne({ userId: req.user._id })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    // Check if application already exists
    const existingApplication = await Application.findOne({
      parentId: parent._id,
      schoolId,
      status: { $in: ["pending", "approved"] },
    })

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "Application already submitted for this school",
      })
    }

    // Validate child age
    if (childAge < 0 || childAge > 18) {
      return res.status(400).json({
        success: false,
        message: "Child age must be between 0 and 18",
      })
    }

    // Create application
    const application = new Application({
      parentId: parent._id,
      schoolId,
      childName,
      childAge,
      parentName,
      phoneNumber,
      emailAddress,
      emergencyContact,
      address,
      notes,
    })

    await application.save()

    // Populate school details
    await application.populate("schoolId", "name address contactInfo")

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    })
  } catch (error) {
    console.error("Submit application error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: error.message,
    })
  }
}

// @desc    Get parent's applications
// @route   GET /api/applications/my-applications
// @access  Private (Parent only)
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const parent = await Parent.findOne({ userId: req.user._id })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const query = { parentId: parent._id }
    if (status) {
      query.status = status
    }

    const applications = await Application.find(query)
      .populate("schoolId", "name address contactInfo images rating")
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    const total = await Application.countDocuments(query)

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    console.error("Get my applications error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    })
  }
}

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private (Parent only)
const getApplicationById = async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user._id })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const application = await Application.findOne({
      _id: req.params.id,
      parentId: parent._id,
    }).populate("schoolId")

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      })
    }

    res.json({
      success: true,
      data: application,
    })
  } catch (error) {
    console.error("Get application by ID error:", error)

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID format",
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message,
    })
  }
}

// @desc    Update application (only if pending)
// @route   PUT /api/applications/:id
// @access  Private (Parent only)
const updateApplication = async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user._id })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const application = await Application.findOne({
      _id: req.params.id,
      parentId: parent._id,
      status: "pending",
    })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found or cannot be modified",
      })
    }

    const allowedUpdates = [
      "childName",
      "childAge",
      "parentName",
      "phoneNumber",
      "emailAddress",
      "emergencyContact",
      "address",
      "notes",
    ]

    // Validate child age if provided
    if (req.body.childAge && (req.body.childAge < 0 || req.body.childAge > 18)) {
      return res.status(400).json({
        success: false,
        message: "Child age must be between 0 and 18",
      })
    }

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        application[field] = req.body[field]
      }
    })

    await application.save()

    // Populate school details
    await application.populate("schoolId", "name address contactInfo")

    res.json({
      success: true,
      message: "Application updated successfully",
      data: application,
    })
  } catch (error) {
    console.error("Update application error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update application",
      error: error.message,
    })
  }
}

// @desc    Cancel application
// @route   DELETE /api/applications/:id
// @access  Private (Parent only)
const cancelApplication = async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user._id })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const application = await Application.findOne({
      _id: req.params.id,
      parentId: parent._id,
      status: "pending",
    })

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found or cannot be cancelled",
      })
    }

    await Application.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Application cancelled successfully",
    })
  } catch (error) {
    console.error("Cancel application error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel application",
      error: error.message,
    })
  }
}

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Private (Parent only)
const getApplicationStats = async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user._id })
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const stats = await Application.aggregate([
      { $match: { parentId: parent._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    const totalApplications = await Application.countDocuments({ parentId: parent._id })

    const formattedStats = {
      total: totalApplications,
      pending: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0,
    }

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count
    })

    res.json({
      success: true,
      data: formattedStats,
    })
  } catch (error) {
    console.error("Get application stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch application statistics",
      error: error.message,
    })
  }
}

module.exports = {
  submitApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  cancelApplication,
  getApplicationStats,
}
