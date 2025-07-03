const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOtp } = require("../utils/otp");
const joi = require("joi");
// Signup
exports.signup = async (req, res) => {
  const schema = joi.object({
    fullName: joi.string().min(3).max(50).required(),
    email: joi.string().email().required(),
    mobile: joi.string().min(10).max(15).required(),
    password: joi.string().min(6).required(),
    role: joi.string().optional(),
  });
  const { error } = schema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ status: false, message: error.details[0].message });

  const { fullName, email, mobile, password, role } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
  if (existingUser)
    return res
      .status(400)
      .json({ status: false, message: "User already exists" });
  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  const user = new User({
    fullName,
    email,
    mobile,
    password: hashedPassword,
    otp,
    role: role || "user",
  });

  await user.save();
  console.log(`Send OTP ${otp} to mobile: ${mobile}`);
  res
    .status(201)
    .json({ status: true, message: "OTP sent to mobile", userId: user._id });
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
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
};

// Login
exports.login = async (req, res) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ status: false, message: error.details[0].message });

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res
      .status(400)
      .json({ status: false, message: "Invalid credentials" });

  if (!user.isVerified)
    return res
      .status(403)
      .json({ status: false, message: "Account not verified" });

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
  });
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
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
};

// Reset Password
exports.resetPassword = async (req, res) => {
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
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  const schema = joi
    .object({
      email: joi.string().email(),
      mobile: joi.string().min(10).max(15),
    })
    .or("email", "mobile");
  const { error } = schema.validate(req.body);
  if (error)
    return res.status(400).json({ status: false, message: error.details[0].message });

  const { email, mobile } = req.body;
  const user = await User.findOne(email ? { email } : { mobile });
  if (!user)
    return res.status(404).json({ status: false, message: "User not found" });

  if (user.isVerified)
    return res.status(400).json({ status: false, message: "User already verified" });

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
};
