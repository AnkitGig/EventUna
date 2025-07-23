const { createEmailTransporter } = require("../config/email")
const fs = require("fs")
const path = require("path")
const handlebars = require("handlebars")

class EmailService {
  constructor() {
    this.transporter = createEmailTransporter()
    this.isRealEmailMode = !!this.transporter

    if (this.isRealEmailMode) {
      console.log("📧 EmailService initialized in REAL EMAIL mode")
    } else {
      console.log("📧 EmailService initialized in DEVELOPMENT mode (console logging only)")
    }
  }

  // Load and compile email template
  loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.hbs`)
      const templateSource = fs.readFileSync(templatePath, "utf8")
      const template = handlebars.compile(templateSource)
      return template(data)
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error)
      return this.getDefaultTemplate(templateName, data)
    }
  }

  // Fallback HTML template
  getDefaultTemplate(templateName, data) {
    const templates = {
      "application-confirmation": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">Application Submitted Successfully!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.parentName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for submitting an application for <strong>${data.childName}</strong> to <strong>${data.schoolName}</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Application Details:</h3>
              <p style="margin: 5px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
              <p style="margin: 5px 0;"><strong>Child's Name:</strong> ${data.childName}</p>
              <p style="margin: 5px 0;"><strong>School:</strong> ${data.schoolName}</p>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h3 style="color: #1e40af; margin-top: 0;">What happens next?</h3>
              <ul style="color: #1e40af; margin: 10px 0; padding-left: 20px;">
                <li>The school admin will review your application</li>
                <li>You will receive an email notification once reviewed</li>
                <li>If approved, you'll get login credentials to track your application</li>
                <li>You can then communicate with teachers and track your child's progress</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
              If you have any questions, please contact the school directly.
            </p>
          </div>
        </div>
      `,
      "application-rejection": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626; text-align: center; margin-bottom: 30px;">Application Update</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.parentName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your interest in <strong>${data.schoolName}</strong> for <strong>${data.childName}</strong>.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">After careful consideration, we regret to inform you that we are unable to offer admission at this time.</p>
            
