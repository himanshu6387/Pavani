const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");


// ============================================================
// ENVIRONMENT
// ============================================================

require("dotenv").config();


// ============================================================
// APP
// ============================================================

const app = express();


// ============================================================
// PORT
// ============================================================

const PORT =
  process.env.PORT || 5000;


// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ],
    credentials: true
  })
);


// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);


// ============================================================
// STATIC UPLOADS
// ============================================================

app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);


// ============================================================
// ROUTE IMPORTS
// ============================================================


// ============================================================
// AUTH ROUTES
// ============================================================

const authRoutes =
  require("./routes/authRoutes");


// ============================================================
// DOCUMENT ROUTES
// ============================================================

const documentRoutes =
  require("./routes/documentRoutes");


// ============================================================
// SEARCH ROUTES
// ============================================================

const searchRoutes =
  require("./routes/searchRoutes");


// ============================================================
// ASK AI ROUTES
// ============================================================

const askRoutes =
  require("./routes/askRoutes");


// ============================================================
// REMINDER ROUTES
// ============================================================

const reminderRoutes =
  require("./routes/reminderRoutes");


// ============================================================
// EXPIRY ROUTES
// ============================================================

const expiryRoutes =
  require("./routes/expiryRoutes");


// ============================================================
// DOCUMENT COMPARISON ROUTES
// ============================================================

const compareRoutes =
  require("./routes/compareRoutes");


// ============================================================
// AI ACTION ROUTES
// ============================================================

const actionRoutes =
  require("./routes/actionRoutes");


// ============================================================
// TIMELINE ROUTES
// ============================================================

const timelineRoutes =
  require("./routes/timelineRoutes");


// ============================================================
// AI FORM FILLING ROUTES
// ============================================================

const formFillRoutes =
  require("./routes/formFillRoutes");


// ============================================================
// API ROUTES
// ============================================================


// ============================================================
// AUTH
//
// /api/auth/...
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);


// ============================================================
// EXPIRY
//
// /api/documents/expiry/...
//
// IMPORTANT:
// Keep this BEFORE /api/documents because documentRoutes
// contains dynamic /:id routes.
// ============================================================

app.use(
  "/api/documents/expiry",
  expiryRoutes
);


// ============================================================
// DOCUMENT COMPARISON
//
// /api/documents/compare/...
//
// IMPORTANT:
// Keep this BEFORE /api/documents because documentRoutes
// contains dynamic /:id routes.
// ============================================================

app.use(
  "/api/documents/compare",
  compareRoutes
);


// ============================================================
// DOCUMENTS
//
// GET
// /api/documents
//
// POST
// /api/documents/upload
//
// GET
// /api/documents/:id
//
// POST
// /api/documents/:id/reanalyze
//
// DELETE
// /api/documents/:id
// ============================================================

app.use(
  "/api/documents",
  documentRoutes
);


// ============================================================
// SEARCH
//
// /api/search/...
// ============================================================

app.use(
  "/api/search",
  searchRoutes
);


// ============================================================
// ASK LIFEVAULT AI
//
// /api/ask/...
// ============================================================

app.use(
  "/api/ask",
  askRoutes
);


// ============================================================
// REMINDERS
//
// /api/reminders/...
// ============================================================

app.use(
  "/api/reminders",
  reminderRoutes
);


// ============================================================
// AI ACTION EXTRACTOR
//
// /api/actions/...
// ============================================================

app.use(
  "/api/actions",
  actionRoutes
);


// ============================================================
// DOCUMENT INTELLIGENCE TIMELINE
//
// GET
// /api/timeline
//
// POST
// /api/timeline/generate
//
// DELETE
// /api/timeline/:id
// ============================================================

app.use(
  "/api/timeline",
  timelineRoutes
);


// ============================================================
// AI FORM / FILLING ASSISTANT
//
// GET
// /api/form-fill
//
// POST
// /api/form-fill/generate
//
// GET
// /api/form-fill/:id
//
// PATCH
// /api/form-fill/:id/field/:fieldId
//
// DELETE
// /api/form-fill/:id
// ============================================================

app.use(
  "/api/form-fill",
  formFillRoutes
);


// ============================================================
// ROOT HEALTH CHECK
// ============================================================

