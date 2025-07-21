const multer = require("multer")
const path = require("path")

// Storage for merchant profile images
const merchantStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "./public/merchant/"

    if (
      file.fieldname === "businessRegistrationImage" ||
      file.fieldname === "vatRegistrationImage" ||
      file.fieldname === "otherImage"
    ) {
      uploadPath += "documents/"
    } else if (file.fieldname === "bannerImage") {
      uploadPath += "banners/"
    } else if (file.fieldname === "locationPhotoVideoList") {
      uploadPath += "locations/"
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

// Storage for location media
const locationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/merchant/locations/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const uploadMerchantProfile = multer({
  storage: merchantStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|mp4|mov/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

const uploadLocationMedia = multer({
  storage: locationStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4|mov/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

module.exports = { uploadMerchantProfile, uploadLocationMedia }
