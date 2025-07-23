const mongoose = require("mongoose")
const School = require("../models/School")
require("dotenv").config()

const sampleSchools = [
  {
    name: "Bright Minds Academy",
    description:
      "A premier educational institution focusing on holistic development of children with modern teaching methods and excellent facilities.",
    address: {
      street: "123 Education Street",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      country: "India",
    },
    location: {
      type: "Point",
      coordinates: [72.8777, 19.076], // Mumbai coordinates
    },
    contactInfo: {
      phone: "+91-9876543210",
      email: "info@brightminds.edu",
      website: "https://brightminds.edu",
    },
    images: [
      {
        url: "/placeholder.svg?height=300&width=400",
        caption: "School Building",
      },
      {
        url: "/placeholder.svg?height=300&width=400",
        caption: "Classroom",
      },
    ],
    facilities: ["Library", "Computer Lab", "Sports Ground", "Art Room", "Music Room", "Cafeteria"],
    ageGroups: [
      { name: "Nursery", minAge: 2, maxAge: 3 },
      { name: "Pre-KG", minAge: 3, maxAge: 4 },
      { name: "KG", minAge: 4, maxAge: 5 },
    ],
    fees: {
      admissionFee: 5000,
      monthlyFee: 8000,
      annualFee: 15000,
    },
    timings: {
      openTime: "08:00",
      closeTime: "17:00",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    rating: {
      average: 4.5,
      totalReviews: 125,
    },
  },
  {
    name: "Little Oak Academy",
    description:
      "Nurturing young minds with care and excellence. We provide a safe and stimulating environment for early childhood development.",
    address: {
      street: "456 Learning Lane",
      city: "Delhi",
      state: "Delhi",
      zipCode: "110001",
      country: "India",
    },
    location: {
      type: "Point",
      coordinates: [77.209, 28.6139], // Delhi coordinates
    },
    contactInfo: {
      phone: "+91-9876543211",
      email: "contact@littleoak.edu",
      website: "https://littleoak.edu",
    },
    images: [
      {
        url: "/placeholder.svg?height=300&width=400",
        caption: "Campus View",
      },
    ],
    facilities: ["Playground", "Library", "Medical Room", "Activity Room", "Garden"],
    ageGroups: [
      { name: "Toddler", minAge: 1, maxAge: 2 },
      { name: "Nursery", minAge: 2, maxAge: 3 },
      { name: "Pre-School", minAge: 3, maxAge: 5 },
    ],
    fees: {
      admissionFee: 3000,
      monthlyFee: 6000,
      annualFee: 12000,
    },
    timings: {
      openTime: "07:30",
      closeTime: "18:00",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    rating: {
      average: 4.2,
      totalReviews: 89,
    },
  },
  {
    name: "Happy Sprouts School",
    description:
      "Where learning meets fun! Our innovative curriculum and experienced teachers ensure your child's bright future.",
    address: {
      street: "789 Children's Avenue",
      city: "Bangalore",
      state: "Karnataka",
      zipCode: "560001",
      country: "India",
    },
    location: {
      type: "Point",
      coordinates: [77.5946, 12.9716], // Bangalore coordinates
    },
    contactInfo: {
      phone: "+91-9876543212",
      email: "hello@happysprouts.edu",
      website: "https://happysprouts.edu",
    },
    images: [
      {
        url: "/placeholder.svg?height=300&width=400",
        caption: "Playground",
      },
    ],
    facilities: ["Swimming Pool", "Dance Studio", "Science Lab", "Library", "Cafeteria", "Transport"],
    ageGroups: [
      { name: "Play Group", minAge: 1, maxAge: 2 },
      { name: "Nursery", minAge: 2, maxAge: 3 },
      { name: "LKG", minAge: 3, maxAge: 4 },
      { name: "UKG", minAge: 4, maxAge: 5 },
    ],
    fees: {
      admissionFee: 7000,
      monthlyFee: 10000,
      annualFee: 20000,
    },
    timings: {
      openTime: "08:30",
      closeTime: "16:30",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    rating: {
      average: 4.7,
      totalReviews: 156,
    },
  },
]

const seedSchools = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/school_management")
    console.log("Connected to MongoDB")

    // Clear existing schools
    await School.deleteMany({})
    console.log("Cleared existing schools")

    // Insert sample schools
    await School.insertMany(sampleSchools)
    console.log("Sample schools inserted successfully")

    process.exit(0)
  } catch (error) {
    console.error("Error seeding schools:", error)
    process.exit(1)
  }
}

seedSchools()
