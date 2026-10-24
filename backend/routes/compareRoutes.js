const express = require("express");

const router =
  express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {
  compareDocuments
} = require(
  "../controllers/compareController"
);


// ============================================================
// MIDDLEWARE
// ============================================================

const protect =
  require(
    "../middleware/authMiddleware"
  );


// ============================================================
// COMPARE DOCUMENTS
//
// POST /api/documents/compare
//
// Body:
//
// {
//   "documentId1": "DOCUMENT_ID_1",
//   "documentId2": "DOCUMENT_ID_2"
// }
//
// ============================================================

router.post(
  "/",
  protect,
  compareDocuments
);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;