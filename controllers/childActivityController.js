const ChildActivity = require("../models/ChildActivity")
const DailyReport = require("../models/DailyReport")
const Parent = require("../models/Parent")
const Room = require("../models/Room")

// @desc    Get child's daily timeline
// @route   GET /api/activities/timeline/:childId
// @access  Private (Parent/Teacher)
const getChildTimeline = async (req, res) => {
  try {
    const { childId } = req.params
    const { date, activityType } = req.query

    // Build query
    const query = { childId }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      query.timestamp = { $gte: startDate, $lt: endDate }
    } else {
      // Default to today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      query.timestamp = { $gte: today, $lt: tomorrow }
    }

    if (activityType) {
      query.activityType = activityType
    }

    const activities = await ChildActivity.find(query)
      .populate("teacherId", "firstName lastName profileImage")
      .populate("roomId", "roomNumber roomName")
      .sort({ timestamp: -1 })

    // Format activities for timeline
    const timeline = activities.map((activity) => {
      const baseActivity = {
        id: activity._id,
        type: activity.activityType,
        timestamp: activity.timestamp,
        teacher: activity.teacherId,
        room: activity.roomId,
        photos: activity.photos,
      }

      // Add specific details based on activity type
      switch (activity.activityType) {
        case "diaper":
          baseActivity.details = activity.diaperDetails
          break
        case "sleep":
          baseActivity.details = activity.sleepDetails
          break
        case "meal":
          baseActivity.details = activity.mealDetails
          break
        case "activity":
          baseActivity.details = activity.activityDetails
          break
        case "mood":
          baseActivity.details = activity.moodDetails
          break
        case "attendance":
          baseActivity.details = activity.attendanceDetails
          break
      }

      return baseActivity
    })

    res.json({
      success: true,
      data: {
        timeline,
        date: date || new Date().toISOString().split("T")[0],
        totalActivities: timeline.length,
      },
    })
  } catch (error) {
    console.error("Get child timeline error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch child timeline",
      error: error.message,
    })
  }
}

// @desc    Add activity for child
// @route   POST /api/activities/add
// @access  Private (Teacher only)
const addChildActivity = async (req, res) => {
  try {
    const {
      childId,
      parentId,
      roomId,
      activityType,
      diaperDetails,
      sleepDetails,
      mealDetails,
      activityDetails,
      moodDetails,
      attendanceDetails,
      photos,
      notes,
    } = req.body

    // Validation
    if (!childId || !parentId || !roomId || !activityType) {
      return res.status(400).json({
        success: false,
        message: "Child ID, Parent ID, Room ID, and activity type are required",
      })
    }

    // Create activity
    const activity = new ChildActivity({
      childId,
      parentId,
      teacherId: req.user._id,
      roomId,
      activityType,
      diaperDetails,
      sleepDetails,
      mealDetails,
      activityDetails,
      moodDetails,
      attendanceDetails,
      photos: photos || [],
    })

    await activity.save()

    // Populate for response
    await activity.populate("teacherId", "firstName lastName profileImage")
    await activity.populate("roomId", "roomNumber roomName")

    // TODO: Send real-time notification to parent
    // This would typically use WebSocket or push notifications

    res.status(201).json({
      success: true,
      message: "Activity added successfully",
      data: activity,
    })
  } catch (error) {
    console.error("Add child activity error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add activity",
      error: error.message,
    })
  }
}

