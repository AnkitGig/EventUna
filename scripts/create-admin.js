const mongoose = require("mongoose")
const User = require("../models/User")
require("dotenv").config()

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/school_management")
    console.log("Connected to MongoDB")

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" })
    if (existingAdmin) {
      console.log("Super admin already exists!")
      console.log("Email:", existingAdmin.email)
      process.exit(0)
    }

    // Create super admin
    const superAdmin = new User({
      email: "admin@school.com",
      password: "admin123", // Change this in production
      firstName: "Super",
      lastName: "Admin",
      role: "admin",
      isActive: true,
      accountStatus: "active",
      isFirstLogin: false,
    })

    await superAdmin.save()

    console.log("Super admin created successfully!")
    console.log("Email: admin@school.com")
    console.log("Password: admin123")
    console.log("Please change the password after first login!")

    process.exit(0)
  } catch (error) {
    console.error("Error creating super admin:", error)
    process.exit(1)
  }
}

createSuperAdmin()
