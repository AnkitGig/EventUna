const admin = require("./firebase");
const Notification = require("../../models/notifications/Notification");

exports.sendPushNotification = async (fcmToken, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    data,
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    return { success: true, response };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error };
  }
};

exports.saveNotifications = async (userId, title, body, data = {}, session = null) => {
  try {
    const notification = new Notification({
      userId,
      title,
      body,
      data,
    });
    await notification.save({ session });
    return { success: true, notificationId: notification._id };
  } catch (error) {
    console.error("Error saving notification:", error);
    return { success: false, error };
  }
};

