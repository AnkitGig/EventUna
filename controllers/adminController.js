const User = require(`../models/user/User`);
const Services = require(`../models/merchant/Services`);
const Merchant = require(`../models/merchant/Merchant`);
const Notes = require(`../models/event/EventNotes`);
const AddtionalServices = require(`../models/event/EventAdditionalServices`);
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

    res.status(200).json({ message: "Merchant status updated successfully" });
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

    res
      .status(200)
      .json({ message: "Merchants retrieved successfully", merchants });
  } catch (error) {
    console.error("Error retrieving merchants:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    // Validate input
    const schema = joi.object({
      notes: joi.string().required().messages({
        "string.empty": "Notes are required",
        "any.required": "Notes are required",
      }),
    });

    const { error } = schema.validate({ notes });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Create new note
    const newNote = new Notes({
      notes,
    });

    // Save note to database
    await newNote.save();

    res.status(201).json({ message: "Note added successfully", note: newNote });
  } catch (error) {
    console.error("Error adding notes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.allUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.query.id;

    if (id) {
      // Find user by ID
      const user = await User.findById(id).select(
        "-password -otp -updatedAt -createdAt -__v"
      );

      if (!user) {
        return res
          .status(404)
          .json({ status: false, message: "User not found" });
      }

      user.profilePic = user.profilePic
        ? `${process.env.BASE_URL}/profile/${user.profilePic}`
        : `${process.env.DEFAULT_PROFILE_PIC}`;
      return res.status(200).json({
        status: true,
        message: "User fetched successfully",
        data: user,
      });
    }

    // Validate user ID
    if (!userId) {
      return res
        .status(400)
        .json({ status: false, message: "User ID is required" });
    }

    // Find all users except the admin
    const users = await User.find({
      role: { $ne: "admin" },
      _id: { $ne: userId },
    }).select("-password -otp -updatedAt -createdAt -__v");

    if (!users || users.length === 0) {
      return res.status(404).json({ status: false, message: "No users found" });
    }

    users.map((user) => {
      user.profilePic = user.profilePic
        ? `${process.env.BASE_URL}/profile/${user.profilePic}`
        : `${process.env.DEFAULT_PROFILE_PIC}`;
    });

    res.status(200).json({
      status: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

exports.addAdditionalServices = async (req, res) => {
  try {
    const { serviceName } = req.body;

    const schema = joi.object({
      serviceName: joi.string().required().messages({
        "string.empty": "service name are required",
        "any.required": "service name are required",
      }),
    });

    const { error } = schema.validate({ serviceName });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }


     // Create new note
    const newService = new AddtionalServices({
      serviceName,
    });

    // Save note to database
    await newService.save();

    res.status(201).json({ message: "Service added successfully", note: newService });
  } catch (error) {
    console.error("Error while adding additinal services :", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
