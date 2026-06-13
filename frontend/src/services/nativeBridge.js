import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import api from "../api/axios";
import { APP_VERSION_CODE, VERSION_MANIFEST_URL } from "../config/appVersion";

const isNativeAndroid = Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform();
const pushState = {
  listenersReady: false,
  currentUserKey: "",
  token: "",
  user: null,
};

const safeJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const isNativeAndroidApp = () => isNativeAndroid;

export const bootstrapNativeShell = async () => {
  if (!isNativeAndroid) return { online: true };

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#051a1a" });
  } catch (_) {}

  try {
    await SplashScreen.hide();
  } catch (_) {}

  let online = true;
  try {
    const status = await Network.getStatus();
    online = Boolean(status.connected);
  } catch (_) {}

  return { online };
};

export const subscribeToNetworkChanges = async (onChange) => {
  if (!isNativeAndroid || typeof onChange !== "function") return () => {};

  try {
    const status = await Network.getStatus();
    onChange(Boolean(status.connected));
  } catch (_) {}

  const listener = await Network.addListener("networkStatusChange", (status) => {
    onChange(Boolean(status.connected));
  });

  return () => {
    listener.remove().catch(() => {});
  };
};

const postDeviceToken = async (token, user) => {
  if (!token || !user?.id) return;

  const tokenKey = `lcsms.device-token.${user.id}`;
  const cachedToken = localStorage.getItem(tokenKey);
  if (cachedToken === token) return;

  await api.post("/push/register-device", {
    token,
    platform: "android",
    browser: "capacitor",
    role: user.role,
    mobile: user.mobile || ""
  });

  localStorage.setItem(tokenKey, token);
};

const setupPushListeners = async () => {
  if (pushState.listenersReady) return;
  pushState.listenersReady = true;

  PushNotifications.addListener("registration", async (token) => {
    pushState.token = token.value;
    try {
      await postDeviceToken(token.value, pushState.user);
    } catch (error) {
      console.warn("Unable to register FCM token:", error.message);
    }
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.warn("Push registration failed:", error);
  });

  PushNotifications.addListener("pushNotificationReceived", async (notification) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Date.now() % 2147483647),
            title: notification.title || "LCS Portal",
            body: notification.body || "",
            extra: notification.data || {},
            schedule: { at: new Date(Date.now() + 250) }
          }
        ]
      });
    } catch (error) {
      console.warn("Foreground notification fallback failed:", error.message);
    }
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = action?.notification?.data?.url || action?.notification?.data?.route;
    if (url) {
      window.location.assign(url);
    }
  });
};

export const registerNativePushForUser = async (user) => {
  if (!isNativeAndroid || !user || !["student", "teacher"].includes(user.role)) return;

  const currentKey = `${user.role}:${user.id || user._id || ""}`;
  pushState.user = user;
  if (pushState.currentUserKey !== currentKey) {
    pushState.currentUserKey = currentKey;
    pushState.token = "";
  }

  await setupPushListeners();

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") {
    return { enabled: false, reason: "Push permission not granted" };
  }

  await LocalNotifications.requestPermissions();
  await PushNotifications.register();

  return { enabled: true };
};

export const checkRemoteVersion = async () => {
  if (!VERSION_MANIFEST_URL) return null;

  const cacheKey = "lcsms.version.last-check";
  const lastCheck = Number(localStorage.getItem(cacheKey) || 0);
  const now = Date.now();
  if (now - lastCheck < 1000 * 60 * 60 * 6) {
    return null;
  }

  localStorage.setItem(cacheKey, String(now));

  const response = await fetch(VERSION_MANIFEST_URL, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache"
    }
  });

  if (!response.ok) {
    throw new Error(`Version manifest request failed: ${response.status}`);
  }

  const manifest = await safeJson(response);
  const remoteCode = Number(manifest?.versionCode || manifest?.buildCode || 0);

  if (!remoteCode || remoteCode <= APP_VERSION_CODE) {
    return null;
  }

  return {
    versionCode: remoteCode,
    versionName: String(manifest?.versionName || manifest?.version || `v${remoteCode}`),
    apkUrl: String(manifest?.apkUrl || manifest?.downloadUrl || ""),
    notes: String(manifest?.notes || ""),
    title: String(manifest?.title || "Update available")
  };
};

export const getAppInfo = async () => {
  if (!isNativeAndroid) return null;
  try {
    return await App.getInfo();
  } catch (_) {
    return null;
  }
};
