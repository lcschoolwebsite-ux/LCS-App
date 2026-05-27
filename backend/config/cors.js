const defaultOrigins = [
  "https://lorettocentralschool.edu.in",
  "https://portal.lorettocentralschool.edu.in",
  "https://lcs-portal.pages.dev",
  "http://localhost:3000",
  "http://localhost:5173"
];

const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

const localhostDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

const isAllowedOrigin = origin => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return localhostDevOrigin.test(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

module.exports = { corsOptions };
