const express = require("express")
const dotenv = require("dotenv")
const path = require("path")
const morgan = require("morgan")
const connectDB = require("./config/db")
const indexRoutes = require("./routes/indexRoutes")
const { createDirectories } = require("./utils/directorySetup")
const multer = require("multer") // Import multer

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ✅ Create necessary directories on startup
createDirectories()

// ✅ Connect to DB
connectDB()

// ✅ Middlewares
app.use(express.json())
app.use(morgan("dev"))

// ✅ Static Files
app.use("/api", express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname, "view")))

// ✅ Routes
app.use("/api", indexRoutes)

// ✅ Global Error Handler for Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: false,
        message: "File too large. Maximum size allowed is 10MB for documents and 50MB for videos.",
      })
    }
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({
      status: false,
      message: error.message,
    })
  }

  console.error("Server Error:", error)
  res.status(500).json({
    status: false,
    message: "Internal server error",
  })
})

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("API is running...")
})

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})
