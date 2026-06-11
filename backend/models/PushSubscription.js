const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  mobile: { type: String, required: true, trim: true },
  endpoint: { type: String, required: true, unique: true, trim: true },
  browser: { type: String, default: "" },
  subscription: { type: Object, required: true }
}, { timestamps: true });

pushSubscriptionSchema.index({ mobile: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
