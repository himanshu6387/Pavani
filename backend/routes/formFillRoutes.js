const express = require("express");

const router = express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {
  generateFormFill,
  getFormFill,
  getFormFills,
  updateFormField,
  deleteFormFill
} = require(
  "../controllers/formFillController"
);


// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const protect =
  require(
    "../middleware/authMiddleware"
  );


// ============================================================
// GET ALL FORM-FILL RECORDS
//
// GET /api/form-fill
//
// Returns all AI form-filling sessions belonging to the
// currently authenticated user.
// ============================================================

router.get(
  "/",
  protect,
  getFormFills
);


// ============================================================
// GENERATE AI FORM SUGGESTIONS
//
// POST /api/form-fill/generate
//
// Body:
//
// {
//   "formName": "Insurance Claim Form",
//   "description": "Claim form for medical expenses",
//   "documentIds": [
//     "DOCUMENT_ID"
//   ],
//   "fields": [
//     {
//       "fieldName": "fullName",
//       "label": "Full Name",
//       "fieldType": "text",
//       "required": true
//     }
//   ]
// }
// ============================================================

router.post(
  "/generate",
  protect,
  generateFormFill
);


// ============================================================
// GET SINGLE FORM-FILL RECORD
//
// GET /api/form-fill/:id
// ============================================================

router.get(
  "/:id",
  protect,
  getFormFill
);


// ============================================================
// UPDATE INDIVIDUAL FORM FIELD
//
// PATCH /api/form-fill/:id/field/:fieldId
//
// Body:
//
// {
//   "finalValue": "Deepanshi Rautela",
//   "verified": true
// }
// ============================================================

router.patch(
  "/:id/field/:fieldId",
  protect,
  updateFormField
);


// ============================================================
// DELETE FORM-FILL RECORD
//
// DELETE /api/form-fill/:id
// ============================================================

router.delete(
  "/:id",
  protect,
  deleteFormFill
);


// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;