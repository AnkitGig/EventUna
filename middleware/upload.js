const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Create uploads directory if it doesn't exist
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Storage configuration for different file types
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "..", "uploads", destination)
      createUploadDir(uploadPath)
      cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
      const extension = path.extname(file.originalname)
      const filename = file.fieldname + "-" + uniqueSuffix + extension
      cb(null, filename)
    },
  })
}

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error("Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!"), false)
  }
}

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype =
    allowedTypes.test(file.mimetype) ||
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error("Only document files (PDF, DOC, DOCX, TXT) are allowed!"), false)
  }
}

// Profile image upload (single file)
const uploadProfileImage = multer({
  storage: createStorage("profiles"),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
}).single("profileImage")

// Child profile image upload
const uploadChildImage = multer({
  storage: createStorage("children"),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
}).single("childImage")

// School images upload (multiple files)
const uploadSchoolImages = multer({
  storage: createStorage("schools"),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10, // Maximum 10 files
  },
  fileFilter: imageFilter,
}).array("schoolImages", 10)

// Document upload for applications
const uploadDocuments = multer({
  storage: createStorage("documents"),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files
  },
  fileFilter: documentFilter,
}).array("documents", 5)

// Gallery images upload
const uploadGalleryImages = multer({
  storage: createStorage("gallery"),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 20, // Maximum 20 files
  },
  fileFilter: imageFilter,
}).array("galleryImages", 20)

// Generic file upload middleware with error handling
const handleUploadError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size allowed is 10MB.",
          })
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            message: "Too many files. Maximum allowed files exceeded.",
          })
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: "Unexpected field name for file upload.",
          })
        }
        return res.status(400).json({
          success: false,
          message: "File upload error: " + err.message,
        })
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        })
      }
      next()
    })
  }
}

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (error) {
    console.error("Error deleting file:", error)
    return false
  }
}

// Helper function to get file URL
const getFileUrl = (req, filename, folder) => {
  if (!filename) return null
  return `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}`
}

module.exports = {
  uploadProfileImage: handleUploadError(uploadProfileImage),
  uploadChildImage: handleUploadError(uploadChildImage),
  uploadSchoolImages: handleUploadError(uploadSchoolImages),
  uploadDocuments: handleUploadError(uploadDocuments),
  uploadGalleryImages: handleUploadError(uploadGalleryImages),
  deleteFile,
  getFileUrl,
}
