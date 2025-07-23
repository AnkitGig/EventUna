require("dotenv").config()
const express = require("express")
const cors = require("cors")
const connectDB = require("./config/database")
const emailService = require("./services/emailService")

const app = express()

// Connect to MongoDB
connectDB()

// Middleware
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Serve static files
app.use("/uploads", express.static("uploads"))

// Test email service on startup
console.log("📧 Testing email service configuration...")

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/public", require("./routes/public")) // 🆕 Public routes (no login required)
app.use("/api/schools", require("./routes/schools"))
app.use("/api/applications", require("./routes/applications"))
app.use("/api/parents", require("./routes/parents"))
app.use("/api/teachers", require("./routes/teachers"))
app.use("/api/admin", require("./routes/admin"))
app.use("/api/messages", require("./routes/messages"))
app.use("/api/activities", require("./routes/activities"))
app.use("/api/upload", require("./routes/upload"))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "School Management API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    emailService: emailService.isRealEmailMode ? "Real emails enabled" : "Development mode (console only)",
    features: {
      publicApplications: true,
      adminReview: true,
      accountCreation: true,
      emailNotifications: true,
    },
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Public applications: /api/public/applications`)
  console.log(`👨‍💼 Admin review: /api/admin/applications`)
  console.log(`🏫 School discovery: /api/schools`)
})
