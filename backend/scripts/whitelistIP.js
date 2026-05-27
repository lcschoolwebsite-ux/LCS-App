require("dotenv").config();
const https = require("https");

async function getCurrentIP() {
  return new Promise((resolve, reject) => {
    https.get("https://api.ipify.org?format=json", (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data).ip));
    }).on("error", reject);
  });
}

async function whitelistIP() {
  try {
    const ip = await getCurrentIP();
    console.log("\n" + "═".repeat(50));
    console.log(`📍 YOUR CURRENT IP: ${ip}`);
    console.log("═".repeat(50));
    console.log(`\n✅ To whitelist manually:`);
    console.log(`1. Go to https://cloud.mongodb.com`);
    console.log(`2. Select your project → Network Access (left sidebar)`);
    console.log(`3. Click "+ ADD IP ADDRESS"`);
    console.log(`4. Enter: ${ip}`);
    console.log(`   OR click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) for dev`);
    console.log(`5. Click "Confirm" and wait ~60 seconds.`);
    console.log("\n" + "═".repeat(50) + "\n");
  } catch (err) {
    console.error("❌ Failed to fetch current IP:", err.message);
  }
}

whitelistIP();
