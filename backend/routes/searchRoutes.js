const express = require("express");

const router = express.Router();

const {
  searchDocuments,
} = require("../controllers/searchController");

const protect =
  require("../middleware/authMiddleware");

// ============================================================
// SEARCH DOCUMENTS
// ============================================================

router.get(
  "/",
  protect,
  searchDocuments
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;