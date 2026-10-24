const express = require("express");

const router =
  express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {
  createReminder,
  getReminders,
  getReminderById,
  getUpcomingReminders,
  getOverdueReminders,
  generateReminders,
  updateReminder,
  completeReminder,
  dismissReminder,
  deleteReminder,
} = require(
  "../controllers/reminderController"
);


// ============================================================
// AUTH
// ============================================================

const protect =
  require(
    "../middleware/authMiddleware"
  );


// ============================================================
// IMPORTANT:
// STATIC ROUTES MUST COME BEFORE /:id
// ============================================================


// ============================================================
// GENERATE EXPIRY REMINDERS
// POST /api/reminders/generate
// ============================================================

router.post(
  "/generate",
  protect,
  generateReminders
);


// ============================================================
// UPCOMING
// GET /api/reminders/upcoming
// ============================================================

router.get(
  "/upcoming",
  protect,
  getUpcomingReminders
);


// ============================================================
// OVERDUE
// GET /api/reminders/overdue
// ============================================================

router.get(
  "/overdue",
  protect,
  getOverdueReminders
);


// ============================================================
// ALL REMINDERS
// GET /api/reminders
// ============================================================

router.get(
  "/",
  protect,
  getReminders
);


// ============================================================
// CREATE
// POST /api/reminders
// ============================================================

router.post(
  "/",
  protect,
  createReminder
);


// ============================================================
// COMPLETE
// PATCH /api/reminders/:id/complete
// ============================================================

router.patch(
  "/:id/complete",
  protect,
  completeReminder
);


// ============================================================
// DISMISS
// PATCH /api/reminders/:id/dismiss
// ============================================================

router.patch(
  "/:id/dismiss",
  protect,
  dismissReminder
);


// ============================================================
// UPDATE
// PUT /api/reminders/:id
// ============================================================

router.put(
  "/:id",
  protect,
  updateReminder
);


// ============================================================
// DELETE
// DELETE /api/reminders/:id
// ============================================================

router.delete(
  "/:id",
  protect,
  deleteReminder
);


// ============================================================
// SINGLE REMINDER
// GET /api/reminders/:id
// ============================================================

router.get(
  "/:id",
  protect,
  getReminderById
);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;