const nodemailer = require("nodemailer")

// Create email transporter
const createEmailTransporter = () => {
  // Check if we have email credentials
  const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS

  if (!hasEmailCredentials) {
    console.log("📧 Using development email mode - emails will be logged only")
    console.log("💡 To send real emails: Set EMAIL_USER and EMAIL_PASS in .env file")
    return null
  }

  console.log("📧 Using Gmail SMTP for email delivery")

  // Create transporter with Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email configuration error:", error)
    } else {
      console.log("✅ Email service is ready - emails will be sent via Gmail SMTP")
    }
  })

  return transporter
}

module.exports = {
  createEmailTransporter,
}
