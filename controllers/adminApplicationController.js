const PublicApplication = require("../models/PublicApplication")
const User = require("../models/User")
const Parent = require("../models/Parent")
const School = require("../models/School")
const emailService = require("../services/emailService")
const crypto = require("crypto")

// Generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString("hex")
}

/**
 * ===========================================
 * 👨‍💼 ADMIN APPLICATION MANAGEMENT APIS
 * ===========================================
 * These APIs handle admin review and processing of public applications
 */

// @desc    Get all public applications for admin review
// @route   GET /api/admin/applications
// @access  Private (Admin only)
const getAllApplications = async (req, res) => {
  try {
    const { status, schoolId, page = 1, limit = 10, search, sortBy = "submittedAt", sortOrder = "desc" } = req.query

    const query = {}

    // Filter by status
    if (status) {
      query.status = status
    }

    // Filter by school
    if (schoolId) {
      query.schoolId = schoolId
    }

    // Search by parent name, child name, or email
    if (search) {
      query.$or = [
        { parentName: { $regex: search, $options: "i" } },
        { childName: { $regex: search, $options: "i" } },
        { emailAddress: { $regex: search, $options: "i" } },
      ]
    }

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    const applications = await PublicApplication.find(query)
      .populate("schoolId", "name address contactInfo images")
      .populate("reviewedBy", "firstName lastName email")
      .populate("parentUserId", "firstName lastName email accountStatus")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    const total = await PublicApplication.countDocuments(query)

    // Get statistics
    const stats = await PublicApplication.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])

    const statusStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      account_created: 0,
    }

    stats.forEach((stat) => {
      statusStats[stat._id] = stat.count
    })

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        statistics: statusStats,
        filters: {
          status: status || "all",
          schoolId: schoolId || "all",
          search: search || "",
          sortBy,
          sortOrder,
        },
      },
    })
  } catch (error) {
    console.error("Get all applications error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    })
  }
}

// @desc    Get application by ID for admin review
// @route   GET /api/admin/applications/:applicationId
// @access  Private (Admin only)
const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params

    const application = await PublicApplication.findById(applicationId)
      .populate("schoolId")
      .populate("reviewedBy", "firstName lastName email")
      .populate("parentUserId", "firstName lastName email accountStatus isActive")

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
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message,
    })
  }
}

// @desc    Approve application and create parent account
// @route   POST /api/admin/applications/:applicationId/approve
// @access  Private (Admin only)
const approveApplicationAndCreateAccount = async (req, res) => {
  try {
    const { applicationId } = req.params
    const { reviewNotes, sendEmail = true, schoolName } = req.body

    const application = await PublicApplication.findById(applicationId).populate("schoolId", "name")

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      })
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Application has already been processed",
      })
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: application.emailAddress })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User account already exists with this email address",
        existingUser: {
          id: existingUser._id,
          email: existingUser.email,
          role: existingUser.role,
          accountStatus: existingUser.accountStatus,
        },
      })
    }

    // Generate temporary password
    const temporaryPassword = generateRandomPassword()

    // Extract first and last name from parent name
    const nameParts = application.parentName.trim().split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || firstName

    // Create user account
    const user = new User({
      email: application.emailAddress,
      password: temporaryPassword,
      firstName,
      lastName,
      phoneNumber: application.phoneNumber,
      role: "parent",
      createdBy: req.user._id,
      isFirstLogin: true,
      temporaryPassword: temporaryPassword,
      accountStatus: "active",
      isActive: true,
    })

    await user.save()

    // Create parent profile with child information
    const parent = new Parent({
      userId: user._id,
      children: [
        {
          name: application.childName,
          age: application.childAge,
          // Add more child details if needed
        },
      ],
      emergencyContact: {
        name: "Emergency Contact",
        phoneNumber: application.emergencyContact,
      },
      address: {
        street: application.address,
        // Parse address if needed
      },
    })

    await parent.save()

    // Update application status
    application.status = "account_created"
    application.reviewedBy = req.user._id
    application.reviewedAt = new Date()
    application.reviewNotes = reviewNotes || "Application approved and account created"
    application.parentAccountCreated = true
    application.parentUserId = user._id
    application.accountCreatedAt = new Date()

    await application.save()

    // Send welcome email with credentials
    let emailResult = null
    if (sendEmail) {
      emailResult = await emailService.sendParentWelcomeEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        temporaryPassword: temporaryPassword,
        schoolName: schoolName || application.schoolId.name,
        applicationId: application._id,
      })
    }

    const responseData = {
      application: {
        id: application._id,
        status: application.status,
        reviewedAt: application.reviewedAt,
        accountCreated: true,
      },
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountStatus: user.accountStatus,
      },
      parent: {
        id: parent._id,
        childrenCount: parent.children.length,
      },
      emailSent: emailResult?.success || false,
    }

    // Include credentials in response for development
    if (process.env.NODE_ENV === "development") {
      responseData.credentials = {
        email: user.email,
        temporaryPassword: temporaryPassword,
        message: "User must change password on first login",
      }
    }

    res.json({
      success: true,
      message: `Application approved and parent account created successfully${emailResult?.success ? ". Welcome email sent." : ""}`,
      data: responseData,
    })
  } catch (error) {
    console.error("Approve application error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to approve application and create account",
      error: error.message,
    })
  }
}

