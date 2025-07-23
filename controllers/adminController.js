const User = require("../models/User")
const Parent = require("../models/Parent")
const TeacherProfile = require("../models/TeacherProfile")
const School = require("../models/School")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const emailService = require("../services/emailService")

// Generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString("hex")
}

/**
 * ===========================================
 * 🏫 SCHOOL CREATION APIS - ADMIN DASHBOARD
 * ===========================================
 * These APIs handle school creation and management by admin
 */

// @desc    Create School
// @route   POST /api/admin/create-school
// @access  Private (Admin only)
const createSchool = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      location,
      contactInfo,
      images,
      facilities,
      ageGroups,
      fees,
      timings,
      principalName,
      establishedYear,
      affiliation,
      curriculum,
    } = req.body

    // Validation
    if (!name || !description || !address || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: "Name, description, address, and contact info are required",
      })
    }

    // Validate required address fields
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      return res.status(400).json({
        success: false,
        message: "Complete address (street, city, state, zipCode) is required",
      })
    }

    // Validate contact info
    if (!contactInfo.phone || !contactInfo.email) {
      return res.status(400).json({
        success: false,
        message: "Phone and email are required in contact info",
      })
    }

    // Check if school already exists in the same city
    const existingSchool = await School.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      "address.city": { $regex: new RegExp(`^${address.city}$`, "i") },
    })

    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: "School with this name already exists in this city",
      })
    }

    // Create school
    const school = new School({
      name: name.trim(),
      description: description.trim(),
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode.trim(),
        country: address.country || "India",
      },
      location: location || {
        type: "Point",
        coordinates: [0, 0], // Default coordinates - should be updated with actual location
      },
      contactInfo: {
        phone: contactInfo.phone.trim(),
        email: contactInfo.email.toLowerCase().trim(),
        website: contactInfo.website?.trim() || "",
      },
      images: images || [],
      facilities: facilities || [],
      ageGroups: ageGroups || [
        { name: "Nursery", minAge: 2, maxAge: 3 },
        { name: "LKG", minAge: 3, maxAge: 4 },
        { name: "UKG", minAge: 4, maxAge: 5 },
      ],
      fees: {
        admissionFee: fees?.admissionFee || 0,
        monthlyFee: fees?.monthlyFee || 0,
        annualFee: fees?.annualFee || 0,
      },
      timings: {
        openTime: timings?.openTime || "08:00",
        closeTime: timings?.closeTime || "17:00",
        workingDays: timings?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      principalName: principalName?.trim() || "",
      establishedYear: establishedYear || new Date().getFullYear(),
      affiliation: affiliation?.trim() || "",
      curriculum: curriculum || [],
      isActive: true,
      createdBy: req.user._id,
    })

    await school.save()

    res.status(201).json({
      success: true,
      message: "School created successfully",
      data: {
        id: school._id,
        name: school.name,
        description: school.description,
        address: school.address,
        contactInfo: school.contactInfo,
        facilities: school.facilities,
        ageGroups: school.ageGroups,
        fees: school.fees,
        timings: school.timings,
        principalName: school.principalName,
        establishedYear: school.establishedYear,
        affiliation: school.affiliation,
        curriculum: school.curriculum,
        isActive: school.isActive,
        createdAt: school.createdAt,
      },
    })
  } catch (error) {
    console.error("Create school error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create school",
      error: error.message,
    })
  }
}

// @desc    Update School
// @route   PUT /api/admin/schools/:schoolId
// @access  Private (Admin only)
const updateSchool = async (req, res) => {
  try {
    const { schoolId } = req.params
    const updateData = req.body

    const school = await School.findById(schoolId)
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      })
    }

    // Update school with provided data
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        school[key] = updateData[key]
      }
    })

    school.updatedBy = req.user._id
    await school.save()

    res.json({
      success: true,
      message: "School updated successfully",
      data: school,
    })
  } catch (error) {
    console.error("Update school error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update school",
      error: error.message,
    })
  }
}

