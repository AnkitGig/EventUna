const User = require("../models/user/User");
const Address = require("../models/user/Address");
const { deleteOldImages } = require("../utils/helpers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOtp } = require("../utils/otp");
const path = require("path");
const joi = require("joi");

// Signup
exports.signup = async (req, res) => {
  try {
    console.log("Received signup request:", req.body);
    const schema = joi.object({
      fullName: joi
        .string()
        .pattern(/^[a-zA-Z\s]+$/)
        .min(3)
        .max(50)
        .required()
        .messages({
          "string.pattern.base":
            "Full name must only contain letters and spaces",
          "string.min": "Full name must be at least 3 characters long",
          "string.max": "Full name must be less than or equal to 50 characters",
          "any.required": "Full name is required",
        })
        .optional(),
      email: joi.string().email().required(),
      mobile: joi.string().min(10).max(15).required(),
      password: joi.string().min(6).required(),
      role: joi.string().optional(),
      register_id: joi.string().optional(),
      ios_register_id: joi.string().optional(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const {
      fullName,
      email,
      mobile,
      password,
      role,
      register_id,
      ios_register_id,
    } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      if (existingUser.isVerified == false) {
        const otp = generateOtp();
        existingUser.otp = otp;
        await existingUser.save();
        console.log(`Resend OTP ${otp} to mobile: ${mobile}`);
        return res.status(200).json({
          status: true,
          message: "OTP resent to mobile",
          userId: existingUser._id,
        });
      }
      let message =
        existingUser.email === email
          ? `email already exists. Please use another one`
          : `mobile number already exists. Please use another one`;
      return res.status(400).json({ status: false, message: message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    const user = new User({
      fullName,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      otp,
      role: role || "user",
      register_id: register_id || null,
      ios_register_id: ios_register_id || null,
    });

    await user.save();
    console.log(`Send OTP ${otp} to mobile: ${mobile}`);
    res
      .status(201)
      .json({ status: true, message: "OTP sent to mobile", userId: user._id });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const schema = joi.object({
      userId: joi.string().required(),
      otp: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ status: false, message: "Invalid OTP" });

    user.isVerified = true;
    user.otp = null;
    await user.save();

    res.json({ status: true, message: "User verified successfully" });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const schema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required(),
      register_id: joi.string().optional(),
      ios_register_id: joi.string().optional(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });
    const email = req.body.email.toLowerCase();
    const { password, register_id, ios_register_id } = req.body;

    // email.toLowerCase()
    const user = await User.findOne({ email });
    if (
      !user ||
      user.isDeleted ||
      !(await bcrypt.compare(password, user.password))
    )
      return res
        .status(400)
        .json({ status: false, message: "Account does not exist" });

    if (!user.isVerified)
      return res
        .status(403)
        .json({ status: false, message: "Account not verified" });

    // Update register_id and ios_register_id if provided
    if (register_id) user.register_id = register_id;
    if (ios_register_id) user.ios_register_id = ios_register_id;
    if (register_id || ios_register_id) await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      status: true,
      message: "Login successful",
      token,
      userId: user._id,
      role: user.role,
      register_id: user.register_id,
      ios_register_id: user.ios_register_id,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const schema = joi.object({
      email: joi.string().email().required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });
    const otp = generateOtp();
    user.otp = otp;
    await user.save();

    console.log(`Send OTP ${otp} to email: ${email}`);
    res.json({ status: true, message: "OTP sent to email", userId: user._id });
  } catch (error) {
    console.error("Error during forgot password:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const schema = joi.object({
      userId: joi.string().required(),
      otp: joi.string().required(),
      newPassword: joi.string().min(6).required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const { userId, otp, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user || user.otp !== otp)
      return res
        .status(400)
        .json({ status: false, message: "Invalid OTP or user" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    await user.save();

    res.json({ status: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const schema = joi
      .object({
        email: joi.string().email(),
        mobile: joi.string().min(10).max(15),
      })
      .or("email", "mobile");
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const { email, mobile } = req.body;
    const user = await User.findOne(email ? { email } : { mobile });
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });

    // Remove the check for user.isVerified
    // Always resend OTP, regardless of verification status
    const otp = generateOtp();
    user.otp = otp;
    await user.save();

    // Simulate sending OTP (log to console)
    if (email) {
      console.log(`Resend OTP ${otp} to email: ${email}`);
    } else {
      console.log(`Resend OTP ${otp} to mobile: ${mobile}`);
    }

    res.json({ status: true, message: "OTP resent", userId: user._id });
  } catch (error) {
    console.error("Error during resend OTP:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { dob, gender, fullName } = req.body;
    const schema = joi.object({
      dob: joi.string().optional(),
      gender: joi.string().optional(),
      fullName: joi.string().optional(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const user = await User.findById(req.user.id);
    let profilePic = user.profilePic;
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });

    if (req.file) {
      profilePic = req.file.filename;
      if (user.profilePic) {
        deleteOldImages("profile", user.profilePic);
      }
    }

    await User.findByIdAndUpdate(
      req.user.id,
      {
        dob: dob || user.dob,
        gender: gender.toLowerCase() || user.gender,
        profilePic: profilePic,
        fullName: fullName || user.fullName,
      },
      { new: true }
    );
    // console.log("req.user", req.file.filename);
    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Privacy Policy
exports.privacyPolicy = async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "../view/privacyPolicy.html"));
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.query.id;
    if (userId) {
      if (userId !== req.user.id) {
        return res
          .status(403)
          .json({ status: false, message: "Access denied" });
      }

      const user = await User.findById(userId).select("-password -otp");
      if (!user) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      user.profilePic = user.profilePic
        ? `${process.env.BASE_URL}/profile/${user.profilePic}`
        : process.env.DEFAULT_PROFILE_PIC;

      user.gender = user.gender.toUpperCase();

      return res.status(200).json({ status: true, user });
    }

    const allUsers = await User.find({ role: { $ne: "admin" } }).select(
      "-password -otp"
    );

    allUsers.map((user) => {
      user.gender =
        user.gender == null ? user.gender : user.gender.toUpperCase();
      user.profilePic = user.profilePic
        ? `${process.env.BASE_URL}/profile/${user.profilePic}`
        : process.env.DEFAULT_PROFILE_PIC;
    });
    res.status(200).json({ status: true, users: allUsers });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Soft Delete User
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    user.isDeleted = true;
    await user.save();
    res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const {addressName, address1, address2, postcode } = req.body;
    const schema = joi.object({
      addressName: joi.string().required(),
      address1: joi.string().required(),
      address2: joi.string().optional(),
      postcode: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const newAddress = new Address({
      addressName,
      address1,
      address2,
      postcode,
      userId: req.user.id,
    });

    await newAddress.save();
    res
      .status(201)
      .json({ status: true, message: "Address added successfully" });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.getAddress = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).select(
      "-userId -createdAt -updatedAt -__v"
    );
    if (!addresses || addresses.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "No addresses found" });
    }
    res.status(200).json({ status: true, addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.allUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await User.find({
      role: { $ne: "admin" },
      _id: {
        $ne: userId,
      },
    }).select("-password -otp -updatedAt -createdAt -__v");
    if (!users || users.length === 0) {
      return res.status(404).json({ status: false, message: "No users found" });
    }

    // users.map((user) => {
    //   if (user._id.toString() === userId) {
    //     return res.status(403).json({
    //       status: false,
    //       message: "You cannot view your own profile in this list",
    //     });
    //   }
    // });

    users.map((user) => {
      user.profilePic = user.profilePic
        ? `${process.env.BASE_URL}/profile/${user.profilePic}`
        : `${process.env.DEFAULT_PROFILE_PIC}`;
    });

    return res
      .status(200)
      .json({ status: true, users, message: "All users fetched successfully" });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
