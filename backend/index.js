require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const http      = require("http");
const helmet    = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const { rateLimit } = require("express-rate-limit");
const connectDB = require("./config/db");
const { corsOptions } = require("./config/cors");
const { initSocket } = require("./utils/socket");

const app = express();
const server = http.createServer(app);

app.use(cors(corsOptions));
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
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api", require("./routes/index"));

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
