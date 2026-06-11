const router = require("express").Router();
const auth = require("../middleware/auth");
const PushSubscription = require("../models/PushSubscription");

router.post("/subscribe", auth, async (req, res) => {
  try {
    const { subscription, mobile, browser } = req.body;
    const endpoint = subscription?.endpoint;

    if (!mobile || !subscription || !endpoint) {
      return res.status(400).json({ message: "Subscription endpoint and mobile are required" });
    }

    const saved = await PushSubscription.findOneAndUpdate(
      { endpoint: String(endpoint).trim() },
      {
        mobile: String(mobile).trim(),
        endpoint: String(endpoint).trim(),
        subscription,
        browser: String(browser || "").trim()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Subscribed for push notifications", subscription: saved });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get("/vapid-public-key", async (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
});

module.exports = router;
