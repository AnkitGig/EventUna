const Merchant = require("../models/merchant/Merchant")
const Services = require("../models/merchant/Services")
const Subservices = require("../models/merchant/Subservices")
const ServiceLocation = require("../models/merchant/ServiceLocation")
const Coupon = require("../models/merchant/Coupon")
const RestaurantCategory = require("../models/merchant/RestaurantCategory")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { deleteOldImages } = require("../utils/helpers")

const { generateOtp } = require("../utils/otp")
const joi = require("joi")

const isMerchant = (req, res) => {
  if (req.user && req.user.role === "merchant") {
    return true
  }
  return false
}
// Signupsss
exports.signup = async (req, res) => {
  try {
    console.log("Received signup request:", req.body)
    const schema = joi.object({
      email: joi.string().email().required(),
      mobile: joi.string().min(10).max(15).required(),
      password: joi.string().min(6).required(),
      serviceId: joi.string().required(),
      register_id: joi.string().optional(),
      ios_register_id: joi.string().optional(),
    })
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).json({ status: false, message: error.details[0].message })

    let { email, mobile, password, serviceId, register_id, ios_register_id } = req.body

    // Always store email in lowercase
    email = email.toLowerCase()

    const existingUser = await Merchant.findOne({
      $or: [{ email }, { mobile }],
    })

    if (existingUser) {
      if (existingUser.isVerified == false) {
        const otp = generateOtp()
        existingUser.otp = otp
        await existingUser.save()
        console.log(`Resend OTP ${otp} to mobile: ${mobile}`)
        return res.status(200).json({
          status: true,
          message: "OTP resent to mobile",
          userId: existingUser._id,
        })
      }
      const message =
        existingUser.email === email
          ? `email already exists. Please use another one`
          : `mobile number already exists. Please use another one`
      return res.status(400).json({ status: false, message: message })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const otp = generateOtp()

    const user = new Merchant({
      email,
      mobile,
      password: hashedPassword,
      otp,
      serviceId,
      register_id: register_id || null,
      ios_register_id: ios_register_id || null,
    })

    await user.save()
    console.log(`Send OTP ${otp} to mobile: ${mobile}`)
    res.status(201).json({ status: true, message: "OTP sent to mobile", userId: user._id })
  } catch (error) {
    console.error("Error during signup:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const schema = joi.object({
      merchantId: joi.string().required(),
      otp: joi.string().required(),
    })
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).json({ status: false, message: error.details[0].message })

    const { merchantId, otp } = req.body

    const user = await Merchant.findById(merchantId)
    if (!user) return res.status(404).json({ status: false, message: "User not found" })

    if (user.otp !== otp) return res.status(400).json({ status: false, message: "Invalid OTP" })

    user.isVerified = true
    user.otp = null
    await user.save()

    res.json({ status: true, message: "User verified successfully" })
  } catch (error) {
    console.error("Error during OTP verification:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.resendOtp = async (req, res) => {
  try {
    const schema = joi.object({
      merchantId: joi.string().required(),
    })
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).json({ status: false, message: error.details[0].message })

    const { merchantId } = req.body

    const user = await Merchant.findById(merchantId)
    if (!user) return res.status(404).json({ status: false, message: "User not found" })

    if (user.isVerified) return res.status(400).json({ status: false, message: "User already verified" })

    const otp = generateOtp()
    user.otp = otp
    await user.save()

    console.log(`Resend OTP ${otp} to mobile: ${user.mobile}`)
    res.json({ status: true, message: "OTP resent successfully" })
  } catch (error) {
    console.error("Error during OTP resend:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.login = async (req, res) => {
  try {
    const schema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required(),
      register_id: joi.string().optional(),
      ios_register_id: joi.string().optional(),
    })
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).json({ status: false, message: error.details[0].message })

    let { email, password, register_id, ios_register_id } = req.body

    // Always use lowercase for email
    email = email.toLowerCase()

    const user = await Merchant.findOne({ email })
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ status: false, message: "Invalid credentials" })

    if (!user.isVerified)
      return res.status(403).json({
        status: false,
        message: "Account not verified",
        userId: user._id,
        serviceId: user.serviceId,
      })

    // Update register_id and ios_register_id if provided
    if (register_id) user.register_id = register_id
    if (ios_register_id) user.ios_register_id = ios_register_id
    if (register_id || ios_register_id) await user.save()

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    })

    res.json({
      status: true,
      message: "Login successful",
      token,
      userId: user._id,
      role: user.role,
      isActive: user.isActive,
      register_id: user.register_id,
      ios_register_id: user.ios_register_id,
      serviceId: user.serviceId,
    })
  } catch (error) {
    console.error("Error during login:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.services = async (req, res) => {
  try {
    const merchantReponse = await isMerchant(req, res)
    console.log(`Merchant Reponse: ${merchantReponse}`)

    const services = await Services.find({})
    if (!services || services.length === 0) {
      return res.status(404).json({ status: false, message: "No services found" })
    }

    // For each service, fetch its subcategories (subservices)
    const servicesWithSubcategories = await Promise.all(
      services.map(async (service) => {
        const subcategories = await Subservices.find({
          serviceId: service._id,
        }).select("_id subServicesName serviceId")
        return {
          ...service.toObject(),
          subcategories,
        }
      }),
    )

    res.status(200).json({
      status: true,
      message: "Services fetched successfully",
      services: servicesWithSubcategories,
    })
  } catch (error) {
    console.error("Error fetching services:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.subServices = async (req, res) => {
  try {
    const { id } = req.query
    const schema = joi.object({
      id: joi.string().required(),
    })
    const { error } = schema.validate({ id })
    if (error) return res.status(400).json({ status: false, message: error.details[0].message })

    const services = await Subservices.find({
      serviceId: id,
    }).select("id subServicesName serviceId")
    if (!services || services.length === 0) {
      return res.status(404).json({ status: false, message: "No services found" })
    }

    res.status(200).json({
      status: true,
      message: "subservices fetched successfully",
      services,
    })
  } catch (error) {
    console.error("Error fetching services:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Get Restaurant Categories
exports.getRestaurantCategories = async (req, res) => {
  try {
    const categories = await RestaurantCategory.find({})
    if (!categories || categories.length === 0) {
      return res.status(404).json({ status: false, message: "No restaurant categories found" })
    }

    res.status(200).json({
      status: true,
      message: "Restaurant categories fetched successfully",
      data: categories,
    })
  } catch (error) {
    console.error("Error fetching restaurant categories:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Update Service Profile
exports.updateServiceProfile = async (req, res) => {
  try {
    const merchantId = req.user.id

    console.log("Request body:", req.body)
    console.log("Request files:", req.files)

    // Parse boolean values
    if (req.body.onlineReservation !== undefined) {
      req.body.onlineReservation = req.body.onlineReservation === "true" || req.body.onlineReservation === true
    }

    const schema = joi.object({
      serviceSubcategoryIds: joi.string().optional(),
      serviceName: joi.string().optional(),
      serviceDescription: joi.string().optional(),
      webUrl: joi.string().uri().optional().allow(""),
      cuisineName: joi.string().optional(),
      menuUrl: joi.string().uri().optional().allow(""),
      phone: joi.string().optional(),
      onlineReservation: joi.boolean().optional(),
      commercialPermitNumber: joi.string().optional(),
      vatNumber: joi.string().optional(),
      serviceSlogan: joi.string().optional(),
      serviceLocationIds: joi.string().optional(),
      couponIds: joi.string().optional(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      })
    }

    // Get current merchant data to handle old file deletion
    const currentMerchant = await Merchant.findById(merchantId)
    if (!currentMerchant) {
      return res.status(404).json({
        status: false,
        message: "Merchant not found",
      })
    }

    const updateData = { ...req.body }

    // Remove keys with blank values (empty string, null, undefined)
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === "" || updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Parse comma-separated IDs and filter out empty strings
    if (req.body.serviceSubcategoryIds) {
      const ids = req.body.serviceSubcategoryIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
      updateData.serviceSubcategoryIds = ids
      console.log("Parsed serviceSubcategoryIds:", ids)
    }
    if (req.body.serviceLocationIds) {
      const ids = req.body.serviceLocationIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
      updateData.serviceLocationIds = ids
      console.log("Parsed serviceLocationIds:", ids)
    }
    if (req.body.couponIds) {
      const ids = req.body.couponIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
      updateData.couponIds = ids
      console.log("Parsed couponIds:", ids)
    }

    // Handle file uploads and delete old files
    if (req.files) {
      if (req.files.businessRegistrationImage) {
        if (currentMerchant.businessRegistrationImage) {
          deleteOldImages("merchant/documents", currentMerchant.businessRegistrationImage)
        }
        updateData.businessRegistrationImage = req.files.businessRegistrationImage[0].filename
      }
      if (req.files.vatRegistrationImage) {
        if (currentMerchant.vatRegistrationImage) {
          deleteOldImages("merchant/documents", currentMerchant.vatRegistrationImage)
        }
        updateData.vatRegistrationImage = req.files.vatRegistrationImage[0].filename
      }
      if (req.files.otherImage) {
        if (currentMerchant.otherImage) {
          deleteOldImages("merchant/documents", currentMerchant.otherImage)
        }
        updateData.otherImage = req.files.otherImage[0].filename
      }
      if (req.files.bannerImage) {
        if (currentMerchant.bannerImage) {
          deleteOldImages("merchant/banners", currentMerchant.bannerImage)
        }
        updateData.bannerImage = req.files.bannerImage[0].filename
      }
    }

    console.log("Final update data:", updateData)

    const merchant = await Merchant.findByIdAndUpdate(merchantId, updateData, {
      new: true,
    })
      .populate("serviceId", "servicesName")
      .populate("serviceSubcategoryIds", "subServicesName")
      .populate("serviceLocationIds")
      .populate("couponIds")

    if (!merchant) {
      return res.status(404).json({
        status: false,
        message: "Failed to update merchant profile",
      })
    }

    console.log("Updated merchant:", merchant)

    res.status(200).json({
      status: true,
      message: "Service profile updated successfully",
      data: merchant,
    })
  } catch (error) {
    console.error("Error updating service profile:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

// Add Service Location
exports.addServiceLocation = async (req, res) => {
  try {
    const merchantId = req.user.id

    const schema = joi.object({
      addressName: joi.string().required(),
      address: joi.string().required(),
      lat: joi.number().required(),
      long: joi.number().required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      })
    }

    const { addressName, address, lat, long } = req.body

    const newLocation = new ServiceLocation({
      merchantId,
      addressName,
      address,
      lat,
      long,
    })

    await newLocation.save()

    // Update merchant's serviceLocationIds
    await Merchant.findByIdAndUpdate(merchantId, {
      $push: { serviceLocationIds: newLocation._id },
    })

    res.status(201).json({
      status: true,
      message: "Service location added successfully",
      data: newLocation,
    })
  } catch (error) {
    console.error("Error adding service location:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

// Update Service Location
exports.updateServiceLocation = async (req, res) => {
  try {
    // const { locationId } = req.query
    const merchantId = req.user.id

    console.log("Request body:", req.body)
    console.log("Request files:", req.files)

    // Parse weeklySchedule if it's a string
    let parsedWeeklySchedule = null
    if (req.body.weeklySchedule) {
      try {
        parsedWeeklySchedule =
          typeof req.body.weeklySchedule === "string" ? JSON.parse(req.body.weeklySchedule) : req.body.weeklySchedule
      } catch (parseError) {
        return res.status(400).json({
          status: false,
          message: "Invalid weeklySchedule format. Must be valid JSON array.",
        })
      }
    }

    // Create validation object with parsed schedule
    const validationData = {
      ...req.body,
      weeklySchedule: parsedWeeklySchedule,
    }

    const schema = joi.object({
      locationId: joi.string().required(),
      capacity: joi.number().optional(),
      floorPlan: joi.string().optional(),
      locationPhone: joi.string().optional(),
      openTwoShifts: joi.boolean().optional(),
      weeklySchedule: joi
        .array()
        .items(
          joi.object({
            day: joi
              .string()
              .valid("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
              .required(),
            morning: joi
              .object({
                from: joi.string().required(),
                to: joi.string().required(),
              })
              .optional(),
            evening: joi
              .object({
                from: joi.string().required(),
                to: joi.string().required(),
              })
              .optional(),
          }),
        )
        .optional(),
      photoDescription: joi.string().optional(),
    })

    const { error } = schema.validate(validationData)
    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      })
    }

    const updateData = { ...req.body }

    // Use parsed schedule in update data
    if (parsedWeeklySchedule) {
      updateData.weeklySchedule = parsedWeeklySchedule
    }

    // Handle media uploads

    const location = await ServiceLocation.findOneAndUpdate({ _id: req.body.locationId, merchantId }, updateData, {
      new: true,
    })

    if (!location) {
      return res.status(404).json({
        status: false,
        message: "Service location not found",
      })
    }

    res.status(200).json({
      status: true,
      message: "Service location updated successfully",
      data: location,
    })
  } catch (error) {
    console.error("Error updating service location:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

// Get Service Location
exports.getServiceLocation = async (req, res) => {
  try {
    const { locationId } = req.query
    const merchantId = req.user.id

    if (!locationId) {
      return res.status(400).json({
        status: false,
        message: "locationId query parameter is required",
      })
    }

    const location = await ServiceLocation.findOne({
      _id: locationId,
      merchantId,
    })

    if (!location) {
      return res.status(404).json({
        status: false,
        message: "Service location not found",
      })
    }

    // Add full URLs for media files (handle both Mongoose docs and plain objects)
    const locationObj = location.toObject ? location.toObject() : location
    if (Array.isArray(locationObj.locationPhotoVideoList)) {
      locationObj.locationPhotoVideoList = locationObj.locationPhotoVideoList.map((media) => ({
        ...(media.toObject ? media.toObject() : media),
        url: media.file ? `${process.env.BASE_URL}/merchant/locations/${media.file}` : undefined,
      }))
    }

    res.status(200).json({
      status: true,
      message: "Service location retrieved successfully",
      data: locationObj,
    })
  } catch (error) {
    console.error("Error getting service location:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

// Get All Service Locations for a Merchant
exports.getAllServiceLocations = async (req, res) => {
  try {
    const merchantId = req.user.id

    const locations = await ServiceLocation.find({
      merchantId,
    }).sort({ createdAt: -1 })

    if (!locations || locations.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No service locations found",
      })
    }

    // Add full URLs for media files
    const locationsWithUrls = locations.map((location) => {
      const locationObj = location.toObject()
      locationObj.locationPhotoVideoList = locationObj.locationPhotoVideoList.map((media) => ({
        ...media,
        url: media.file ? `${process.env.BASE_URL}/merchant/locations/${media.file}` : undefined,
        thumbnailUrl: media.thumbnail ? `${process.env.BASE_URL}/merchant/locations/${media.thumbnail}` : undefined,
      }))
      return locationObj
    })

    res.status(200).json({
      status: true,
      message: "Service locations retrieved successfully",
      data: locationsWithUrls,
    })
  } catch (error) {
    console.error("Error getting service locations:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

// Add more images/videos to a service location by locationId
exports.addLocationMedia = async (req, res) => {
  try {
    const merchantId = req.user.id
    const { locationId, photoDescription, types } = req.body

    // Only require media files and locationId to proceed
    const mediaFiles = req.files.media
    const thumbnailFiles = req.files.thumbnails || []

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(400).json({ status: false, message: "No media files uploaded" })
    }

    // If locationId is missing, cannot proceed
    if (!locationId) {
      return res.status(400).json({ status: false, message: "locationId is required" })
    }

    const location = await ServiceLocation.findOne({ _id: locationId, merchantId })
    if (!location) {
      return res.status(404).json({ status: false, message: "Service location not found" })
    }

    // Use provided type/description or default to empty string
    const newMedia = mediaFiles.map((file, idx) => ({
      file: file.filename,
      mediaType: types || "", // Accept empty string if not provided
      description: photoDescription || "", // Accept empty string if not provided
      thumbnail: thumbnailFiles[idx] ? thumbnailFiles[idx].filename : undefined,
    }))

    location.locationPhotoVideoList = location.locationPhotoVideoList.concat(newMedia)
    await location.save()

    const locationObj = location.toObject()
    locationObj.locationPhotoVideoList = locationObj.locationPhotoVideoList.map((media) => ({
      ...media,
      url: media.file ? `${process.env.BASE_URL}/merchant/locations/${media.file}` : undefined,
      thumbnailUrl: media.thumbnail ? `${process.env.BASE_URL}/merchant/locations/${media.thumbnail}` : undefined,
    }))

    res.status(200).json({
      status: true,
      message: "Media uploaded successfully",
      data: locationObj,
    })
  } catch (error) {
    console.error("Error uploading location media:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

// Update a specific media item by its id in a service location
exports.updateLocationMediaById = async (req, res) => {
  try {
    const merchantId = req.user.id
    const { locationId, mediaId, description } = req.body
    if (!locationId || !mediaId) {
      return res.status(400).json({ status: false, message: "locationId and mediaId are required" })
    }
    const location = await ServiceLocation.findOne({ _id: locationId, merchantId })
    if (!location) {
      return res.status(404).json({ status: false, message: "Service location not found" })
    }
    const mediaItem = location.locationPhotoVideoList.id
      ? location.locationPhotoVideoList.id(mediaId)
      : location.locationPhotoVideoList.find((m) => m._id?.toString() === mediaId || m.id === mediaId)
    if (!mediaItem) {
      return res.status(404).json({ status: false, message: "Media item not found" })
    }
    // Accept empty string for description, update if provided
    if (description !== undefined) mediaItem.description = description
    if (req.file) {
      const fs = require("fs")
      const path = require("path")
      if (mediaItem.file) {
        const oldFilePath = path.join(__dirname, "../public/merchant/locations", mediaItem.file)
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error("Failed to delete old media file:", err)
        })
      }
      mediaItem.file = req.file.filename
      mediaItem.mediaType = req.file.mimetype.startsWith("video/") ? "video" : "photo"
    }
    await location.save()
    const locationObj = location.toObject()
    locationObj.locationPhotoVideoList = locationObj.locationPhotoVideoList.map((media) => ({
      ...media,
      url: media.file ? `${process.env.BASE_URL}/merchant/locations/${media.file}` : undefined,
    }))
    res.status(200).json({
      status: true,
      message: "Media updated successfully",
      data: locationObj,
    })
  } catch (error) {
    console.error("Error updating location media:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.deleteLocationMediaById = async (req, res) => {
  try {
    const merchantId = req.user.id
    const { locationId, mediaId } = req.body
    if (!locationId || !mediaId) {
      return res.status(400).json({ status: false, message: "locationId and mediaId are required" })
    }
    const location = await ServiceLocation.findOne({ _id: locationId, merchantId })
    if (!location) {
      return res.status(404).json({ status: false, message: "Service location not found" })
    }
    const fs = require("fs")
    const path = require("path")
    const mediaToDelete = location.locationPhotoVideoList.find(
      (media) => media._id?.toString() === mediaId || media.id === mediaId,
    )
    if (!mediaToDelete) {
      return res.status(404).json({ status: false, message: "Media item not found" })
    }
    if (mediaToDelete.file) {
      const filePath = path.join(__dirname, "../public/merchant/locations", mediaToDelete.file)
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete media file:", err)
      })
    }
    location.locationPhotoVideoList = location.locationPhotoVideoList.filter(
      (media) => media._id?.toString() !== mediaId && media.id !== mediaId,
    )
    await location.save()
    const locationObj = location.toObject()
    locationObj.locationPhotoVideoList = locationObj.locationPhotoVideoList.map((media) => ({
      ...media,
      url: media.file ? `${process.env.BASE_URL}/merchant/locations/${media.file}` : undefined,
    }))
    res.status(200).json({
      status: true,
      message: "Media deleted successfully",
      data: locationObj,
    })
  } catch (error) {
    console.error("Error deleting location media:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.getMerchantProfile = async (req, res) => {
  try {
    const merchantId = req.user.id
    const merchant = await Merchant.findById(merchantId).select("-password -otp")

    if (!merchant) {
      return res.status(404).json({
        status: false,
        message: "Merchant not found",
      })
    }
    const profileData = merchant.toObject()
    try {
      if (profileData.serviceId) {
        const service = await Services.findById(profileData.serviceId).select("servicesName")
        profileData.serviceId = service || {
          _id: profileData.serviceId,
          servicesName: "Service not found",
        }
      }
      if (Array.isArray(profileData.serviceSubcategoryIds) && profileData.serviceSubcategoryIds.length > 0) {
        const subservices = await Subservices.find({
          _id: { $in: profileData.serviceSubcategoryIds },
        }).select("_id subServicesName")
        profileData.serviceSubcategoryIds = profileData.serviceSubcategoryIds.map((id) => {
          const found = subservices.find((s) => s._id.toString() === id.toString())
          return found
            ? { _id: found._id, subServicesName: found.subServicesName }
            : { _id: id, subServicesName: "Subservice not found" }
        })
      }
      if (Array.isArray(profileData.serviceLocationIds) && profileData.serviceLocationIds.length > 0) {
        const locations = await ServiceLocation.find({
          _id: { $in: profileData.serviceLocationIds },
        })
        profileData.serviceLocationIds =
          locations.length > 0
            ? locations
            : profileData.serviceLocationIds.map((id) => ({
                _id: id,
                locationName: "Location not found",
                locationPhotoVideoList: [],
              }))
      }
      if (Array.isArray(profileData.couponIds) && profileData.couponIds.length > 0) {
        const coupons = await Coupon.find({
          _id: { $in: profileData.couponIds },
        })

        profileData.couponIds =
          coupons.length > 0
            ? coupons
            : profileData.couponIds.map((id) => ({
                _id: id,
                title: "Coupon not found",
              }))
      }
    } catch (populateError) {
      console.error("Error during manual populate:", populateError)
    }
    const docBase = `${process.env.BASE_URL}/merchant/documents`
    const bannerBase = `${process.env.BASE_URL}/merchant/banners`
    if (profileData.businessRegistrationImage) {
      profileData.businessRegistrationImage = `${docBase}/${profileData.businessRegistrationImage}`
    }
    if (profileData.vatRegistrationImage) {
      profileData.vatRegistrationImage = `${docBase}/${profileData.vatRegistrationImage}`
    }
    if (profileData.otherImage) {
      profileData.otherImage = `${docBase}/${profileData.otherImage}`
    }

    if (profileData.bannerImage) {
      profileData.bannerImage = `${bannerBase}/${profileData.bannerImage}`
    }
    if (Array.isArray(profileData.serviceLocationIds)) {
      profileData.serviceLocationIds = profileData.serviceLocationIds.map((location) => {
        if (Array.isArray(location.locationPhotoVideoList)) {
          location.locationPhotoVideoList = location.locationPhotoVideoList.map((media) => ({
            ...media,
            url: `${process.env.BASE_URL}/merchant/locations/${media.type}`,
          }))
        }
        return location
      })
    }

    res.status(200).json({
      status: true,
      message: "Merchant profile retrieved successfully",
      data: profileData,
    })
  } catch (error) {
    console.error("Error getting merchant profile:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

exports.addCoupon = async (req, res) => {
  try {
    const { couponName, discount, validFrom, validTo, description } = req.body
    const schema = joi.object({
      couponName: joi.string().required(),
      discount: joi.number().required(),
      validFrom: joi.string().required(),
      validTo: joi.string().required(),
      description: joi.string().required(),
    })
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).json({ status: false, message: error.details[0].message })
    function parseDDMMYYYY(str) {
      const [dd, mm, yyyy] = str.split("-")
      return new Date(`${yyyy}-${mm}-${dd}`)
    }
    const coupon = new Coupon({
      couponName,
      discount,
      validFrom: parseDDMMYYYY(validFrom),
      validTo: parseDDMMYYYY(validTo),
      description,
      userId: req.user.id,
    })

    await coupon.save()

    res.status(200).json({
      status: true,
      message: "Coupon added successfully",
    })
  } catch (error) {
    console.error("Error while adding coupon:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}

exports.getAllCoupons = async (req, res) => {
  try {
    const merchantId = req.user.id
    const coupons = await Coupon.find({ userId: merchantId }).sort({
      createdAt: -1,
    })
    if (!coupons || coupons.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No coupons found",
        data: [],
      })
    }
    function formatDateToDDMMYYYY(date) {
      if (!date) return ""
      const d = new Date(date)
      const day = String(d.getDate()).padStart(2, "0")
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const year = d.getFullYear()
      return `${day}-${month}-${year}`
    }
    const formattedCoupons = coupons.map((coupon) => {
      const obj = coupon.toObject()
      obj.validFrom = formatDateToDDMMYYYY(obj.validFrom)
      obj.validTo = formatDateToDDMMYYYY(obj.validTo)
      return obj
    })
    res.status(200).json({
      status: true,
      message: "Coupons retrieved successfully",
      data: formattedCoupons,
    })
  } catch (error) {
    console.error("Error getting all coupons:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

exports.deleteCoupon = async (req, res) => {
  try {
    const merchantId = req.user.id
    const { couponId } = req.body

    if (!couponId) {
      return res.status(400).json({
        status: false,
        message: "couponId is required",
      })
    }
    const coupon = await Coupon.findOne({ _id: couponId, userId: merchantId })
    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found or not authorized",
      })
    }
    await Coupon.deleteOne({ _id: couponId })
    res.status(200).json({
      status: true,
      message: "Coupon deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

exports.getCouponById = async (req, res) => {
  try {
    const merchantId = req.user.id
    const couponId = req.query.couponId

    if (!couponId) {
      return res.status(400).json({
        status: false,
        message: "couponId is required in query",
      })
    }
    const coupon = await Coupon.findOne({ _id: couponId, userId: merchantId })
    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found or not authorized",
      })
    }
    function formatDateToDDMMYYYY(date) {
      if (!date) return ""
      const d = new Date(date)
      const day = String(d.getDate()).padStart(2, "0")
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const year = d.getFullYear()
      return `${day}-${month}-${year}`
    }
    const couponObj = coupon.toObject()
    couponObj.validFrom = formatDateToDDMMYYYY(couponObj.validFrom)
    couponObj.validTo = formatDateToDDMMYYYY(couponObj.validTo)
    res.status(200).json({
      status: true,
      message: "Coupon retrieved successfully",
      data: couponObj,
    })
  } catch (error) {
    console.error("Error getting coupon by id:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

// Update a coupon by its ID for the current merchant
exports.updateCoupon = async (req, res) => {
  try {
    const merchantId = req.user.id
    const { couponId, couponName, discount, validFrom, validTo, description } = req.body

    if (!couponId) {
      return res.status(400).json({
        status: false,
        message: "couponId is required",
      })
    }
    const schema = require("joi").object({
      couponId: require("joi").string().required(),
      couponName: require("joi").string().optional(),
      discount: require("joi").number().optional(),
      validFrom: require("joi").string().optional(),
      validTo: require("joi").string().optional(),
      description: require("joi").string().optional(),
    })
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      })
    }
    const coupon = await Coupon.findOne({ _id: couponId, userId: merchantId })
    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found or not authorized",
      })
    }
    const updateData = {}
    if (couponName !== undefined) updateData.couponName = couponName
    if (discount !== undefined) updateData.discount = discount
    if (validFrom !== undefined) {
      const [dd, mm, yyyy] = validFrom.split("-")
      updateData.validFrom = new Date(`${yyyy}-${mm}-${dd}`)
    }
    if (validTo !== undefined) {
      const [dd, mm, yyyy] = validTo.split("-")
      updateData.validTo = new Date(`${yyyy}-${mm}-${dd}`)
    }
    if (description !== undefined) updateData.description = description
    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, { $set: updateData }, { new: true })
    res.status(200).json({
      status: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    })
  } catch (error) {
    console.error("Error updating coupon:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

exports.getNearbyRestaurantMerchants = async (req, res) => {
  try {
    const { lat, long, radius } = req.query
    if (!lat || !long) {
      return res.status(400).json({
        status: false,
        message: "lat and long query parameters are required",
      })
    }
    const searchRadius = radius ? Number.parseFloat(radius) : 10 // default 10 km
    const locations = await ServiceLocation.find({
      lat: { $exists: true },
      long: { $exists: true },
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(long), Number.parseFloat(lat)],
          },
          $maxDistance: searchRadius * 1000,
        },
      },
    }).catch(() => [])
    let filteredLocations = locations
    if (!locations.length) {
      // fallback: get all, then filter manually
      const allLocations = await ServiceLocation.find({ lat: { $exists: true }, long: { $exists: true } })
      function haversine(lat1, lon1, lat2, lon2) {
        function toRad(x) {
          return (x * Math.PI) / 180
        }
        const R = 6371 // km
        const dLat = toRad(lat2 - lat1)
        const dLon = toRad(lon2 - lon1)
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
      }
      filteredLocations = allLocations.filter((loc) => {
        if (typeof loc.lat !== "number" || typeof loc.long !== "number") return false
        return haversine(Number.parseFloat(lat), Number.parseFloat(long), loc.lat, loc.long) <= searchRadius
      })
    }

    // Get unique merchantIds from locations
    const merchantIds = [...new Set(filteredLocations.map((loc) => loc.merchantId.toString()))]
    if (!merchantIds.length) {
      return res.status(404).json({
        status: false,
        message: "No restaurant merchants found nearby",
        data: [],
      })
    }

    const merchants = await Merchant.find({ _id: { $in: merchantIds } }).select("-password -otp")

    res.status(200).json({
      status: true,
      message: "Nearby restaurant merchants retrieved successfully",
      data: merchants,
    })
  } catch (error) {
    console.error("Error getting nearby restaurant merchants:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

// New: Get a specific media item by its ID
exports.getLocationMediaById = async (req, res) => {
  try {
    const merchantId = req.user.id
    const { locationId, mediaId } = req.query

    // Validate input
    const schema = joi.object({
      locationId: joi.string().required(),
      mediaId: joi.string().required(),
    })
    const { error } = schema.validate({ locationId, mediaId })
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message })
    }

    const location = await ServiceLocation.findOne({ _id: locationId, merchantId })
    if (!location) {
      return res.status(404).json({ status: false, message: "Service location not found or unauthorized" })
    }

    const mediaItem = location.locationPhotoVideoList.find(
      (media) => media._id?.toString() === mediaId || media.id === mediaId,
    )

    if (!mediaItem) {
      return res.status(404).json({ status: false, message: "Media item not found in this location" })
    }

    // Construct full URLs
    const mediaItemWithUrls = {
      ...mediaItem.toObject(),
      url: mediaItem.file ? `${process.env.BASE_URL}/merchant/locations/${mediaItem.file}` : undefined,
      thumbnailUrl: mediaItem.thumbnail
        ? `${process.env.BASE_URL}/merchant/locations/${mediaItem.thumbnail}`
        : undefined,
    }

    res.status(200).json({
      status: true,
      message: "Media item retrieved successfully",
      data: mediaItemWithUrls,
    })
  } catch (error) {
    console.error("Error getting location media by ID:", error)
    res.status(500).json({ status: false, message: "Internal server error" })
  }
}
