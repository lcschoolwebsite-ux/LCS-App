const webPush = require("web-push");
const PushSubscription = require("../models/PushSubscription");
const Student = require("../models/Student");

const configureWebPush = () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    return false;
  }

  webPush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  return true;
};

const isExpiredSubscriptionError = (error) => {
  const statusCode = error?.statusCode || error?.response?.statusCode;
  return statusCode === 410;
};

const removeExpiredSubscription = async (subscriptionDoc) => {
  if (!subscriptionDoc?._id) return;
  await PushSubscription.deleteOne({ _id: subscriptionDoc._id });
};

const sendToSubscriptions = async (subscriptions, payload) => {
  if (!configureWebPush()) {
    return { sent: 0, removed: 0 };
  }

  let sent = 0;
  let removed = 0;
  const message = JSON.stringify(payload);

  for (const subscriptionDoc of subscriptions) {
    try {
      await webPush.sendNotification(subscriptionDoc.subscription, message);
      sent += 1;
    } catch (error) {
      if (isExpiredSubscriptionError(error)) {
        await removeExpiredSubscription(subscriptionDoc);
        removed += 1;
        continue;
      }

      console.warn("Push notification failed:", error.message);
    }
  }

  return { sent, removed };
};

const getAllActiveStudentMobiles = async () => {
  const mobiles = await Student.distinct("mobile", {
    isActive: true
  });

  return [...new Set(mobiles.map(mobile => String(mobile || "").trim()).filter(Boolean))];
};

const getClassStudentMobiles = async (classId) => {
  if (!classId) return [];

  const mobiles = await Student.distinct("mobile", {
    class: classId,
    isActive: true
  });

  return [...new Set(mobiles.map(mobile => String(mobile || "").trim()).filter(Boolean))];
};

const notifyAllStudents = async (title, body) => {
  const mobiles = await getAllActiveStudentMobiles();
  if (!mobiles.length) {
    return { sent: 0, removed: 0 };
  }

  const subscriptions = await PushSubscription.find({
    mobile: { $in: mobiles }
  }).lean();

  return sendToSubscriptions(subscriptions, {
    title,
    body,
    url: "/student/announcements"
  });
};

const notifyAllParents = async (title, body) => {
  const subscriptions = await PushSubscription.find({}).lean();
  return sendToSubscriptions(subscriptions, { title, body, url: "/student/announcements" });
};

const notifyClassParents = async (classId, title, body) => {
  const mobiles = await getClassStudentMobiles(classId);
  if (!mobiles.length) {
    return { sent: 0, removed: 0 };
  }

  const subscriptions = await PushSubscription.find({
    mobile: { $in: mobiles }
  }).lean();

  return sendToSubscriptions(subscriptions, {
    title,
    body,
    url: "/student/announcements"
  });
};

module.exports = {
  notifyAllStudents,
  notifyAllParents,
  notifyClassParents
};
