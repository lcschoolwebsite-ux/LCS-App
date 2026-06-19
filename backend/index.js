require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const http      = require("http");
const helmet    = require("helmet");
const mongoose  = require("mongoose");
const mongoSanitize = require("express-mongo-sanitize");
const { rateLimit } = require("express-rate-limit");
const compression = require("compression");
const connectDB = require("./config/db");
const { initSocket } = require("./utils/socket");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

const frontendOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.CAPACITOR_SERVER_URL,
  "https://portal.lorettocentralschool.edu.in",
  "https://lcs-portal.pages.dev",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

mongoose.set("strictQuery", true);

// Enable gzip compression
app.use(compression());

app.use(cors({
  origin: frontendOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.options("*", cors());
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(mongoSanitize());
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", require("./routes/index"));
app.use("/api/push", require("./routes/push"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

connectDB().then(() => {
  initSocket(server);

  server.listen(process.env.PORT || 5000, () =>
    console.log(`🚀 Server on port ${process.env.PORT || 5000}`)
  );
});
