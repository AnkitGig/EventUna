# File Upload Guide

This guide explains how to use the file upload functionality in the School Management API.

## Overview

The API uses Multer middleware for handling file uploads with the following features:
- Multiple file type support (images, documents)
- File size validation
- Secure file storage
- Automatic directory creation
- File cleanup utilities

## Upload Types

### 1. Profile Images
- **Endpoint**: `POST /api/upload/profile`
- **Field Name**: `profileImage`
- **Allowed Types**: JPEG, JPG, PNG, GIF, WEBP
- **Max Size**: 5MB
- **Storage**: `/uploads/profiles/`

### 2. Child Images
- **Endpoint**: `POST /api/upload/child`
- **Field Name**: `childImage`
- **Allowed Types**: JPEG, JPG, PNG, GIF, WEBP
- **Max Size**: 5MB
- **Storage**: `/uploads/children/`

### 3. School Images
- **Endpoint**: `POST /api/upload/school`
- **Field Name**: `schoolImages`
- **Allowed Types**: JPEG, JPG, PNG, GIF, WEBP
- **Max Size**: 10MB per file
- **Max Files**: 10 files
- **Storage**: `/uploads/schools/`
- **Access**: Admin only

### 4. Documents
- **Endpoint**: `POST /api/upload/documents`
- **Field Name**: `documents`
- **Allowed Types**: PDF, DOC, DOCX, TXT
- **Max Size**: 10MB per file
- **Max Files**: 5 files
- **Storage**: `/uploads/documents/`

### 5. Gallery Images
- **Endpoint**: `POST /api/upload/gallery`
- **Field Name**: `galleryImages`
- **Allowed Types**: JPEG, JPG, PNG, GIF, WEBP
- **Max Size**: 10MB per file
- **Max Files**: 20 files
- **Storage**: `/uploads/gallery/`

## Usage Examples

### Upload Profile Image (JavaScript/Fetch)
\`\`\`javascript
const formData = new FormData()
formData.append('profileImage', fileInput.files[0])

fetch('/api/upload/profile', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
\`\`\`

### Upload Multiple School Images
\`\`\`javascript
const formData = new FormData()
for (let i = 0; i < fileInput.files.length; i++) {
  formData.append('schoolImages', fileInput.files[i])
}

fetch('/api/upload/school', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
\`\`\`

### Update Child with Image
\`\`\`javascript
const formData = new FormData()
formData.append('childImage', fileInput.files[0])
formData.append('name', 'Updated Child Name')
formData.append('age', '5')

fetch('/api/parents/children/CHILD_ID/image', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
})
\`\`\`

## cURL Examples

### Upload Profile Image
\`\`\`bash
curl -X POST http://localhost:5000/api/upload/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profileImage=@/path/to/image.jpg"
\`\`\`

### Upload Documents
\`\`\`bash
curl -X POST http://localhost:5000/api/upload/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "documents=@/path/to/document1.pdf" \
  -F "documents=@/path/to/document2.pdf"
\`\`\`

## Response Format

### Single File Upload
\`\`\`json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "filename": "profileImage-1640995200000-123456789.jpg",
    "originalName": "profile.jpg",
    "size": 1024000,
    "url": "http://localhost:5000/uploads/profiles/profileImage-1640995200000-123456789.jpg",
    "path": "/uploads/profiles/profileImage-1640995200000-123456789.jpg"
  }
}
\`\`\`

### Multiple Files Upload
\`\`\`json
{
  "success": true,
  "message": "3 school images uploaded successfully",
  "data": [
    {
      "filename": "schoolImages-1640995200000-123456789.jpg",
      "originalName": "school1.jpg",
      "size": 2048000,
      "url": "http://localhost:5000/uploads/schools/schoolImages-1640995200000-123456789.jpg",
      "path": "/uploads/schools/schoolImages-1640995200000-123456789.jpg"
    }
  ]
}
\`\`\`

## File Management

### Delete File
\`\`\`bash
DELETE /api/upload/:folder/:filename
\`\`\`

### Get File Info
\`\`\`bash
GET /api/upload/info/:folder/:filename
\`\`\`

## Error Handling

### File Size Error
\`\`\`json
{
  "success": false,
  "message": "File too large. Maximum size allowed is 10MB."
}
\`\`\`

### File Type Error
\`\`\`json
{
  "success": false,
  "message": "Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!"
}
\`\`\`

### Too Many Files Error
\`\`\`json
{
  "success": false,
  "message": "Too many files. Maximum allowed files exceeded."
}
\`\`\`

## Security Features

- **File Type Validation**: Only allowed file types can be uploaded
- **File Size Limits**: Prevents large file uploads
- **Authentication Required**: All uploads require valid JWT token
- **Role-based Access**: Some uploads restricted to specific roles
- **Secure Storage**: Files stored outside web root with unique names
- **Path Traversal Protection**: Prevents directory traversal attacks

## Best Practices

1. **Always validate file types** on both client and server side
2. **Check file sizes** before uploading to avoid errors
3. **Use appropriate endpoints** for different file types
4. **Handle errors gracefully** in your frontend application
5. **Store file URLs** in your database, not file paths
6. **Implement file cleanup** for deleted records
7. **Use HTTPS** in production for secure file uploads

## File Structure
\`\`\`
uploads/
├── profiles/          # User profile images
├── children/          # Children profile images
├── schools/           # School images
├── documents/         # Application documents
└── gallery/           # Gallery images
\`\`\`

## Environment Variables
\`\`\`env
MAX_FILE_SIZE=10485760    # 10MB in bytes
UPLOAD_PATH=./uploads
