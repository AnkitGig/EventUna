const User = require(`../models/user/User`)
const Services = require(`../models/merchant/Services`)
const Merchant = require(`../models/merchant/Merchant`)
const Notes = require(`../models/event/EventNotes`)
const AddtionalServices = require(`../models/event/EventAdditionalServices`)
const SubServices = require(`../models/merchant/Subservices`)
const Preferences = require(`../models/event/EventPreferences`)
const RestaurantCategory = require(`../models/merchant/RestaurantCategory`)
const joi = require("joi")


exports.addServices = async (req, res) => {
  try {
    const { servicesName } = req.body
    const schema = joi.object({
      servicesName: joi.string().required().messages({
        "string.empty": "Service name is required",
        "any.required": "Service name is required",
      }),
    })
    const { error } = schema.validate({ servicesName })
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }
    const newService = new Services({
      servicesName,
    })
    await newService.save()
    res.status(201).json({ message: "Service added successfully", service: newService })
  } catch (error) {
    console.error("Error adding services:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

exports.merchantAccountStatus = async (req, res) => {
  try {
    const { id, flag } = req.body
    const schema = joi.object({
      id: joi.string().required(),
      flag: joi.string().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }
    const user = await Merchant.findByIdAndUpdate(id, {
      isActive: flag,
    })
    if (!user) {
      return res.status(404).json({ message: "Merchant not found" })
    }
    res.status(200).json({ message: "Merchant status updated successfully" })
  } catch (error) {
    console.error("Error verifying merchant account:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

exports.getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find()
    if (!merchants || merchants.length === 0) {
      return res.status(404).json({ message: "No merchants found" })
    }
    res.status(200).json({ message: "Merchants retrieved successfully", merchants })
  } catch (error) {
    console.error("Error retrieving merchants:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

exports.addNotes = async (req, res) => {
  try {
    const { notes } = req.body
    const schema = joi.object({
      notes: joi.string().required().messages({
        "string.empty": "Notes are required",
        "any.required": "Notes are required",
      }),
    })
    const { error } = schema.validate({ notes })
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }
    const newNote = new Notes({
      notes,
    })
    await newNote.save()
    res.status(201).json({ message: "Note added successfully", note: newNote })
  } catch (error) {
    console.error("Error adding notes:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

exports.allUsers = async (req, res) => {
  try {
    const userId = req.user.id
    const id = req.query.id
    if (id) {
      const user = await User.findById(id).select("-password -otp -updatedAt -createdAt -__v")

      if (!user) {
        return res.status(404).json({ status: false, message: "User not found" })
      }
      user.profilePic = user.profilePic
        ? `${process.env.BASE_URL}/profile/${user.profilePic}`
        : `${process.env.DEFAULT_PROFILE_PIC}`
      return res.status(200).json({
        status: true,
        message: "User fetched successfully",
        data: user,
      })
    }
    if (!userId) {
      return res.status(400).json({ status: false, message: "User ID is required" })
    }

    const users = await User.find({
      role: { $ne: "admin" },
      _id: { $ne: userId },
    }).select("-password -otp -updatedAt -createdAt -__v")

    if (!users || users.length === 0) {
      return res.status(404).json({ status: false, message: "No users found" })
    }

    users.map((user) => {
      user.profilePic = user.profilePic
        ? `${process.env.BASE_URL}/profile/${user.profilePic}`
        : `${process.env.DEFAULT_PROFILE_PIC}`
    })

    res.status(200).json({
      status: true,
      message: "Users fetched successfully",
      data: users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.addAdditionalServices = async (req, res) => {
  try {
    const { serviceName } = req.body

    const schema = joi.object({
      serviceName: joi.string().required().messages({
        "string.empty": "service name are required",
        "any.required": "service name are required",
      }),
    })

    const { error } = schema.validate({ serviceName })
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const newService = new AddtionalServices({
      serviceName,
    })
    await newService.save()

    res.status(201).json({ message: "Service added successfully", note: newService })
  } catch (error) {
    console.error("Error while adding additinal services :", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.placePreferences = async (req, res) => {
  try {
    const { preference } = req.body

    const schema = joi.object({
      preference: joi.string().required().messages({
        "string.empty": "preference name are required",
        "any.required": "preference name are required",
      }),
    })

    const { error } = schema.validate({ preference })
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const newPreference = new Preferences({
      preferences: preference,
    })

    // Save note to database
    await newPreference.save()

    res.status(201).json({
      statue: true,
      message: "Preference added successfully",
      preference: preference,
    })
  } catch (error) {
    console.error("Error while adding place preferences :", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.subServices = async (req, res) => {
  try {
    const { subService, serviceId } = req.body

    const schema = joi.object({
      subService: joi.string().required(),
      serviceId: joi.string().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    // Create new note
    const subServices = new SubServices({
      subServicesName: subService,
      serviceId,
    })

    // Save note to database
    await subServices.save()

    res.status(201).json({
      statue: true,
      message: "subservices added successfully",
      preference: subServices,
    })
  } catch (error) {
    console.error("Error while adding sub-services preferences :", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Add restaurant category management to admin controller

exports.addRestaurantCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body

    const schema = joi.object({
      categoryName: joi.string().required().messages({
        "string.empty": "Category name is required",
        "any.required": "Category name is required",
      }),
      description: joi.string().optional(),
    })

    const { error } = schema.validate({ categoryName, description })
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const newCategory = new RestaurantCategory({
      categoryName,
      description,
    })

    await newCategory.save()

    res.status(201).json({
      message: "Restaurant category added successfully",
      category: newCategory,
    })
  } catch (error) {
    console.error("Error adding restaurant category:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

exports.getRestaurantCategories = async (req, res) => {
  try {
    const categories = await RestaurantCategory.find()

    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: "No restaurant categories found" })
    }

    res.status(200).json({
      message: "Restaurant categories retrieved successfully",
      categories,
    })
  } catch (error) {
    console.error("Error retrieving restaurant categories:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
