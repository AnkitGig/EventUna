const fs = require("fs")
const path = require("path")

// Function to create all necessary directories
const createDirectories = () => {
  const directories = [
    "./public",
    "./public/profile",
    "./public/services",
    "./public/event",
    "./public/merchant",
    "./public/merchant/documents",
    "./public/merchant/banners",
    "./public/merchant/locations",
  ]

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✅ Created directory: ${dir}`)
    }
  })
}

module.exports = { createDirectories }