            ${
              data.reason
                ? `
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="color: #dc2626; margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
            </div>
            `
                : ""
            }
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">We encourage you to apply again in the future or consider other schools in our network.</p>
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
              Thank you for considering ${data.schoolName}.
            </p>
          </div>
        </div>
      `,
      "parent-welcome": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">🎉 Welcome to ${data.schoolName}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.firstName} ${data.lastName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Congratulations! Your application has been approved and your parent account has been created.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">🔐 Your Login Credentials:</h3>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 14px;">${data.temporaryPassword}</code></p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-weight: bold;">⚠️ IMPORTANT: You must change your password after first login for security.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Login to Your Account</a>
            </div>
            
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #065f46; margin-top: 0;">🌟 What you can do with your account:</h3>
              <ul style="color: #065f46; margin: 10px 0; padding-left: 20px;">
                <li>View your child's daily activities and progress</li>
                <li>Track diaper changes, meals, and sleep patterns</li>
                <li>Communicate directly with teachers</li>
                <li>View photos and daily reports</li>
                <li>Schedule video calls with teachers</li>
                <li>Receive real-time notifications</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
              If you have any questions, contact us at ${process.env.SUPPORT_EMAIL || "support@school.com"}
            </p>
          </div>
        </div>
      `,
      "teacher-welcome": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #059669; text-align: center; margin-bottom: 30px;">Welcome to ${data.schoolName}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.firstName} ${data.lastName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Your teacher account has been created successfully!</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Your Login Credentials:</h3>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${data.employeeId || "N/A"}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${data.temporaryPassword}</code></p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${data.subject || "Not assigned"}</p>
            </div>
            <p style="font-size: 14px; color: #dc2626; font-weight: bold;">⚠️ Please change your password after first login for security.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login Now</a>
            </div>
          </div>
        </div>
      `,
      "password-reset": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626; text-align: center; margin-bottom: 30px;">Password Reset</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.firstName} ${data.lastName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Your password has been reset by an administrator.</p>
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="color: #1f2937; margin-top: 0;">Your New Temporary Password:</h3>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 5px 0;"><strong>New Password:</strong> <code style="background-color: #fee2e2; padding: 2px 6px; border-radius: 4px;">${data.temporaryPassword}</code></p>
            </div>
            <p style="font-size: 14px; color: #dc2626; font-weight: bold;">🔒 You must change this password immediately after login.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Login & Change Password</a>
            </div>
          </div>
        </div>
      `,
      "password-reset-otp": `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; text-align: center; margin-bottom: 30px;">Password Reset OTP</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.firstName} ${data.lastName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">We received a request to reset your password. Please use the OTP below to verify your identity:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h2 style="color: #1f2937; letter-spacing: 5px; font-size: 32px; margin: 10px 0;">${data.otp}</h2>
              <p style="color: #6b7280; margin: 5px 0;">This OTP is valid for 10 minutes</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-weight: bold;">⚠️ If you did not request a password reset, please ignore this email or contact support immediately.</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
              For security reasons, please do not share this OTP with anyone.
            </p>
          </div>
        </div>
      `,
    }
    return templates[templateName] || `<p>Email template not found for ${templateName}</p>`
  }

  // Send email method
  async sendEmail(to, subject, htmlContent, textContent = null) {
    const emailData = {
      from: process.env.EMAIL_FROM || "School Management System <noreply@school.com>",
      to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    }

    if (!this.isRealEmailMode) {
      // Development mode - log to console
      console.log("📧 [DEV MODE] Email would be sent:")
      console.log("📧 To:", to)
      console.log("📧 Subject:", subject)
      console.log("📧 Content:", textContent || "HTML content (check logs)")
      return { success: true, messageId: "dev-mode-" + Date.now() }
    }

    try {
      console.log("📧 Attempting to send REAL email...")
      console.log("📧 To:", to)
      console.log("📧 Subject:", subject)

      const info = await this.transporter.sendMail(emailData)

      console.log("✅ SUCCESS! Email SENT to Gmail inbox:", to)
      console.log("📧 Message ID:", info.messageId)
      console.log("📧 Response:", info.response)

      return { success: true, messageId: info.messageId, response: info.response }
    } catch (error) {
      console.error("❌ FAILED to send email:", error)
      console.error("📧 Error details:", {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      })
      return { success: false, error: error.message }
    }
  }

  // Send OTP email for password reset
  async sendOTPEmail(data) {
    const htmlContent = this.loadTemplate("password-reset-otp", data)
    const subject = "Password Reset OTP - Kiddo Loom"

    return await this.sendEmail(data.email, subject, htmlContent)
  }

  // Send application confirmation email
  async sendApplicationConfirmationEmail(data) {
    const htmlContent = this.loadTemplate("application-confirmation", data)
    const subject = `Application Submitted - ${data.schoolName}`

    return await this.sendEmail(data.email, subject, htmlContent)
  }

  // Send application rejection email
  async sendApplicationRejectionEmail(data) {
    const htmlContent = this.loadTemplate("application-rejection", data)
    const subject = `Application Update - ${data.schoolName}`

    return await this.sendEmail(data.email, subject, htmlContent)
  }

  // Send parent welcome email
  async sendParentWelcomeEmail(data) {
    const htmlContent = this.loadTemplate("parent-welcome", data)
    const subject = `Welcome to ${data.schoolName} - Your Account is Ready!`

    return await this.sendEmail(data.email, subject, htmlContent)
  }

  // Send teacher welcome email
  async sendTeacherWelcomeEmail(data) {
    const htmlContent = this.loadTemplate("teacher-welcome", data)
    const subject = `Welcome to ${data.schoolName} - Teacher Account Created!`

    return await this.sendEmail(data.email, subject, htmlContent)
  }

  // Send password reset email
  async sendPasswordResetEmail(data) {
    const htmlContent = this.loadTemplate("password-reset", data)
    const subject = "Password Reset - Action Required"

    return await this.sendEmail(data.email, subject, htmlContent)
  }

  // Send account status email
  async sendAccountStatusEmail(data) {
    const statusMessages = {
      active: "Your account has been activated!",
      suspended: "Your account has been suspended.",
      pending: "Your account is pending approval.",
      inactive: "Your account has been deactivated.",
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Account Status Update</h1>
        <p>Dear ${data.firstName} ${data.lastName},</p>
        <p>${statusMessages[data.accountStatus] || "Your account status has been updated."}</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
        <p>If you have any questions, please contact support.</p>
      </div>
    `

    const subject = `Account Status Update - ${data.accountStatus.toUpperCase()}`
    return await this.sendEmail(data.email, subject, htmlContent)
  }

  // Send bulk email
  async sendBulkEmail(recipients, subject, content) {
    const results = []

    for (const recipient of recipients) {
      try {
        const personalizedContent = content
          .replace(/{{firstName}}/g, recipient.firstName)
          .replace(/{{lastName}}/g, recipient.lastName)
          .replace(/{{email}}/g, recipient.email)

        const result = await this.sendEmail(recipient.email, subject, personalizedContent)
        results.push({
          email: recipient.email,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        })
      } catch (error) {
        results.push({
          email: recipient.email,
          success: false,
          error: error.message,
        })
      }
    }

    return { results }
  }
}

// Export singleton instance
module.exports = new EmailService()