// @desc    Delete School
// @route   DELETE /api/admin/schools/:schoolId
// @access  Private (Admin only)
const deleteSchool = async (req, res) => {
  try {
    const { schoolId } = req.params

    const school = await School.findById(schoolId)
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      })
    }

    // Soft delete - mark as inactive instead of removing
    school.isActive = false
    school.deletedBy = req.user._id
    school.deletedAt = new Date()
    await school.save()

    res.json({
      success: true,
      message: "School deleted successfully",
    })
  } catch (error) {
    console.error("Delete school error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete school",
      error: error.message,
    })
  }
}

// @desc    Get All Schools (Admin View)
// @route   GET /api/admin/schools
// @access  Private (Admin only)
const getAllSchoolsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city, status = "all" } = req.query

    const query = {}

    // Filter by status
    if (status === "active") {
      query.isActive = true
    } else if (status === "inactive") {
      query.isActive = false
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { principalName: { $regex: search, $options: "i" } },
      ]
    }

    // Filter by city
    if (city) {
      query["address.city"] = { $regex: city, $options: "i" }
    }

    const schools = await School.find(query)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    const total = await School.countDocuments(query)

    res.json({
      success: true,
      data: {
        schools,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    console.error("Get all schools admin error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch schools",
      error: error.message,
    })
  }
}

