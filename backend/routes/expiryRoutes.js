const express = require("express");

const router = express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {
  getExpiryDocuments,
  getDocumentExpiryStatus,
  getUpcomingExpiries,
} = require("../controllers/expiryController");


// ============================================================
// MIDDLEWARE
// ============================================================

const protect =
  require("../middleware/authMiddleware");


// ============================================================
// GET ALL EXPIRY INFORMATION
//
// GET /api/documents/expiry
//
// Returns:
//
// expired
// expiringSoon
// valid
// noExpiry
// ============================================================

router.get(
  "/",
  protect,
  getExpiryDocuments
);


// ============================================================
// GET UPCOMING EXPIRIES
//
// GET /api/documents/expiry/upcoming
//
// Optional:
//
// ?days=30
// ?days=60
// ?days=90
// ============================================================

router.get(
  "/upcoming",
  protect,
  getUpcomingExpiries
);


// ============================================================
// GET SINGLE DOCUMENT EXPIRY STATUS
//
// GET /api/documents/expiry/:id
//
// IMPORTANT:
// This route is intentionally:
//
// /expiry/:id
//
// and NOT:
//
// /:id/expiry
//
// because we will mount this router separately.
// ============================================================

router.get(
  "/:id",
  protect,
  getDocumentExpiryStatus
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;