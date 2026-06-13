export const APP_VERSION_CODE = Number(import.meta.env.VITE_APP_VERSION_CODE || "1");
export const APP_VERSION_NAME = String(import.meta.env.VITE_APP_VERSION_NAME || "1.0.0");
export const VERSION_MANIFEST_URL = String(
  import.meta.env.VITE_VERSION_MANIFEST_URL ||
    "https://raw.githubusercontent.com/your-org/your-repo/main/version.json"
);
export const APK_DOWNLOAD_URL = String(import.meta.env.VITE_APK_DOWNLOAD_URL || "");
