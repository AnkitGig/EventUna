const TeacherProfile = require("../models/TeacherProfile")
const User = require("../models/User")

// @desc    Get teacher profile
// @route   GET /api/teachers/profile
// @access  Private (Teacher only)
const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await TeacherProfile.findOne({ userId: req.user._id })
      .populate("userId", "-password")
      .populate("schoolId", "name address contactInfo")

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    res.json({
      success: true,
      data: teacher,
    })
  } catch (error) {
    console.error("Get teacher profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher profile",
      error: error.message,
    })
  }
}

// @desc    Update teacher profile
// @route   PUT /api/teachers/profile
// @access  Private (Teacher only)
const updateTeacherProfile = async (req, res) => {
  try {
    const { subjects, qualifications, experience, availability, contactPreferences, bio, isAvailableForNewChats } =
      req.body

    const teacher = await TeacherProfile.findOne({ userId: req.user._id })

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    // Update fields
    if (subjects) teacher.subjects = subjects
    if (qualifications) teacher.qualifications = qualifications
    if (experience) teacher.experience = { ...teacher.experience, ...experience }
    if (availability) teacher.availability = { ...teacher.availability, ...availability }
    if (contactPreferences) teacher.contactPreferences = { ...teacher.contactPreferences, ...contactPreferences }
    if (bio) teacher.bio = bio
    if (typeof isAvailableForNewChats === "boolean") teacher.isAvailableForNewChats = isAvailableForNewChats

    await teacher.save()

    // Populate the updated teacher
    await teacher.populate("userId", "-password")
    await teacher.populate("schoolId", "name address contactInfo")

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: teacher,
    })
  } catch (error) {
    console.error("Update teacher profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    })
  }
}

// @desc    Update availability status
// @route   PUT /api/teachers/availability
// @access  Private (Teacher only)
const updateAvailability = async (req, res) => {
  try {
    const { availableForChat, availableForCalls, isAvailableForNewChats } = req.body

    const teacher = await TeacherProfile.findOne({ userId: req.user._id })

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    // Update availability
    if (typeof availableForChat === "boolean") teacher.availability.availableForChat = availableForChat
    if (typeof availableForCalls === "boolean") teacher.availability.availableForCalls = availableForCalls
    if (typeof isAvailableForNewChats === "boolean") teacher.isAvailableForNewChats = isAvailableForNewChats

    await teacher.save()

    res.json({
      success: true,
      message: "Availability updated successfully",
      data: {
        availability: teacher.availability,
        isAvailableForNewChats: teacher.isAvailableForNewChats,
      },
    })
  } catch (error) {
    console.error("Update availability error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update availability",
      error: error.message,
    })
  }
}

module.exports = {
  getTeacherProfile,
  updateTeacherProfile,
  updateAvailability,
}
