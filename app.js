// Load environment variables (conditional for production)
try {
  require("dotenv").config();
} catch (error) {
  console.log("dotenv not available, using system environment variables");
}
const express = require("express");
const cors = require("cors");
const app = express();

// Enable CORS for all routes
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          process.env.CORS_ORIGIN,
          process.env.ADMIN_PORTAL_URL,
          // Common deployment patterns for admin portal
          /^https:\/\/.*\.vercel\.app$/,
          /^https:\/\/.*\.netlify\.app$/,
          /^https:\/\/.*\.herokuapp\.com$/,
          // Add specific known admin portal URLs
          "https://churchupdates.netlify.app",
          "https://updates-admin.vercel.app",
        ].filter(Boolean) // Remove undefined values
      : [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
        ],
  credentials: true,
};

app.use(cors(corsOptions));
const churchesRouter = require("./routes/churches");
const eventsRouter = require("./routes/events");
const globalEventsRouter = require("./routes/globalEvents");
const donationsRouter = require("./routes/donations");
const announcementsRouter = require("./routes/announcements");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const enrollmentRoutes = require("./routes/enrollment");
const uploadRoutes = require("./routes/upload");
const favoritesRouter = require("./routes/favorites");
const publicEventsRouter = require("./routes/publicEvents");
const errorHandler = require("./middleware/errorHandler");
const { initializeDatabase } = require("./db");
const { fixImageUrlsMiddleware } = require("./utils/imageUrlUtils");

app.use(express.json());

// Fix image URLs in all API responses
app.use('/api', fixImageUrlsMiddleware);

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Public routes (no /api prefix) - for shared links and web views
app.use("/events", publicEventsRouter);

// API routes - all routes under /api prefix
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/churches", churchesRouter);
app.use("/api/churches/:churchId/events", eventsRouter);
app.use("/api/events", globalEventsRouter);
app.use("/api/churches/:churchId/donations", donationsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/upload", uploadRoutes);
app.use("/api/favorites", favoritesRouter);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
