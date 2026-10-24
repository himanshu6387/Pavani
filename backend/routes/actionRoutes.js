const express = require("express");

const router =
  express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {
  extractActionsFromDocument,
  getActions,
  updateActionStatus,
  deleteAction
} = require(
  "../controllers/actionController"
);


// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const protect =
  require(
    "../middleware/authMiddleware"
  );


// ============================================================
// GET ALL ACTIONS
//
// GET /api/actions
//
// Optional:
//
// GET /api/actions?status=pending
// GET /api/actions?status=completed
// GET /api/actions?status=dismissed
// ============================================================

router.get(
  "/",
  protect,
  getActions
);


// ============================================================
// EXTRACT ACTIONS FROM DOCUMENT
//
// POST /api/actions/extract/:documentId
//
// Example:
//
// POST
// /api/actions/extract/665f12345678901234567890
//
// ============================================================

router.post(
  "/extract/:documentId",
  protect,
  extractActionsFromDocument
);


// ============================================================
// UPDATE ACTION STATUS
//
// PATCH /api/actions/:id/status
//
// Body:
//
// {
//   "status": "completed"
// }
//
// OR:
//
// {
//   "status": "dismissed"
// }
//
// OR:
//
// {
//   "status": "pending"
// }
//
// ============================================================

router.patch(
  "/:id/status",
  protect,
  updateActionStatus
);


// ============================================================
// DELETE ACTION
//
// DELETE /api/actions/:id
// ============================================================

router.delete(
  "/:id",
  protect,
  deleteAction
);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;