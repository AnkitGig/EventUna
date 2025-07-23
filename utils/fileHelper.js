const fs = require("fs")
const path = require("path")

// Create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`Created directory: ${dirPath}`)
  }
}

// Get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase()
}

// Check if file is image
const isImageFile = (filename) => {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
  return imageExtensions.includes(getFileExtension(filename))
}

// Check if file is document
const isDocumentFile = (filename) => {
  const docExtensions = [".pdf", ".doc", ".docx", ".txt"]
  return docExtensions.includes(getFileExtension(filename))
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now()
  const random = Math.round(Math.random() * 1e9)
  const extension = path.extname(originalName)
  const baseName = path.basename(originalName, extension)
  return `${baseName}-${timestamp}-${random}${extension}`
}

// Validate file type
const validateFileType = (file, allowedTypes) => {
  const fileExtension = getFileExtension(file.originalname)
  const mimeType = file.mimetype

  return allowedTypes.some((type) => {
    if (type.startsWith(".")) {
      return fileExtension === type
    }
    return mimeType.includes(type)
  })
}

// Clean up old files (for maintenance)
const cleanupOldFiles = (directory, maxAge = 30) => {
  try {
    const files = fs.readdirSync(directory)
    const now = Date.now()
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000 // Convert days to milliseconds

    files.forEach((file) => {
      const filePath = path.join(directory, file)
      const stats = fs.statSync(filePath)

      if (now - stats.mtime.getTime() > maxAgeMs) {
        fs.unlinkSync(filePath)
        console.log(`Deleted old file: ${file}`)
      }
    })
  } catch (error) {
    console.error("Error cleaning up old files:", error)
  }
}

module.exports = {
  ensureDirectoryExists,
  getFileExtension,
  isImageFile,
  isDocumentFile,
  formatFileSize,
  generateUniqueFilename,
  validateFileType,
  cleanupOldFiles,
}
