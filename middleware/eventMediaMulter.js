const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Function to ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`Created directory: ${dirPath}`)
  }
}

// Storage for event media
const eventMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "./public/event/media/"
    ensureDirectoryExists(uploadPath)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
    const fileExtension = path.extname(file.originalname)
    cb(null, `event-media-${uniqueSuffix}${fileExtension}`)
  },
})

const uploadEventMedia = multer({
  storage: eventMediaStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    files: 10, // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type. Allowed types: JPEG, JPG, PNG, GIF, MP4, MOV, AVI, WEBM"))
    }
  },
})

module.exports = { uploadEventMedia }
