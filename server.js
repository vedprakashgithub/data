require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// =======================
// Trust Proxy
// =======================
app.set("trust proxy", 1);

// =======================
// CORS
// =======================
app.use(
  cors({
    origin: [
      "http://localhost:5173","https://lms.codingcube.online",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

// =======================
// Middlewares
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// Routes
// =======================
app.use("/api", require("./routes/health"));
app.use("/api", require("./routes/create-order"));
app.use("/api", require("./routes/verify-payment"));
app.use("/api", require("./routes/free-enrollment"));

// =======================
// Root Route
// =======================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduLMS Razorpay API Running",
  });
});

// =======================
// Health Route
// =======================
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// =======================
// 404 Handler
// =======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route Not Found",
    path: req.originalUrl,
  });
});

// =======================
// Global Error Handler
// =======================
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// Export for Vercel
module.exports = app;

// Run locally only
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}