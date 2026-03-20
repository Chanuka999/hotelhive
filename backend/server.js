const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS - (MOVED TO TOP TO PREVENT PREFLIGHT ERRORS)
const allowedOrigins = [
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : []),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  "http://localhost:3000",
  "http://localhost:5173",
  "https://hotelhive-silk.vercel.app",
]
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
});
app.use("/api/", limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/hotels", require("./routes/hotelRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;
