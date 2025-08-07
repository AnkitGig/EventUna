const fs = require("fs")
const path = require("path")

// Function to create all necessary directories
const createDirectories = () => {
  const directories = [
    "./public",
    "./public/profile",
    "./public/services",
    "./public/event",
    "./public/event/media", // Add event media directory
    "./public/merchant",
    "./public/merchant/documents",
    "./public/merchant/banners",
    "./public/merchant/locations",
    "./public/merchant/products", // Add products directory if missing
  ]

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✅ Created directory: ${dir}`)
    }
  })
}

module.exports = { createDirectories }
