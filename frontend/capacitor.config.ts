import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "edu.lorettocentralschool.portal",
  appName: "LCS Portal",
  webDir: "dist",
  server: {
    url: "https://lcs-portal.pages.dev",
    cleartext: false
  }
};

export default config;
