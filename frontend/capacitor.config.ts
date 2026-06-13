import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "edu.lorettocentralschool.portal",
  appName: "LCSMS Portal",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    url: "https://lcs-portal.pages.dev",
    cleartext: false
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 300,
      launchAutoHide: true,
      backgroundColor: "#051a1a",
      androidSplashResourceName: "splash"
    },
    StatusBar: {
      style: "DARK"
    }
  }
};

export default config;
