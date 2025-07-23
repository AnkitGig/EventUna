const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    // Debug environment variables
    console.log("Environment check:")
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI)

    // Make sure we have a MongoDB URI
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/school_management"

    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined")
    }

    console.log("Attempting to connect to MongoDB...")

    // Only mask credentials if URI contains them
    const maskedURI = mongoURI.includes("@") ? mongoURI.replace(/\/\/.*@/, "//***:***@") : mongoURI

    console.log("MongoDB URI:", maskedURI)

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("❌ Database connection error:", error.message)
    console.error("Full error:", error)
    process.exit(1)
  }
}

module.exports = connectDB
