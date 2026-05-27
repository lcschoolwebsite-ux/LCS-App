const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const localhostDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

const isAllowedOrigin = origin => {
  if (!origin) return true;
  if (configuredOrigins.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && localhostDevOrigin.test(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true
};

module.exports = { corsOptions };
