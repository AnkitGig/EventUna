const Notification = require("../models/notifications/Notification");
const Event = require("../models/event/Event");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("userId", "fullName email");

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No notifications found",
      });
    }

    const populatedNotifications = await Promise.all(
      notifications.map(async (item) => {
        let eventDetails = null;
        if (item?.data?.eventId) {
          eventDetails = await Event.findById(item.data.eventId).lean();
        }

        eventDetails.image = eventDetails.image
          ? `${process.env.BASE_URL}/event/${eventDetails.image}`
          : `${process.env.DEFAULT_EVENT_PIC}`;

        // Convert to object and exclude 'data'
        const { data, ...rest } = item.toObject();

        return {
          ...rest,
          eventDetails,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "Notifications fetched successfully",
      data: populatedNotifications,
    });

    // res.status(200).json({
    //   status: true,
    //   message: "Notifications fetched successfully",
    //   data: populateAll,
    // });
  } catch (error) {
    console.error("Error while getting notifications:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
