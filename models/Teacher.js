const mongoose = require("mongoose")

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    subjects: [
      {
        name: String,
        grade: String,
        section: String,
      },
    ],
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
        certificate: String, // File path for certificate
      },
    ],
    experience: {
      totalYears: { type: Number, default: 0 },
      previousSchools: [
        {
          schoolName: String,
          position: String,
          duration: String,
          from: Date,
          to: Date,
        },
      ],
    },
    personalInfo: {
      dateOfBirth: Date,
      gender: { type: String, enum: ["male", "female", "other"] },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: "India" },
      },
      emergencyContact: {
        name: String,
        relationship: String,
        phoneNumber: String,
      },
    },
    schedule: {
      workingDays: [String],
      workingHours: {
        start: String,
        end: String,
      },
    },
    salary: {
      basic: Number,
      allowances: Number,
      total: Number,
    },
    documents: [
      {
        type: String, // ID proof, address proof, etc.
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Teacher", teacherSchema)
