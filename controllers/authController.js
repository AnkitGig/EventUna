const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOtp } = require("../utils/otp");

// Signup
exports.signup = async (req, res) => {
  const { fullName, email, mobile, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword)
    return res
      .status(400)
      .json({ status: false, message: "Passwords do not match" });

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
