const express = require("express");

const router = express.Router();


// ============================================================
// CONTROLLERS
// ============================================================

const {
  askLifeVaultController,
  askAboutDocument,
} = require("../controllers/askController");


// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const protect = require("../middleware/authMiddleware");


// ============================================================
// ASK LIFEVAULT
// POST /api/ask
// ============================================================

router.post(
  "/",
  protect,
  askLifeVaultController
);


// ============================================================
// ASK ABOUT SINGLE DOCUMENT
// POST /api/ask/document/:id
// ============================================================

router.post(
  "/document/:id",
  protect,
  askAboutDocument
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;