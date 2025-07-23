const path = require("path")
const fs = require("fs")
const { deleteFile, getFileUrl } = require("../middleware/upload")

// @desc    Upload profile image
// @route   POST /api/upload/profile
// @access  Private
const uploadProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const fileUrl = getFileUrl(req, req.file.filename, "profiles")

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path,
      },
    })
  } catch (error) {
    console.error("Upload profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload profile image",
      error: error.message,
    })
  }
}

// @desc    Upload child image
// @route   POST /api/upload/child
// @access  Private
const uploadChild = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const fileUrl = getFileUrl(req, req.file.filename, "children")

    res.json({
      success: true,
      message: "Child image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
        path: req.file.path,
      },
    })
  } catch (error) {
    console.error("Upload child image error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload child image",
      error: error.message,
    })
  }
}

// @desc    Upload school images
// @route   POST /api/upload/school
// @access  Private (Admin only)
const uploadSchool = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      })
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: getFileUrl(req, file.filename, "schools"),
      path: file.path,
    }))

    res.json({
      success: true,
      message: `${req.files.length} school images uploaded successfully`,
      data: uploadedFiles,
    })
  } catch (error) {
    console.error("Upload school images error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload school images",
      error: error.message,
    })
  }
}

// @desc    Upload documents
// @route   POST /api/upload/documents
// @access  Private
const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      })
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: getFileUrl(req, file.filename, "documents"),
      path: file.path,
      type: path.extname(file.originalname).toLowerCase(),
    }))

    res.json({
      success: true,
      message: `${req.files.length} documents uploaded successfully`,
      data: uploadedFiles,
    })
  } catch (error) {
    console.error("Upload documents error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload documents",
      error: error.message,
    })
  }
}

// @desc    Upload gallery images
// @route   POST /api/upload/gallery
// @access  Private
const uploadGallery = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      })
    }

    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: getFileUrl(req, file.filename, "gallery"),
      path: file.path,
    }))

    res.json({
      success: true,
      message: `${req.files.length} gallery images uploaded successfully`,
      data: uploadedFiles,
    })
  } catch (error) {
    console.error("Upload gallery images error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload gallery images",
      error: error.message,
    })
  }
}

// @desc    Delete file
// @route   DELETE /api/upload/:folder/:filename
// @access  Private
const deleteUploadedFile = async (req, res) => {
  try {
    const { folder, filename } = req.params

    if (!folder || !filename) {
      return res.status(400).json({
        success: false,
        message: "Folder and filename are required",
      })
    }

    const filePath = path.join(__dirname, "..", "uploads", folder, filename)
    const deleted = deleteFile(filePath)

    if (deleted) {
      res.json({
        success: true,
        message: "File deleted successfully",
      })
    } else {
      res.status(404).json({
        success: false,
        message: "File not found",
      })
    }
  } catch (error) {
    console.error("Delete file error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
      error: error.message,
    })
  }
}

// @desc    Get file info
// @route   GET /api/upload/info/:folder/:filename
// @access  Public
const getFileInfo = async (req, res) => {
  try {
    const { folder, filename } = req.params

    if (!folder || !filename) {
      return res.status(400).json({
        success: false,
        message: "Folder and filename are required",
      })
    }

    const filePath = path.join(__dirname, "..", "uploads", folder, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      })
    }

    const stats = fs.statSync(filePath)
    const fileUrl = getFileUrl(req, filename, folder)

    res.json({
      success: true,
      data: {
        filename,
        folder,
        size: stats.size,
        url: fileUrl,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      },
    })
  } catch (error) {
    console.error("Get file info error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get file info",
      error: error.message,
    })
  }
}

module.exports = {
  uploadProfile,
  uploadChild,
  uploadSchool,
  uploadDocuments,
  uploadGallery,
  deleteUploadedFile,
  getFileInfo,
}
