const mongoose = require("mongoose")

const teacherProfileSchema = new mongoose.Schema(
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
      required: true,
    },
    subjects: [
      {
        name: String,
        grades: [String], // ["KG", "1st Grade", "2nd Grade"]
        sections: [String], // ["A", "B", "C"]
      },
    ],
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
        certificate: String,
      },
    ],
    experience: {
      totalYears: { type: Number, default: 0 },
      specialization: [String], // ["Early Childhood", "Special Needs", etc.]
    },
    availability: {
      workingDays: {
        type: [String],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      workingHours: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "16:00" },
      },
      availableForChat: {
        type: Boolean,
        default: true,
      },
      availableForCalls: {
        type: Boolean,
        default: true,
      },
    },
    contactPreferences: {
      preferredContactTime: {
        start: String,
        end: String,
      },
      responseTime: {
        type: String,
        enum: ["immediate", "within_hour", "within_day"],
        default: "within_hour",
      },
    },
    profileImage: String,
    bio: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    isAvailableForNewChats: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema)
