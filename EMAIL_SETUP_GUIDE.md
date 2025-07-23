# Email Setup Guide

This guide explains how to configure email functionality for the School Management API.

## Overview

The API uses Nodemailer with Handlebars templates to send professional emails for:
- Welcome emails with credentials for new parents and teachers
- Password reset notifications
- Account status updates
- Bulk announcements

## Email Configuration

### 1. Gmail Configuration (Recommended for Production)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update .env file**:
   \`\`\`env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=School Management System <noreply@school.com>
   \`\`\`

### 2. Custom SMTP Configuration

For other email providers (SendGrid, Mailgun, etc.):
\`\`\`env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
\`\`\`

### 3. Development Configuration

For development, the system uses Ethereal Email (fake SMTP):
- No configuration needed
- Emails are captured but not sent
- Check console for preview URLs

## Email Templates

### Template Structure
\`\`\`
templates/
└── emails/
    ├── parent-welcome.hbs
    ├── teacher-welcome.hbs
    └── password-reset.hbs
\`\`\`

### Template Features
- **Responsive Design**: Works on all devices
- **Professional Styling**: Branded email templates
- **Dynamic Content**: Handlebars variables for personalization
- **Security Warnings**: Clear instructions for password changes

## Email Types

### 1. Parent Welcome Email
**Sent when**: Admin creates parent account
**Contains**:
- Welcome message
- Login credentials (temporary password)
- Security instructions
- Login URL
- Support contact

### 2. Teacher Welcome Email
**Sent when**: Admin creates teacher account
**Contains**:
- Welcome message
- Login credentials
- Employee ID and subject (if provided)
- Security instructions
- Login URL

### 3. Password Reset Email
**Sent when**: Admin resets user password
**Contains**:
- Password reset notification
- New temporary password
- Security warning
- Login instructions

### 4. Account Status Email
**Sent when**: Admin changes account status
**Contains**:
- Status change notification
- Reason (if provided)
- Support contact information

## API Usage

### Create Parent with Email
\`\`\`javascript
POST /api/admin/create-parent
{
  "email": "parent@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+91-9876543210",
  "schoolName": "Bright Minds Academy",
  "sendEmail": true
}
\`\`\`

### Create Teacher with Email
\`\`\`javascript
POST /api/admin/create-teacher
{
  "email": "teacher@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "subject": "Mathematics",
  "employeeId": "EMP001",
  "schoolName": "Bright Minds Academy",
  "sendEmail": true
}
\`\`\`

### Send Bulk Email
\`\`\`javascript
POST /api/admin/send-bulk-email
{
  "role": "parent",
  "subject": "Important Announcement",
  "content": "Dear {{firstName}}, This is an important message..."
}
\`\`\`

## Environment Variables

\`\`\`env
# Email Configuration
EMAIL_FROM=School Management System <noreply@school.com>
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Support Email
SUPPORT_EMAIL=support@school.com

# Node Environment
NODE_ENV=production
\`\`\`

## Testing Email Functionality

### 1. Test Email Connection
The server automatically tests email connection on startup:
\`\`\`
✅ Email service is ready
\`\`\`

### 2. Development Testing
In development mode:
- Emails are sent to Ethereal Email
- Check console for preview URLs
- No real emails are sent

### 3. Production Testing
1. Create test accounts
2. Check email delivery
3. Verify template rendering
4. Test all email types

## Security Considerations

### 1. Email Security
- Use App Passwords for Gmail
- Never commit email credentials to version control
- Use environment variables for all sensitive data

### 2. Template Security
- Sanitize all user input in templates
- Validate email addresses before sending
- Rate limit email sending to prevent abuse

### 3. Content Security
- Include unsubscribe links (for bulk emails)
- Clear sender identification
- Professional email formatting

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check email credentials
   - Verify App Password for Gmail
   - Ensure 2FA is enabled

2. **Connection Timeout**
   - Check SMTP host and port
   - Verify firewall settings
   - Test network connectivity

3. **Template Not Found**
   - Check template file paths
   - Verify Handlebars syntax
   - Ensure templates directory exists

4. **Emails Not Delivered**
   - Check spam folders
   - Verify recipient email addresses
   - Check email provider limits

### Debug Mode
Enable debug logging:
\`\`\`env
DEBUG=nodemailer:*
\`\`\`

## Best Practices

1. **Email Deliverability**
   - Use professional sender addresses
   - Include proper headers
   - Avoid spam trigger words

2. **Template Management**
   - Keep templates consistent
   - Use responsive design
   - Test across email clients

3. **User Experience**
   - Clear call-to-action buttons
   - Mobile-friendly design
   - Helpful support information

4. **Performance**
   - Queue emails for bulk sending
   - Implement retry logic
   - Monitor email delivery rates

## Production Deployment

1. **Email Provider Setup**
   - Choose reliable email service (SendGrid, Mailgun)
   - Configure SPF, DKIM, DMARC records
   - Set up dedicated IP (if needed)

2. **Monitoring**
   - Track email delivery rates
   - Monitor bounce rates
   - Set up alerts for failures

3. **Compliance**
   - Include unsubscribe options
   - Follow GDPR/CAN-SPAM regulations
   - Maintain email preferences
