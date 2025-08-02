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

    // Ensure directory exists
    ensureDirectoryExists(uploadPath)

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

// Storage for location media
const locationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "./public/merchant/locations/"

    // Ensure directory exists
    ensureDirectoryExists(uploadPath)

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const uploadMerchantProfile = multer({
  storage: merchantStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|mp4|mov/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: JPEG, JPG, PNG, PDF, MP4, MOV`))
    }
  },
})

const uploadLocationMedia = multer({
  storage: locationStorage,
  limits: {
    fileSize: 500* 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4|mov/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type. Allowed types: JPEG, JPG, PNG, MP4, MOV"))
    }
  },
})

// Storage for product photos
const productPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "./public/merchant/products/";
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadProductPhoto = multer({
  storage: productPhotoStorage,
  limits: {
    fileSize: 100* 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type for product photo. Allowed types: JPEG, JPG, PNG"));
    }
  },
});

module.exports = { uploadMerchantProfile, uploadLocationMedia, uploadProductPhoto }