// @desc    Reject application
// @route   POST /api/admin/applications/:applicationId/reject
// @access  Private (Admin only)
const rejectApplication = async (req, res) => {
  try {
    const { applicationId } = req.params
    const { reviewNotes, sendEmail = true } = req.body

    const application = await PublicApplication.findById(applicationId).populate("schoolId", "name")

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      })
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Application has already been processed",
      })
    }

    // Update application status
    application.status = "rejected"
    application.reviewedBy = req.user._id
    application.reviewedAt = new Date()
    application.reviewNotes = reviewNotes || "Application rejected"

    await application.save()

    // Send rejection email
    let emailResult = null
    if (sendEmail) {
      emailResult = await emailService.sendApplicationRejectionEmail({
        email: application.emailAddress,
        parentName: application.parentName,
        childName: application.childName,
        schoolName: application.schoolId.name,
        reason: reviewNotes,
      })
    }

    res.json({
      success: true,
      message: `Application rejected${emailResult?.success ? " and notification email sent" : ""}`,
      data: {
        application: {
          id: application._id,
          status: application.status,
          reviewedAt: application.reviewedAt,
          reviewNotes: application.reviewNotes,
        },
        emailSent: emailResult?.success || false,
      },
    })
  } catch (error) {
    console.error("Reject application error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to reject application",
      error: error.message,
    })
  }
}

// @desc    Get application statistics for admin dashboard
// @route   GET /api/admin/applications/stats
// @access  Private (Admin only)
const getApplicationStats = async (req, res) => {
  try {
    const { timeframe = "all" } = req.query

    let dateFilter = {}
    const now = new Date()

    switch (timeframe) {
      case "today":
        dateFilter = {
          submittedAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        }
        break
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { submittedAt: { $gte: weekAgo } }
        break
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        dateFilter = { submittedAt: { $gte: monthAgo } }
        break
    }

    // Overall statistics
    const totalApplications = await PublicApplication.countDocuments(dateFilter)
    const pendingApplications = await PublicApplication.countDocuments({ ...dateFilter, status: "pending" })
    const approvedApplications = await PublicApplication.countDocuments({ ...dateFilter, status: "approved" })
    const rejectedApplications = await PublicApplication.countDocuments({ ...dateFilter, status: "rejected" })
    const accountsCreated = await PublicApplication.countDocuments({ ...dateFilter, status: "account_created" })

    // Applications by school
    const applicationsBySchool = await PublicApplication.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "schools",
          localField: "schoolId",
          foreignField: "_id",
          as: "school",
        },
      },
      { $unwind: "$school" },
      {
        $group: {
          _id: "$schoolId",
          schoolName: { $first: "$school.name" },
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
          accountsCreated: { $sum: { $cond: [{ $eq: ["$status", "account_created"] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    // Daily applications trend (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dailyTrend = await PublicApplication.aggregate([
      { $match: { submittedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$submittedAt" },
            month: { $month: "$submittedAt" },
            day: { $dayOfMonth: "$submittedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ])

    res.json({
      success: true,
      data: {
        overview: {
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
          accountsCreated,
          approvalRate:
            totalApplications > 0
              ? (((approvedApplications + accountsCreated) / totalApplications) * 100).toFixed(1)
              : 0,
        },
        applicationsBySchool,
        dailyTrend,
        timeframe,
      },
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
  getAllApplications,
  getApplicationById,
  approveApplicationAndCreateAccount,
  rejectApplication,
  getApplicationStats,
}
