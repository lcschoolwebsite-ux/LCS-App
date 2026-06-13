const webPush = require("web-push");
const admin = require("firebase-admin");
const path = require("path");
const PushSubscription = require("../models/PushSubscription");
const Student = require("../models/Student");

let firebaseApp = null;

const normalize = (value) => String(value || "").trim();

const chunkArray = (values, size = 500) => {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
};

const toStringData = (payload = {}) => {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, normalize(value)])
  );
};

const configureWebPush = () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = process.env;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
    return false;
  }

  webPush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  return true;
};

const configureFirebase = () => {
  if (firebaseApp) return true;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountJson && !serviceAccountPath) {
    return false;
  }

  let serviceAccount = null;
  try {
    serviceAccount = serviceAccountJson
      ? JSON.parse(serviceAccountJson)
      : require(path.resolve(serviceAccountPath));
  } catch (error) {
    console.warn("Unable to load Firebase service account:", error.message);
    return false;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  return Boolean(firebaseApp);
};

const isExpiredSubscriptionError = (error) => {
  const statusCode = error?.statusCode || error?.response?.statusCode;
  return statusCode === 410;
};

const removeExpiredSubscription = async (subscriptionDoc) => {
  if (!subscriptionDoc?._id) return;
  await PushSubscription.deleteOne({ _id: subscriptionDoc._id });
};

const sendToWebSubscriptions = async (subscriptions, payload) => {
  if (!configureWebPush() || !subscriptions.length) {
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

      console.warn("Web push notification failed:", error.message);
    }
  }

  return { sent, removed };
};

const getActiveStudentMobiles = async () => {
  const mobiles = await Student.distinct("mobile", { isActive: true });
  return [...new Set(mobiles.map(normalize).filter(Boolean))];
};

const getClassStudentMobiles = async (classId) => {
  if (!classId) return [];

  const mobiles = await Student.distinct("mobile", {
    class: classId,
    isActive: true
  });

  return [...new Set(mobiles.map(normalize).filter(Boolean))];
};

const getStudentsByMobiles = async (mobiles) => {
  if (!mobiles.length) return [];

  return Student.find({
    mobile: { $in: mobiles },
    isActive: true
  }).select("name mobile class pushTokens").lean();
};

const getPushTokensForMobiles = async (mobiles) => {
  const students = await getStudentsByMobiles(mobiles);
  const tokens = students.flatMap(student =>
    (student.pushTokens || [])
      .map(entry => normalize(entry?.token))
      .filter(Boolean)
  );

  return [...new Set(tokens)];
};

const sendToFirebaseTokens = async (tokens, payload) => {
  if (!tokens.length || !configureFirebase()) {
    return { sent: 0, failed: 0, skipped: true };
  }

  let sent = 0;
  let failed = 0;
  const notification = {
    title: normalize(payload.title) || "LCSMS Portal",
    body: normalize(payload.body)
  };
  const data = toStringData(payload);

  for (const batch of chunkArray(tokens, 500)) {
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification,
        data
      });

      sent += response.successCount || 0;
      failed += response.failureCount || 0;
    } catch (error) {
      console.warn("Firebase push notification failed:", error.message);
      failed += batch.length;
    }
  }

  return { sent, failed };
};

const sendPushPayload = async ({ mobiles, payload, includeWebPush = true }) => {
  const uniqueMobiles = [...new Set((mobiles || []).map(normalize).filter(Boolean))];
  const tokens = await getPushTokensForMobiles(uniqueMobiles);
  const firebaseResult = await sendToFirebaseTokens(tokens, payload);

  let webResult = { sent: 0, removed: 0 };
  if (includeWebPush) {
    const subscriptions = await PushSubscription.find({
      mobile: { $in: uniqueMobiles }
    }).lean();
    webResult = await sendToWebSubscriptions(subscriptions, payload);
  }

  return {
    mobiles: uniqueMobiles.length,
    firebase: firebaseResult,
    web: webResult
  };
};

const notifyAllStudents = async (title, body, extras = {}) => {
  const mobiles = await getActiveStudentMobiles();
  if (!mobiles.length) {
    return { mobiles: 0, firebase: { sent: 0, failed: 0 }, web: { sent: 0, removed: 0 } };
  }

  return sendPushPayload({
    mobiles,
    payload: {
      title,
      body,
      url: extras.url || "/student/announcements",
      ...extras
    }
  });
};

const notifyAllParents = async (title, body, extras = {}) => {
  return notifyAllStudents(title, body, extras);
};

const notifyClassParents = async (classId, title, body, extras = {}) => {
  const mobiles = await getClassStudentMobiles(classId);
  if (!mobiles.length) {
    return { mobiles: 0, firebase: { sent: 0, failed: 0 }, web: { sent: 0, removed: 0 } };
  }

  return sendPushPayload({
    mobiles,
    payload: {
      title,
      body,
      url: extras.url || "/student/announcements",
      classId: normalize(classId),
      ...extras
    }
  });
};

const notifyStudentById = async (studentId, title, body, extras = {}) => {
  const student = await Student.findById(studentId).select("mobile").lean();
  if (!student?.mobile) {
    return { mobiles: 0, firebase: { sent: 0, failed: 0 }, web: { sent: 0, removed: 0 } };
  }

  return sendPushPayload({
    mobiles: [student.mobile],
    payload: {
      title,
      body,
      url: extras.url || "/student",
      studentId: normalize(studentId),
      ...extras
    }
  });
};

const notifyClassStudents = async (classId, title, body, extras = {}) => {
  return notifyClassParents(classId, title, body, extras);
};

const registerDeviceToken = async ({ user, token, platform = "android", label = "" }) => {
  const normalizedToken = normalize(token);
  if (!user?.role || !user?.id || !normalizedToken) {
    throw new Error("User and token are required");
  }

  const update = {
    token: normalizedToken,
    platform: normalize(platform) || "android",
    label: normalize(label),
    lastSeenAt: new Date()
  };

  if (user.role === "student") {
    const student = await Student.findById(user.id).select("pushTokens mobile");
    if (!student) throw new Error("Student not found");

    student.pushTokens = (student.pushTokens || []).filter(entry => normalize(entry?.token) !== normalizedToken);
    student.pushTokens.push(update);
    await student.save();
    return { role: "student", id: String(student._id), token: normalizedToken };
  }

  if (user.role === "teacher") {
    const Teacher = require("../models/Teacher");
    const teacher = await Teacher.findById(user.id).select("pushTokens phone");
    if (!teacher) throw new Error("Teacher not found");

    teacher.pushTokens = (teacher.pushTokens || []).filter(entry => normalize(entry?.token) !== normalizedToken);
    teacher.pushTokens.push(update);
    await teacher.save();
    return { role: "teacher", id: String(teacher._id), token: normalizedToken };
  }

  throw new Error("Device registration is supported for student and teacher accounts only");
};

module.exports = {
  notifyAllStudents,
  notifyAllParents,
  notifyClassParents,
  notifyClassStudents,
  notifyStudentById,
  registerDeviceToken
};
