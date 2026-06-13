import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  "https://portal.lorettocentralschool.edu.in";

const config: CapacitorConfig = {
  appId: "edu.lorettocentralschool.portal",
  appName: "LCSMS Portal",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    url: serverUrl,
    cleartext: false
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false,
      backgroundColor: "#051a1a",
      androidSplashResourceName: "splash"
    },
    StatusBar: {
      style: "DARK"
    }
  }
};

export default config;
