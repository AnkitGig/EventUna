const Merchant = require("../models/merchant/Merchant");
const Services = require("../models/merchant/Services");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { generateOtp } = require("../utils/otp");
const joi = require("joi");


const isMerchant = (req, res) => {
  if (req.user && req.user.role === "merchant") {
    return true;
  }
  return false;
}
// Signup
exports.signup = async (req, res) => {
  try {
    console.log("Received signup request:", req.body);
    const schema = joi.object({
      email: joi.string().email().required(),
      mobile: joi.string().min(10).max(15).required(),
      password: joi.string().min(6).required(),
      register_id: joi.string().optional(),
      ios_register_id: joi.string().optional(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const {
      email,
      mobile,
      password,
      register_id,
      ios_register_id,
    } = req.body;

    const existingUser = await Merchant.findOne({
      $or: [{ email }, { mobile }],
    });
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

    const user = new Merchant({
      email,
      mobile,
      password: hashedPassword,
      otp,
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
      merchantId: joi.string().required(),
      otp: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const { merchantId, otp } = req.body;

    const user = await Merchant.findById(merchantId);
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

exports.resendOtp = async (req, res) => {
  try {
    const schema = joi.object({
      merchantId: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const { merchantId } = req.body;

    const user = await Merchant.findById(merchantId);
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });

    if (user.isVerified)
      return res
        .status(400)
        .json({ status: false, message: "User already verified" });

    const otp = generateOtp();
    user.otp = otp;
    await user.save();

    console.log(`Resend OTP ${otp} to mobile: ${user.mobile}`);
    res.json({ status: true, message: "OTP resent successfully" });
    
  } catch (error) {
    console.error("Error during OTP resend:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
    
  }
}


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

    const { email, password, register_id, ios_register_id } = req.body;
     

 
    const user = await Merchant.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res
        .status(400)
        .json({ status: false, message: "Invalid credentials" });

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


exports.services= async(req, res)=>{
  try {

    const merchantReponse = await isMerchant(req, res);
    console.log(`Merchant Reponse: ${merchantReponse}`);
    
    const services = await Services.find({});
    if (!services || services.length === 0) {
      return res.status(404).json({ status: false, message: "No services found" });
    }
    
    res.status(200).json({ status: true, message: "Services fetched successfully", services });
    
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ status: false, message: "Internal server error"})
    
  }
}