app.get(
  "/",
  (req, res) => {

    return res.status(200).json({

      success: true,

      message:
        "LifeVault AI API is running.",

      status:
        "healthy",

      timestamp:
        new Date().toISOString()

    });

  }
);


// ============================================================
// API HEALTH CHECK
// ============================================================

app.get(
  "/api/health",
  (req, res) => {

    return res.status(200).json({

      success: true,

      message:
        "LifeVault AI backend is healthy.",

      database:
        mongoose.connection.readyState === 1
          ? "connected"
          : "disconnected",

      timestamp:
        new Date().toISOString()

    });

  }
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (req, res) => {

    return res.status(404).json({

      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`

    });

  }
);


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {

    console.error(
      "Global server error:",
      error
    );


    // ========================================================
    // MULTER ERROR
    // ========================================================

    if (
      error instanceof multer.MulterError
    ) {

      // ------------------------------------------------------
      // FILE TOO LARGE
      // ------------------------------------------------------

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "File is too large. Maximum allowed size is 10 MB."

        });

      }


      // ------------------------------------------------------
      // UNEXPECTED FIELD
      // ------------------------------------------------------

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {

        return res.status(400).json({

          success: false,

          message:
            `Unexpected file field: ${error.field}. Use "document" or "file".`

        });

      }


      // ------------------------------------------------------
      // OTHER MULTER ERROR
      // ------------------------------------------------------

      return res.status(400).json({

        success: false,

        message:
          error.message ||
          "File upload error."

      });

    }


    // ========================================================
    // MONGOOSE CAST ERROR
    // ========================================================

    if (
      error.name ===
      "CastError"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid ID or request parameter."

      });

    }


    // ========================================================
    // MONGOOSE VALIDATION ERROR
    // ========================================================

    if (
      error.name ===
      "ValidationError"
    ) {

      const messages =
        Object.values(
          error.errors || {}
        ).map(
          (item) =>
            item.message
        );


      return res.status(400).json({

        success: false,

        message:
          messages.length > 0
            ? messages.join(", ")
            : "Validation error."

      });

    }


    // ========================================================
    // DUPLICATE KEY ERROR
    // ========================================================

    if (
      error.code === 11000
    ) {

      return res.status(409).json({

        success: false,

        message:
          "A record with the same unique value already exists."

      });

    }


    // ========================================================
    // DEFAULT SERVER ERROR
    // ========================================================

    return res.status(
      error.statusCode || 500
    ).json({

      success: false,

      message:
        error.message ||
        "Internal server error.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.stack
          : undefined

    });

  }
);


// ============================================================
// MONGODB CONNECTION
// ============================================================

const connectDatabase =
  async () => {

    try {

      // ======================================================
      // MONGO URI
      // ======================================================

      const mongoURI =
        process.env.MONGO_URI ||
        process.env.MONGODB_URI;


      // ======================================================
      // CHECK URI
      // ======================================================

      if (!mongoURI) {

        console.error(
          "❌ MONGO_URI is missing from .env"
        );

        process.exit(1);

      }


      // ======================================================
      // CONNECT
      // ======================================================

      await mongoose.connect(
        mongoURI
      );


      console.log(
        "MongoDB connected successfully ✅"
      );

    } catch (error) {

      console.error(
        "MongoDB connection failed:",
        error.message
      );

      process.exit(1);

    }

  };


// ============================================================
// START SERVER
// ============================================================

const startServer =
  async () => {

    try {

      // ======================================================
      // CONNECT DATABASE FIRST
      // ======================================================

      await connectDatabase();


      // ======================================================
      // START EXPRESS
      // ======================================================

      app.listen(
        PORT,
        () => {

          console.log(
            `LifeVault AI server running on port ${PORT}`
          );

        }
      );

    } catch (error) {

      console.error(
        "Server startup error:",
        error
      );

      process.exit(1);

    }

  };


// ============================================================
// START APPLICATION
// ============================================================

startServer();


// ============================================================
// UNHANDLED PROMISE REJECTION
// ============================================================

process.on(
  "unhandledRejection",
  (error) => {

    console.error(
      "Unhandled Promise Rejection:",
      error
    );

  }
);


// ============================================================
// UNCAUGHT EXCEPTION
// ============================================================

process.on(
  "uncaughtException",
  (error) => {

    console.error(
      "Uncaught Exception:",
      error
    );

  }
);


// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;