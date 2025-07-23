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
// Signup
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

    if (!user.isVerified) return res.status(403).json({ status: false, message: "Account not verified" })

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

    res.status(200).json({ status: true, message: "Services fetched successfully", services })
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

    res.status(200).json({ status: true, message: "subservices fetched successfully", services })
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

    const merchant = await Merchant.findByIdAndUpdate(merchantId, updateData, { new: true })
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
    await Merchant.findByIdAndUpdate(merchantId, { $push: { serviceLocationIds: newLocation._id } })

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
    const { locationId } = req.params
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
    if (req.files && req.files.length > 0) {
      const mediaList = req.files.map((file) => ({
        type: file.filename,
        mediaType: file.mimetype.startsWith("video/") ? "video" : "photo",
        description: req.body.photoDescription || "",
      }))
      updateData.locationPhotoVideoList = mediaList
    }

    const location = await ServiceLocation.findOneAndUpdate({ _id: locationId, merchantId }, updateData, { new: true })

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
    const { locationId } = req.params
    const merchantId = req.user.id

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

    // Add full URLs for media files
    location.locationPhotoVideoList = location.locationPhotoVideoList.map((media) => ({
      ...media.toObject(),
      url: `${process.env.BASE_URL}/merchant/locations/${media.type}`,
    }))

    res.status(200).json({
      status: true,
      message: "Service location retrieved successfully",
      data: location,
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
        url: `${process.env.BASE_URL}/merchant/locations/${media.type}`,
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

// Add Coupon
exports.addCoupon = async (req, res) => {
  try {
    const merchantId = req.user.id

    const schema = joi.object({
      couponName: joi.string().required(),
      discount: joi.number().min(0).max(100).required(),
      validFrom: joi.date().required(),
      validTo: joi.date().greater(joi.ref("validFrom")).required(),
      description: joi.string().optional(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      })
    }

    const { couponName, discount, validFrom, validTo, description } = req.body

    const newCoupon = new Coupon({
      merchantId,
      couponName,
      discount,
      validFrom,
      validTo,
      description,
    })

    await newCoupon.save()

    // Update merchant's couponIds
    await Merchant.findByIdAndUpdate(merchantId, { $push: { couponIds: newCoupon._id } })

    res.status(201).json({
      status: true,
      message: "Coupon added successfully",
      data: newCoupon,
    })
  } catch (error) {
    console.error("Error adding coupon:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

// Get Coupon List
exports.getCouponList = async (req, res) => {
  try {
    const merchantId = req.user.id

    const coupons = await Coupon.find({ merchantId }).sort({ createdAt: -1 })

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No coupons found",
      })
    }

    res.status(200).json({
      status: true,
      message: "Coupons retrieved successfully",
      data: coupons,
    })
  } catch (error) {
    console.error("Error getting coupon list:", error)
    res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

// Get Merchant Profile - FIXED VERSION
exports.getMerchantProfile = async (req, res) => {
  try {
    const merchantId = req.user.id;

    // Fetch merchant and exclude sensitive fields
    const merchant = await Merchant.findById(merchantId).select("-password -otp");

    if (!merchant) {
      return res.status(404).json({
        status: false,
        message: "Merchant not found",
      });
    }

    const profileData = merchant.toObject();

    try {
      // Populate serviceId
      if (profileData.serviceId) {
        const service = await Services.findById(profileData.serviceId).select("servicesName");
        profileData.serviceId = service || { _id: profileData.serviceId, servicesName: "Service not found" };
      }

      // Populate serviceSubcategoryIds
      if (Array.isArray(profileData.serviceSubcategoryIds) && profileData.serviceSubcategoryIds.length > 0) {
        const subservices = await Subservices.find({
          _id: { $in: profileData.serviceSubcategoryIds },
        }).select("_id subServicesName");

        // Map to ensure all IDs are present, even if not found
        profileData.serviceSubcategoryIds = profileData.serviceSubcategoryIds.map(id => {
          const found = subservices.find(s => s._id.toString() === id.toString());
          return found
            ? { _id: found._id, subServicesName: found.subServicesName }
            : { _id: id, subServicesName: "Subservice not found" };
        });
      }

      // Populate serviceLocationIds
      if (Array.isArray(profileData.serviceLocationIds) && profileData.serviceLocationIds.length > 0) {
        const locations = await ServiceLocation.find({
          _id: { $in: profileData.serviceLocationIds },
        });

        profileData.serviceLocationIds = locations.length > 0
          ? locations
          : profileData.serviceLocationIds.map(id => ({ _id: id, locationName: "Location not found", locationPhotoVideoList: [] }));
      }


      // Populate couponIds
      if (Array.isArray(profileData.couponIds) && profileData.couponIds.length > 0) {
        const coupons = await Coupon.find({
          _id: { $in: profileData.couponIds },
        });

        profileData.couponIds = coupons.length > 0
          ? coupons
          : profileData.couponIds.map(id => ({ _id: id, title: "Coupon not found" }));
      }
    } catch (populateError) {
      console.error("Error during manual populate:", populateError);
    }

    // Add full URLs for document images
    const docBase = `${process.env.BASE_URL}/merchant/documents`;
    const bannerBase = `${process.env.BASE_URL}/merchant/banners`;

    if (profileData.businessRegistrationImage) {
      profileData.businessRegistrationImage = `${docBase}/${profileData.businessRegistrationImage}`;
    }

    if (profileData.vatRegistrationImage) {
      profileData.vatRegistrationImage = `${docBase}/${profileData.vatRegistrationImage}`;
    }

    if (profileData.otherImage) {
      profileData.otherImage = `${docBase}/${profileData.otherImage}`;
    }

    if (profileData.bannerImage) {
      profileData.bannerImage = `${bannerBase}/${profileData.bannerImage}`;
    }

    // Add media URLs to service locations
    if (Array.isArray(profileData.serviceLocationIds)) {
      profileData.serviceLocationIds = profileData.serviceLocationIds.map((location) => {
        if (Array.isArray(location.locationPhotoVideoList)) {
          location.locationPhotoVideoList = location.locationPhotoVideoList.map((media) => ({
            ...media,
            url: `${process.env.BASE_URL}/merchant/locations/${media.type}`,
          }));
        }
        return location;
      });
    }

    res.status(200).json({
      status: true,
      message: "Merchant profile retrieved successfully",
      data: profileData,
    });
  } catch (error) {
    console.error("Error getting merchant profile:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
