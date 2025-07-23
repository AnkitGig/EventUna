const mongoose = require("mongoose")

const parentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    children: [
      {
        name: { type: String, required: true },
        age: { type: Number, required: true },
        dateOfBirth: Date,
        gender: { type: String, enum: ["male", "female", "other"] },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
        class: String,
        section: String,
        rollNumber: String,
        profileImage: String,
      },
    ],
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "India" },
    },
    occupation: String,
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Parent", parentSchema)
