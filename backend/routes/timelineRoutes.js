const express = require("express");

const router =
  express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {
  generateTimeline,
  getTimeline,
  deleteTimelineEvent
} = require(
  "../controllers/timelineController"
);


// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const protect =
  require(
    "../middleware/authMiddleware"
  );


// ============================================================
// GET TIMELINE
//
// GET /api/timeline
//
// Optional:
//
// GET /api/timeline?type=medical
//
// GET /api/timeline?importance=high
//
// GET /api/timeline?type=insurance&importance=high
// ============================================================

router.get(
  "/",
  protect,
  getTimeline
);


// ============================================================
// GENERATE TIMELINE
//
// POST /api/timeline/generate
//
// Scans all documents belonging to the logged-in user.
// ============================================================

router.post(
  "/generate",
  protect,
  generateTimeline
);


// ============================================================
// DELETE TIMELINE EVENT
//
// DELETE /api/timeline/:id
// ============================================================

router.delete(
  "/:id",
  protect,
  deleteTimelineEvent
);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;