const express = require("express");

const protect =
  require("../middleware/authMiddleware");

const {
  processDocument
} = require(
  "../controllers/aiController"
);


const router =
  express.Router();


// ==========================================
// ANALYZE DOCUMENT
// ==========================================

router.post(
  "/documents/:id/analyze",
  protect,
  processDocument
);


module.exports = router;