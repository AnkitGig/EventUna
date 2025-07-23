const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "parent", "teacher"],
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false, // Default to false, admin must activate
    },
    profileImage: {
      type: String,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.role !== "admin" // Only required for non-admin users
      },
    },
    isFirstLogin: {
      type: Boolean,
      default: true, // Users must change password on first login
    },
    temporaryPassword: {
      type: String,
      default: null, // Store temporary password for first-time users
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model("User", userSchema)
