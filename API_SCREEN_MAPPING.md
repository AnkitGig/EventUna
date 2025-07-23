# 📱 API to Figma Screen Mapping Guide

This document maps each API endpoint to its corresponding Figma screen for the daycare/preschool management app.

## 🔐 Authentication Flow Screens

### Login Screen
- **API**: `POST /api/auth/login`
- **Purpose**: Main login for parents and teachers
- **Features**: Email/password authentication, role detection

### First Time Login Screen  
- **API**: `POST /api/auth/first-login`
- **Purpose**: Password change on first login
- **Features**: Temporary password validation, new password setup

### Forgot Password Screen
- **API**: `POST /api/auth/forgot-password`
- **Purpose**: Request password reset
- **Features**: Email validation, reset token generation

## 👨‍👩‍👧‍👦 Parent App Screens

### Parent Dashboard
- **API**: `GET /api/parents/profile`
- **Purpose**: Main parent dashboard with children overview
- **Features**: Children list, recent activities, notifications

### Child Profile Screen
- **API**: `GET /api/parents/children`
- **Purpose**: Detailed child information
- **Features**: Child photos, school info, emergency contacts

### Child Daily Timeline (MAIN SCREEN)
- **API**: `GET /api/activities/timeline/:childId?date=2024-01-15`
- **Purpose**: Chronological view of child's daily activities
- **Features**: 
  - Diaper changes with timestamps
  - Meal tracking with photos
  - Sleep sessions with duration
  - Activity participation
  - Mood tracking
  - Teacher notes and photos

### Diaper Timeline Screen
- **API**: `GET /api/activities/timeline/:childId?activityType=diaper`
- **Purpose**: Focused view of diaper changes only
- **Features**: Time, type (wet/soiled/dry), notes, photos

### Attendance Calendar
- **API**: `GET /api/activities/attendance/:childId?month=1&year=2024`
- **Purpose**: Monthly calendar view of attendance
- **Features**: Present/absent status, check-in/out times, monthly overview

### Daily Report Screen
- **API**: `GET /api/activities/daily-report/:childId?date=2024-01-15`
- **Purpose**: Comprehensive daily summary
- **Features**: All activities, meals, sleep, mood, teacher notes, photos, milestones

### Messages/Chat List
- **API**: `GET /api/messages/conversations`
- **Purpose**: List of all conversations with teachers
- **Features**: Last message, unread count, teacher info

### Chat Conversation Screen
- **API**: `GET /api/messages/conversations/:conversationId`
- **Purpose**: Individual chat with teacher
- **Features**: Text messages, photos, files, call history

### Video/Audio Call Screen
- **API**: `POST /api/messages/call/initiate`
- **Purpose**: Start video or audio call
- **Features**: Call controls, duration tracking, call history

## 🏫 School Discovery Screens

### School Search Screen
- **API**: `GET /api/schools?search=bright&city=mumbai&minFee=5000`
- **Purpose**: Search and filter schools
- **Features**: Name search, location filter, fee range, ratings

### School Details Screen
- **API**: `GET /api/schools/:id`
- **Purpose**: Detailed school information
- **Features**: Photos, facilities, fees, contact info, reviews

### Nearby Schools (Map View)
- **API**: `GET /api/schools/nearby/:lat/:lng?radius=10`
- **Purpose**: GPS-based school discovery
- **Features**: Map integration, distance calculation, directions

### Application Form Screen
- **API**: `POST /api/applications`
- **Purpose**: Submit school application
- **Features**: Child info, parent details, document upload

### My Applications Screen
- **API**: `GET /api/applications/my-applications`
- **Purpose**: Track application status
- **Features**: Application history, status updates, school responses

## 👩‍🏫 Teacher App Screens

### Teacher Dashboard
- **API**: `GET /api/teachers/profile`
- **Purpose**: Teacher main dashboard
- **Features**: Assigned children, daily schedule, profile info

### Activity Logging Screen
- **API**: `POST /api/activities/add`
- **Purpose**: Log activities for children
- **Features**: 
  - Diaper change logging
  - Meal tracking
  - Sleep session recording
  - Activity participation
  - Mood assessment
  - Photo uploads

### Room Schedule Screen
- **API**: `GET /api/activities/room-schedule/:roomId`
- **Purpose**: Daily schedule for teacher's room
- **Features**: Time slots, planned activities, children list

### Teacher Chat Screen
- **API**: `GET /api/messages/conversations`
- **Purpose**: Communication with parents
- **Features**: Parent messages, file sharing, call options

## 👨‍💼 Admin Web Dashboard Screens

### User Management Screen
- **API**: `GET /api/admin/users?role=parent&search=john`
- **Purpose**: Manage all users
- **Features**: User list, search, filter, status management

### Create Accounts Screen
- **API**: `POST /api/admin/create-parent`
- **API**: `POST /api/admin/create-teacher`
- **Purpose**: Create new user accounts
- **Features**: Account setup, email notifications, role assignment

### Analytics Dashboard
- **API**: `GET /api/admin/stats`
- **Purpose**: System statistics and analytics
- **Features**: User counts, activity metrics, growth charts

## 🔄 Real-time Features

### Push Notifications
- **Trigger**: When teacher adds activity via `POST /api/activities/add`
- **Purpose**: Notify parents of new activities
- **Features**: Real-time updates, activity alerts

### Live Chat Updates
- **Trigger**: When message sent via `POST /api/messages/send`
- **Purpose**: Real-time message delivery
- **Features**: Instant messaging, read receipts

## 📊 Key Screen Flows

### Daily Parent Flow:
1. Login → Parent Dashboard → Child Timeline → View Activities → Chat with Teacher

### Teacher Daily Flow:
1. Login → Teacher Dashboard → Room Schedule → Log Activities → Respond to Parent Messages

### School Application Flow:
1. Search Schools → School Details → Submit Application → Track Status → Start Communication

### Admin Management Flow:
1. Admin Dashboard → Create Accounts → Manage Users → Send Announcements → View Analytics

---

## 🚀 Implementation Priority

### Phase 1 (Core Daycare Features):
- Child Timeline APIs ✅
- Activity Logging APIs ✅
- Daily Reports APIs ✅
- Basic Messaging APIs ✅

### Phase 2 (Enhanced Features):
- Video Calling APIs ✅
- File Sharing APIs ✅
- Attendance Calendar APIs ✅
- Push Notifications (TODO)

### Phase 3 (Admin & Analytics):
- Admin Management APIs ✅
- Analytics APIs ✅
- Bulk Operations APIs ✅
- Advanced Reporting (TODO)
