const mongoose = require("mongoose")
const Room = require("../models/Room")
const User = require("../models/User")
require("dotenv").config()

const sampleRooms = [
  {
    roomNumber: "3",
    roomName: "Little Explorers",
    primaryTeacher: {
      name: "Doris Wilson",
      profileImage: "/placeholder.svg?height=100&width=100",
    },
    ageGroup: {
      minAge: 2,
      maxAge: 4,
      description: "Toddlers & Preschool",
    },
    capacity: 15,
    currentEnrollment: 12,
    dailySchedule: [
      {
        time: "08:00 AM",
        activity: "Breakfast",
        description: "Healthy breakfast with fruits and cereals",
        duration: 30,
      },
      {
        time: "08:30 AM",
        activity: "Play time",
        description: "Free play with educational toys",
        duration: 60,
      },
      {
        time: "09:30 AM",
        activity: "Learning",
        description: "Circle time, stories, and basic learning activities",
        duration: 45,
      },
      {
        time: "10:15 AM",
        activity: "Physical games",
        description: "Outdoor play and physical activities",
        duration: 45,
      },
      {
        time: "11:00 AM",
        activity: "Snacks",
        description: "Healthy snacks and juice",
        duration: 20,
      },
      {
        time: "11:20 AM",
        activity: "Story time",
        description: "Reading stories and quiet activities",
        duration: 40,
      },
      {
        time: "12:00 PM",
        activity: "Lunch",
        description: "Nutritious lunch meal",
        duration: 45,
      },
      {
        time: "12:45 PM",
        activity: "Nap time",
        description: "Rest and sleep time",
        duration: 90,
      },
      {
        time: "02:15 PM",
        activity: "Afternoon Snacks",
        description: "Light snacks after nap",
        duration: 15,
      },
      {
        time: "02:30 PM",
        activity: "Art & Craft",
        description: "Creative activities and crafts",
        duration: 60,
      },
      {
        time: "03:30 PM",
        activity: "Check out",
        description: "Preparation for pickup",
        duration: 30,
      },
    ],
    facilities: ["Play area", "Reading corner", "Art station", "Outdoor playground"],
  },
]

const seedRooms = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/school_management")
    console.log("Connected to MongoDB")

    // Clear existing rooms
    await Room.deleteMany({})
    console.log("Cleared existing rooms")

    // Find an admin user first (needed for createdBy field)
    const admin = await User.findOne({ role: "admin" })
    if (!admin) {
      console.log("⚠️  No admin found. Please run 'node scripts/create-admin.js' first")
      process.exit(1)
    }
    console.log("✅ Found admin user")

    // Find a teacher user to assign as primary teacher
    let teacher = await User.findOne({ role: "teacher" })
    if (!teacher) {
      console.log("⚠️  No teacher found. Creating a sample teacher first...")

      // Create a sample teacher user
      const sampleTeacher = new User({
        email: "teacher@brightminds.edu",
        password: "teacher123",
        firstName: "Doris",
        lastName: "Wilson",
        role: "teacher",
        isActive: true,
        accountStatus: "active",
        isFirstLogin: false,
        createdBy: admin._id, // Set the admin as creator
      })
      teacher = await sampleTeacher.save()
      console.log("✅ Sample teacher created")
    } else {
      console.log("✅ Found existing teacher")
    }

    // Update the sample room data with the teacher
    sampleRooms[0].primaryTeacher.userId = teacher._id

    // Find a school to assign rooms to
    const School = require("../models/School")
    const school = await School.findOne()
    if (!school) {
      console.log("⚠️  No school found. Please run 'node scripts/seed-schools.js' first")
      process.exit(1)
    } else {
      sampleRooms[0].schoolId = school._id
      console.log("✅ Found school:", school.name)
    }

    // Insert sample rooms
    await Room.insertMany(sampleRooms)
    console.log("✅ Sample rooms inserted successfully")

    console.log("\n🎉 Room seeding completed!")
    console.log("📋 Created rooms:")
    console.log("   - Room 3: Little Explorers (Ages 2-4)")
    console.log("   - Primary Teacher: Doris Wilson")
    console.log("   - Daily schedule with 11 time slots")
    console.log("   - Capacity: 15 students")
    console.log("   - Current enrollment: 12 students")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding rooms:", error)
    process.exit(1)
  }
}

seedRooms()