// @desc    Bulk Create Schools
// @route   POST /api/admin/bulk-create-schools
// @access  Private (Admin only)
const bulkCreateSchools = async (req, res) => {
  try {
    const { schools } = req.body

    if (!schools || !Array.isArray(schools) || schools.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Schools array is required and must not be empty",
      })
    }

    const results = []
    const errors = []

    for (const schoolData of schools) {
      try {
        const { name, description, address, contactInfo } = schoolData

        // Skip if required fields missing
        if (!name || !description || !address || !contactInfo) {
          errors.push({
            name: name || "unknown",
            error: "Missing required fields (name, description, address, contactInfo)",
          })
          continue
        }

        // Check if school already exists
        const existingSchool = await School.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
          "address.city": { $regex: new RegExp(`^${address.city}$`, "i") },
        })

        if (existingSchool) {
          errors.push({
            name,
            error: "School already exists in this city",
          })
          continue
        }

        // Create school
        const school = new School({
          ...schoolData,
          isActive: true,
          createdBy: req.user._id,
        })

        await school.save()

        results.push({
          id: school._id,
          name: school.name,
          city: school.address.city,
          contactEmail: school.contactInfo.email,
        })
      } catch (error) {
        errors.push({
          name: schoolData.name || "unknown",
          error: error.message,
        })
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk school creation completed. ${results.length} successful, ${errors.length} failed.`,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: schools.length,
          successful: results.length,
          failed: errors.length,
        },
      },
    })
  } catch (error) {
    console.error("Bulk create schools error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to bulk create schools",
      error: error.message,
    })
  }
}

// @desc    Create Parent Account
// @route   POST /api/admin/create-parent
// @access  Private (Admin only)
const createParentAccount = async (req, res) => {
  try {
    const { email, firstName, lastName, phoneNumber, schoolName, sendEmail = true, children } = req.body

    // Validation
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Email, first name, and last name are required",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Generate temporary password
    const temporaryPassword = generateRandomPassword()

    // Create user
    const user = new User({
      email,
      password: temporaryPassword,
      firstName,
      lastName,
      phoneNumber,
      role: "parent",
      createdBy: req.user._id,
      isFirstLogin: true,
      temporaryPassword: temporaryPassword,
      accountStatus: "active",
      isActive: true,
    })

    await user.save()

    // Create parent profile
    const parent = new Parent({
      userId: user._id,
      children: children || [],
    })

    await parent.save()

    // Send welcome email with credentials
    let emailResult = null
    if (sendEmail) {
      emailResult = await emailService.sendParentWelcomeEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        temporaryPassword: temporaryPassword,
        schoolName: schoolName || "School Management System",
      })
    }

    const responseData = {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountStatus: user.accountStatus,
        isFirstLogin: user.isFirstLogin,
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

    res.status(201).json({
      success: true,
      message: `Parent account created successfully${emailResult?.success ? " and welcome email sent" : ""}`,
      data: responseData,
    })
  } catch (error) {
    console.error("Create parent account error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create parent account",
      error: error.message,
    })
  }
}

// @desc    Create Teacher Account
// @route   POST /api/admin/create-teacher
// @access  Private (Admin only)
const createTeacherAccount = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phoneNumber,
      schoolId,
      subjects,
      employeeId,
      bio,
      qualifications,
      experience,
      schoolName,
      sendEmail = true,
    } = req.body

    // Validation
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Email, first name, and last name are required",
      })
    }

    // Verify school exists if schoolId provided
    if (schoolId) {
      const school = await School.findById(schoolId)
      if (!school) {
        return res.status(404).json({
          success: false,
          message: "School not found",
        })
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Generate temporary password
    const temporaryPassword = generateRandomPassword()

    // Create user
    const user = new User({
      email,
      password: temporaryPassword,
      firstName,
      lastName,
      phoneNumber,
      role: "teacher",
      createdBy: req.user._id,
      isFirstLogin: true,
      temporaryPassword: temporaryPassword,
      accountStatus: "active",
      isActive: true,
    })

    await user.save()

    // Create teacher profile
    const teacher = new TeacherProfile({
      userId: user._id,
      schoolId: schoolId || null,
      employeeId,
      subjects: subjects || [],
      bio,
      qualifications: qualifications || [],
      experience: experience || { totalYears: 0, specialization: [] },
    })

    await teacher.save()

    // Send welcome email with credentials
    let emailResult = null
    if (sendEmail) {
      emailResult = await emailService.sendTeacherWelcomeEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        temporaryPassword: temporaryPassword,
        schoolName: schoolName || "School Management System",
        subject: subjects?.[0]?.name,
        employeeId,
      })
    }

    const responseData = {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountStatus: user.accountStatus,
        isFirstLogin: user.isFirstLogin,
      },
      teacher: {
        id: teacher._id,
        schoolId,
        employeeId,
        subjects,
        subjectsCount: subjects?.length || 0,
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

    res.status(201).json({
      success: true,
      message: `Teacher account created successfully${emailResult?.success ? " and welcome email sent" : ""}`,
      data: responseData,
    })
  } catch (error) {
    console.error("Create teacher account error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create teacher account",
      error: error.message,
    })
  }
}

// @desc    Get all users (parents and teachers)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10, search } = req.query

    const query = { role: { $in: ["parent", "teacher"] } }

    // Filter by role
    if (role && ["parent", "teacher"].includes(role)) {
      query.role = role
    }

    // Filter by account status
    if (status) {
      query.accountStatus = status
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    const users = await User.find(query)
      .select("-password -temporaryPassword")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: Number.parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    })
  }
}

// @desc    Update user status
// @route   PUT /api/admin/users/:userId/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params
    const { accountStatus, isActive, reason, sendEmail = true } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Don't allow modifying admin accounts
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot modify admin accounts",
      })
    }

    const oldStatus = user.accountStatus

    // Update status
    if (accountStatus) user.accountStatus = accountStatus
    if (typeof isActive === "boolean") user.isActive = isActive

    await user.save()

    // Send status update email if status changed
    let emailResult = null
    if (sendEmail && accountStatus && accountStatus !== oldStatus) {
      emailResult = await emailService.sendAccountStatusEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountStatus,
        reason,
      })
    }

    res.json({
      success: true,
      message: `User status updated successfully${emailResult?.success ? " and notification email sent" : ""}`,
      data: {
        id: user._id,
        email: user.email,
        accountStatus: user.accountStatus,
        isActive: user.isActive,
        emailSent: emailResult?.success || false,
      },
    })
  } catch (error) {
    console.error("Update user status error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    })
  }
}

// @desc    Reset user password
// @route   POST /api/admin/users/:userId/reset-password
// @access  Private (Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params
    const { sendEmail = true } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Don't allow resetting admin passwords
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot reset admin passwords",
      })
    }

    // Generate new temporary password
    const newTemporaryPassword = generateRandomPassword()

    user.password = newTemporaryPassword
    user.temporaryPassword = newTemporaryPassword
    user.isFirstLogin = true

    await user.save()

    // Send password reset email
    let emailResult = null
    if (sendEmail) {
      emailResult = await emailService.sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        temporaryPassword: newTemporaryPassword,
      })
    }

    const responseData = {
      message: `Password reset successfully${emailResult?.success ? " and email sent to user" : ""}`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      emailSent: emailResult?.success || false,
    }

    // Include credentials in response for development
    if (process.env.NODE_ENV === "development") {
      responseData.credentials = {
        email: user.email,
        temporaryPassword: newTemporaryPassword,
        message: "User must change password on first login",
      }
    }

    res.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error("Reset user password error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to reset user password",
      error: error.message,
    })
  }
}

// @desc    Delete user account
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin only)
const deleteUserAccount = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Don't allow deleting admin accounts
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin accounts",
      })
    }

    // Delete associated profile
    if (user.role === "parent") {
      await Parent.findOneAndDelete({ userId: user._id })
    } else if (user.role === "teacher") {
      await TeacherProfile.findOneAndDelete({ userId: user._id })
    }

    // Delete user
    await User.findByIdAndDelete(userId)

    res.json({
      success: true,
      message: "User account deleted successfully",
    })
  } catch (error) {
    console.error("Delete user account error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete user account",
      error: error.message,
    })
  }
}

// @desc    Get user statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getUserStats = async (req, res) => {
  try {
    const totalParents = await User.countDocuments({ role: "parent" })
    const totalTeachers = await User.countDocuments({ role: "teacher" })
    const totalSchools = await School.countDocuments({ isActive: true })
    const activeUsers = await User.countDocuments({ isActive: true, role: { $in: ["parent", "teacher"] } })
    const pendingUsers = await User.countDocuments({ accountStatus: "pending" })
    const firstTimeUsers = await User.countDocuments({ isFirstLogin: true })

    const statusBreakdown = await User.aggregate([
      { $match: { role: { $in: ["parent", "teacher"] } } },
      { $group: { _id: "$accountStatus", count: { $sum: 1 } } },
    ])

    const roleBreakdown = await User.aggregate([
      { $match: { role: { $in: ["parent", "teacher"] } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ])

    const schoolsByCity = await School.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$address.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    res.json({
      success: true,
      data: {
        overview: {
          totalParents,
          totalTeachers,
          totalSchools,
          activeUsers,
          pendingUsers,
          firstTimeUsers,
        },
        statusBreakdown,
        roleBreakdown,
        schoolsByCity,
      },
    })
  } catch (error) {
    console.error("Get user stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
      error: error.message,
    })
  }
}

// @desc    Send bulk email to users
// @route   POST /api/admin/send-bulk-email
// @access  Private (Admin only)
const sendBulkEmail = async (req, res) => {
  try {
    const { recipients, subject, content, role } = req.body

    // Validation
    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Subject and content are required",
      })
    }

    let targetUsers = []

    if (recipients && recipients.length > 0) {
      // Send to specific recipients
      targetUsers = await User.find({
        _id: { $in: recipients },
        role: { $in: ["parent", "teacher"] },
        isActive: true,
      }).select("email firstName lastName")
    } else if (role) {
      // Send to all users of specific role
      targetUsers = await User.find({
        role: role,
        isActive: true,
      }).select("email firstName lastName")
    } else {
      return res.status(400).json({
        success: false,
        message: "Please specify recipients or role",
      })
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid recipients found",
      })
    }

    // Send bulk email
    const emailResult = await emailService.sendBulkEmail(targetUsers, subject, content)

    res.json({
      success: true,
      message: `Bulk email sent to ${targetUsers.length} recipients`,
      data: {
        totalRecipients: targetUsers.length,
        results: emailResult.results,
      },
    })
  } catch (error) {
    console.error("Send bulk email error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send bulk email",
      error: error.message,
    })
  }
}

module.exports = {
  createSchool,
  updateSchool,
  deleteSchool,
  getAllSchoolsAdmin,
  bulkCreateSchools,
  createParentAccount,
  createTeacherAccount,
  getAllUsers,
  updateUserStatus,
  resetUserPassword,
  deleteUserAccount,
  getUserStats,
  sendBulkEmail,
}
