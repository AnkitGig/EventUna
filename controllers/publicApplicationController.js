const PublicApplication = require("../models/PublicApplication")
const School = require("../models/School")
const User = require("../models/User")
const Parent = require("../models/Parent")
const emailService = require("../services/emailService")
const crypto = require("crypto")

/**
 * ===========================================
 * 📝 PUBLIC APPLICATION APIS - NO LOGIN REQUIRED
 * ===========================================
 * These APIs handle public school applications without user authentication
 * Based on Figma screens showing public application flow
 */

// @desc    Submit school application (Public - No Login Required)
// @route   POST /api/public/applications
// @access  Public
const submitPublicApplication = async (req, res) => {
  try {
    const { schoolId, childName, childAge, parentName, phoneNumber, emailAddress, emergencyContact, address, notes } =
      req.body

    // Validation
    if (
      !schoolId ||
      !childName ||
      !childAge ||
      !parentName ||
      !phoneNumber ||
      !emailAddress ||
      !emergencyContact ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
        requiredFields: [
          "schoolId",
          "childName",
          "childAge",
          "parentName",
          "phoneNumber",
          "emailAddress",
          "emergencyContact",
          "address",
        ],
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailAddress)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      })
    }

    // Validate child age
    if (childAge < 1 || childAge > 18) {
      return res.status(400).json({
        success: false,
        message: "Child age must be between 1 and 18 years",
      })
    }

    // Verify school exists and is active
    const school = await School.findById(schoolId)
    if (!school || !school.isActive) {
      return res.status(404).json({
        success: false,
        message: "School not found or not accepting applications",
      })
    }

    // Check if application already exists for this email and school
    const existingApplication = await PublicApplication.findOne({
      emailAddress: emailAddress.toLowerCase(),
      schoolId,
      status: { $in: ["pending", "approved", "account_created"] },
    })

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "An application for this school already exists with this email address",
        existingApplication: {
          id: existingApplication._id,
          status: existingApplication.status,
          submittedAt: existingApplication.submittedAt,
        },
      })
    }

    // Capture request metadata
    const sourceIP = req.ip || req.connection.remoteAddress
    const userAgent = req.get("User-Agent")
    const referrer = req.get("Referrer")

    // Create public application
    const application = new PublicApplication({
      schoolId,
      childName: childName.trim(),
      childAge: Number.parseInt(childAge),
      parentName: parentName.trim(),
      phoneNumber: phoneNumber.trim(),
      emailAddress: emailAddress.toLowerCase().trim(),
      emergencyContact: emergencyContact.trim(),
      address: address.trim(),
      notes: notes?.trim() || "",
      sourceIP,
      userAgent,
      referrer,
    })

    await application.save()

    // Populate school details for response
    await application.populate("schoolId", "name address contactInfo images")

    // Send confirmation email to parent
    try {
      await emailService.sendApplicationConfirmationEmail({
        email: application.emailAddress,
        parentName: application.parentName,
        childName: application.childName,
        schoolName: school.name,
        applicationId: application._id,
      })
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError)
      // Don't fail the application if email fails
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully! You will receive a confirmation email shortly.",
      data: {
        applicationId: application._id,
        status: application.status,
        submittedAt: application.submittedAt,
        school: {
          id: school._id,
          name: school.name,
          address: school.address,
          contactInfo: school.contactInfo,
        },
        child: {
          name: application.childName,
          age: application.childAge,
        },
        parent: {
          name: application.parentName,
          email: application.emailAddress,
          phone: application.phoneNumber,
        },
        nextSteps: [
          "Your application has been submitted to " + school.name,
          "The school admin will review your application",
          "You will receive login credentials via email once approved",
          "You can then track your application status online",
        ],
      },
    })
  } catch (error) {
    console.error("Submit public application error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to submit application. Please try again.",
      error: error.message,
    })
  }
}

// @desc    Check application status (Public - No Login Required)
// @route   GET /api/public/applications/status/:applicationId
// @access  Public
const checkApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params
    const { email } = req.query

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required to check application status",
      })
    }

    const application = await PublicApplication.findOne({
      _id: applicationId,
      emailAddress: email.toLowerCase(),
    }).populate("schoolId", "name address contactInfo images")

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found or email doesn't match",
      })
    }

    const statusMessages = {
      pending: "Your application is under review",
      approved: "Congratulations! Your application has been approved",
      rejected: "Unfortunately, your application was not approved",
      account_created: "Your account has been created! Check your email for login credentials",
    }

    res.json({
      success: true,
      data: {
        applicationId: application._id,
        status: application.status,
        statusMessage: statusMessages[application.status],
        submittedAt: application.submittedAt,
        reviewedAt: application.reviewedAt,
        accountCreated: application.parentAccountCreated,
        school: {
          name: application.schoolId.name,
          address: application.schoolId.address,
          contactInfo: application.schoolId.contactInfo,
        },
        child: {
          name: application.childName,
          age: application.childAge,
        },
        parent: {
          name: application.parentName,
          email: application.emailAddress,
          phone: application.phoneNumber,
        },
      },
    })
  } catch (error) {
    console.error("Check application status error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to check application status",
      error: error.message,
    })
  }
}

// @desc    Get application by email (Public - No Login Required)
// @route   GET /api/public/applications/by-email/:email
// @access  Public
const getApplicationsByEmail = async (req, res) => {
  try {
    const { email } = req.params

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      })
    }

    const applications = await PublicApplication.find({
      emailAddress: email.toLowerCase(),
    })
      .populate("schoolId", "name address contactInfo images")
      .sort({ submittedAt: -1 })

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No applications found for this email address",
      })
    }

    const formattedApplications = applications.map((app) => ({
      applicationId: app._id,
      status: app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      accountCreated: app.parentAccountCreated,
      school: {
        name: app.schoolId.name,
        address: app.schoolId.address,
        image: app.schoolId.images?.[0]?.url,
      },
      child: {
        name: app.childName,
        age: app.childAge,
      },
    }))

    res.json({
      success: true,
      data: {
        applications: formattedApplications,
        total: applications.length,
        email: email,
      },
    })
  } catch (error) {
    console.error("Get applications by email error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    })
  }
}

module.exports = {
  submitPublicApplication,
  checkApplicationStatus,
  getApplicationsByEmail,
}