// @desc    Get child's attendance calendar
// @route   GET /api/activities/attendance/:childId
// @access  Private (Parent/Teacher)
const getAttendanceCalendar = async (req, res) => {
  try {
    const { childId } = req.params
    const { month, year } = req.query

    const currentDate = new Date()
    const targetMonth = month ? Number.parseInt(month) - 1 : currentDate.getMonth()
    const targetYear = year ? Number.parseInt(year) : currentDate.getFullYear()

    // Get start and end of month
    const startDate = new Date(targetYear, targetMonth, 1)
    const endDate = new Date(targetYear, targetMonth + 1, 0)

    const attendanceRecords = await ChildActivity.find({
      childId,
      activityType: "attendance",
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: 1 })

    // Create calendar structure
    const calendar = []
    const daysInMonth = endDate.getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonth, day)
      const dateString = date.toISOString().split("T")[0]

      const attendanceRecord = attendanceRecords.find(
        (record) => record.timestamp.toISOString().split("T")[0] === dateString,
      )

      calendar.push({
        date: dateString,
        day: day,
        dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
        status: attendanceRecord?.attendanceDetails?.status || "absent",
        checkInTime: attendanceRecord?.attendanceDetails?.checkInTime,
        checkOutTime: attendanceRecord?.attendanceDetails?.checkOutTime,
        notes: attendanceRecord?.attendanceDetails?.notes,
      })
    }

    res.json({
      success: true,
      data: {
        calendar,
        month: targetMonth + 1,
        year: targetYear,
        monthName: new Date(targetYear, targetMonth).toLocaleDateString("en-US", { month: "long" }),
        totalDays: daysInMonth,
        presentDays: calendar.filter((day) => day.status === "present").length,
        absentDays: calendar.filter((day) => day.status === "absent").length,
      },
    })
  } catch (error) {
    console.error("Get attendance calendar error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance calendar",
      error: error.message,
    })
  }
}

// @desc    Get daily report for child
// @route   GET /api/activities/daily-report/:childId
// @access  Private (Parent/Teacher)
const getDailyReport = async (req, res) => {
  try {
    const { childId } = req.params
    const { date } = req.query

    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)

    const dailyReport = await DailyReport.findOne({
      childId,
      date: targetDate,
    })
      .populate("teacherId", "firstName lastName profileImage")
      .populate("roomId", "roomNumber roomName primaryTeacher")

    if (!dailyReport) {
      return res.status(404).json({
        success: false,
        message: "Daily report not found for this date",
      })
    }

    // Mark as viewed by parent if parent is requesting
    if (req.user.role === "parent" && !dailyReport.parentViewed) {
      dailyReport.parentViewed = true
      dailyReport.parentViewedAt = new Date()
      await dailyReport.save()
    }

    res.json({
      success: true,
      data: dailyReport,
    })
  } catch (error) {
    console.error("Get daily report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily report",
      error: error.message,
    })
  }
}

// @desc    Get room schedule
// @route   GET /api/activities/room-schedule/:roomId
// @access  Private
const getRoomSchedule = async (req, res) => {
  try {
    const { roomId } = req.params
    const { date } = req.query

    const room = await Room.findById(roomId)
      .populate("primaryTeacher.userId", "firstName lastName profileImage")
      .populate("assistantTeachers.userId", "firstName lastName profileImage")

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      })
    }

    // Get today's activities for the room if date is provided
    let todayActivities = []
    if (date) {
      const targetDate = new Date(date)
      const startDate = new Date(targetDate.setHours(0, 0, 0, 0))
      const endDate = new Date(targetDate.setHours(23, 59, 59, 999))

      todayActivities = await ChildActivity.find({
        roomId,
        timestamp: { $gte: startDate, $lte: endDate },
      }).populate("childId")
    }

    res.json({
      success: true,
      data: {
        room: {
          id: room._id,
          roomNumber: room.roomNumber,
          roomName: room.roomName,
          primaryTeacher: room.primaryTeacher,
          assistantTeachers: room.assistantTeachers,
          ageGroup: room.ageGroup,
          capacity: room.capacity,
          currentEnrollment: room.currentEnrollment,
          dailySchedule: room.dailySchedule,
          facilities: room.facilities,
        },
        todayActivities,
        date: date || new Date().toISOString().split("T")[0],
      },
    })
  } catch (error) {
    console.error("Get room schedule error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch room schedule",
      error: error.message,
    })
  }
}

module.exports = {
  getChildTimeline,
  addChildActivity,
  getAttendanceCalendar,
  getDailyReport,
  getRoomSchedule,
}
