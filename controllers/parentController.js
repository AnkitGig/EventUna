const Parent = require("../models/Parent")
const User = require("../models/User")

// @desc    Get parent profile
// @route   GET /api/parents/profile
// @access  Private (Parent only)
const getParentProfile = async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user._id })
      .populate("userId", "-password")
      .populate("children.schoolId")

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    res.json({
      success: true,
      data: parent,
    })
  } catch (error) {
    console.error("Get parent profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch parent profile",
      error: error.message,
    })
  }
}

// @desc    Update parent profile
// @route   PUT /api/parents/profile
// @access  Private (Parent only)
const updateParentProfile = async (req, res) => {
  try {
    const { emergencyContact, address, occupation, preferences } = req.body

    const parent = await Parent.findOne({ userId: req.user._id })

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    // Update fields
    if (emergencyContact) parent.emergencyContact = emergencyContact
    if (address) parent.address = address
    if (occupation) parent.occupation = occupation
    if (preferences) parent.preferences = { ...parent.preferences, ...preferences }

    await parent.save()

    // Populate the updated parent
    await parent.populate("userId", "-password")
    await parent.populate("children.schoolId")

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: parent,
    })
  } catch (error) {
    console.error("Update parent profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    })
  }
}

// @desc    Add child
// @route   POST /api/parents/children
// @access  Private (Parent only)
const addChild = async (req, res) => {
  try {
    const { name, age, dateOfBirth, gender, profileImage } = req.body

    // Validation
    if (!name || !age) {
      return res.status(400).json({
        success: false,
        message: "Child name and age are required",
      })
    }

    if (age < 0 || age > 18) {
      return res.status(400).json({
        success: false,
        message: "Child age must be between 0 and 18",
      })
    }

    const parent = await Parent.findOne({ userId: req.user._id })

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const newChild = {
      name,
      age,
      dateOfBirth,
      gender,
      profileImage: profileImage || null, // Can be uploaded separately via upload endpoint
    }

    parent.children.push(newChild)
    await parent.save()

    const addedChild = parent.children[parent.children.length - 1]

    res.status(201).json({
      success: true,
      message: "Child added successfully",
      data: addedChild,
    })
  } catch (error) {
    console.error("Add child error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add child",
      error: error.message,
    })
  }
}

// @desc    Update child
// @route   PUT /api/parents/children/:childId
// @access  Private (Parent only)
const updateChild = async (req, res) => {
  try {
    const { childId } = req.params
    const updates = req.body

    const parent = await Parent.findOne({ userId: req.user._id })

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const child = parent.children.id(childId)
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      })
    }

    // Validate age if provided
    if (updates.age && (updates.age < 0 || updates.age > 18)) {
      return res.status(400).json({
        success: false,
        message: "Child age must be between 0 and 18",
      })
    }

    // Update child fields
    const allowedFields = [
      "name",
      "age",
      "dateOfBirth",
      "gender",
      "schoolId",
      "class",
      "section",
      "rollNumber",
      "profileImage",
    ]

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        child[field] = updates[field]
      }
    })

    await parent.save()

    res.json({
      success: true,
      message: "Child updated successfully",
      data: child,
    })
  } catch (error) {
    console.error("Update child error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update child",
      error: error.message,
    })
  }
}

// @desc    Update child with image
// @route   PUT /api/parents/children/:childId
// @access  Private (Parent only)
const updateChildWithImage = async (req, res) => {
  try {
    const { childId } = req.params
    const updates = req.body

    const parent = await Parent.findOne({ userId: req.user._id })

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const child = parent.children.id(childId)
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      })
    }

    // Validate age if provided
    if (updates.age && (updates.age < 0 || updates.age > 18)) {
      return res.status(400).json({
        success: false,
        message: "Child age must be between 0 and 18",
      })
    }

    // Handle image upload if file is provided
    if (req.file) {
      // Delete old image if exists
      if (child.profileImage) {
        const { deleteFile } = require("../middleware/upload")
        const path = require("path")
        const oldImagePath = path.join(__dirname, "..", "uploads", "children", path.basename(child.profileImage))
        deleteFile(oldImagePath)
      }

      const { getFileUrl } = require("../middleware/upload")
      updates.profileImage = getFileUrl(req, req.file.filename, "children")
    }

    // Update child fields
    const allowedFields = [
      "name",
      "age",
      "dateOfBirth",
      "gender",
      "schoolId",
      "class",
      "section",
      "rollNumber",
      "profileImage",
    ]

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        child[field] = updates[field]
      }
    })

    await parent.save()

    res.json({
      success: true,
      message: "Child updated successfully",
      data: child,
    })
  } catch (error) {
    console.error("Update child error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update child",
      error: error.message,
    })
  }
}

// @desc    Delete child
// @route   DELETE /api/parents/children/:childId
// @access  Private (Parent only)
const deleteChild = async (req, res) => {
  try {
    const { childId } = req.params

    const parent = await Parent.findOne({ userId: req.user._id })

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    const child = parent.children.id(childId)
    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      })
    }

    parent.children.id(childId).remove()
    await parent.save()

    res.json({
      success: true,
      message: "Child removed successfully",
    })
  } catch (error) {
    console.error("Delete child error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to remove child",
      error: error.message,
    })
  }
}

// @desc    Get children list
// @route   GET /api/parents/children
// @access  Private (Parent only)
const getChildren = async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user._id }).populate("children.schoolId")

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      })
    }

    res.json({
      success: true,
      data: parent.children,
    })
  } catch (error) {
    console.error("Get children error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch children",
      error: error.message,
    })
  }
}

module.exports = {
  getParentProfile,
  updateParentProfile,
  addChild,
  updateChild,
  updateChildWithImage,
  deleteChild,
  getChildren,
}
