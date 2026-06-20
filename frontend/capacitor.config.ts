import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "edu.lorettocentralschool.portal",
  appName: "LCS Portal",
  webDir: "dist",
  server: {
    url: "https://lcs-portal.pages.dev",
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      launchFadeOutDuration: 300,
      backgroundColor: "#051a1a",
      androidSplashResourceName: "splash_icon",
      androidScaleType: "FIT_CENTER",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
