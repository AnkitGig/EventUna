const User = require(`../models/user/User`);
const Services = require(`../models/merchant/Services`);
const Merchant = require(`../models/merchant/Merchant`);
const joi = require("joi");

//    "email": "admin@yopmail.com",
//   "mobile": "admin@420",

exports.addServices = async (req, res) => {
  try {
    const { servicesName } = req.body;

    // Validate input
    const schema = joi.object({
      servicesName: joi.string().required().messages({
        "string.empty": "Service name is required",
        "any.required": "Service name is required",
      }),
    });

    const { error } = schema.validate({ servicesName });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Create new service
    const newService = new Services({
      servicesName,
    });

    // Save service to database
    await newService.save();

    res
      .status(201)
      .json({ message: "Service added successfully", service: newService });
  } catch (error) {
    console.error("Error adding services:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.merchantAccountStatus = async (req, res) => {
  try {
    const { id, flag } = req.body;

    // Validate input
    const schema = joi.object({
      id: joi.string().required(),
      flag: joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Find user by ID and update verification status
    const user = await Merchant.findByIdAndUpdate(id, {
      isActive: flag,
    });

    if (!user) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    res
      .status(200)
      .json({ message: "Merchant status updated successfully" });
  } catch (error) {
    console.error("Error verifying merchant account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find();

    if (!merchants || merchants.length === 0) {
      return res.status(404).json({ message: "No merchants found" });
    }

    res.status(200).json({ message: "Merchants retrieved successfully", merchants });
  } catch (error) {
    console.error("Error retrieving merchants:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}



