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
      launchAutoHide: true,
      launchFadeOutDuration: 0,
      backgroundColor: "#051a1a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#c8960c",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;

