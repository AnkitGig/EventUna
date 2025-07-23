const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const {
  uploadProfileImage,
  uploadChildImage,
  uploadSchoolImages,
  uploadDocuments,
  uploadGalleryImages,
} = require("../middleware/upload")
const {
  uploadProfile,
  uploadChild,
  uploadSchool,
  uploadDocuments: uploadDocsController,
  uploadGallery,
  deleteUploadedFile,
  getFileInfo,
} = require("../controllers/uploadController")

const router = express.Router()

// Profile image upload
router.post("/profile", auth, uploadProfileImage, uploadProfile)

// Child image upload
router.post("/child", auth, authorize("parent"), uploadChildImage, uploadChild)

// School images upload (Admin only)
router.post("/school", auth, authorize("admin"), uploadSchoolImages, uploadSchool)

// Documents upload
router.post("/documents", auth, uploadDocuments, uploadDocsController)

// Gallery images upload
router.post("/gallery", auth, uploadGalleryImages, uploadGallery)

// Delete file
router.delete("/:folder/:filename", auth, deleteUploadedFile)

// Get file info
router.get("/info/:folder/:filename", getFileInfo)

module.exports = router
