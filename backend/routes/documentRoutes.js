const express = require("express");

const router = express.Router();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");


// ============================================================
// MODEL
// ============================================================

const Document = require("../models/Document");


// ============================================================
// CONTROLLER
// ============================================================

const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  reanalyzeDocument,
  deleteDocument,
} = require("../controllers/documentController");


// ============================================================
// MIDDLEWARE
// ============================================================

const protect =
  require("../middleware/authMiddleware");

const upload =
  require("../middleware/uploadMiddleware");


// ============================================================
// GET ALL DOCUMENTS
// GET /api/documents
// ============================================================

router.get(
  "/",
  protect,
  getDocuments
);


// ============================================================
// UPLOAD DOCUMENT
// POST /api/documents/upload
//
// Accept BOTH:
//
// document
// file
//
// This prevents old frontend/stale tabs from causing:
//
// MulterError: Unexpected field
//
// Controller will use document first,
// then fallback to file.
// ============================================================

router.post(
  "/upload",
  protect,

  upload.fields([
    {
      name: "document",
      maxCount: 1,
    },

    {
      name: "file",
      maxCount: 1,
    },
  ]),

  uploadDocument
);


// ============================================================
// OPEN DOCUMENT
// GET /api/documents/:id/file
//
// Used by frontend "Open Document" button.
//
// IMPORTANT:
// This route checks:
//
// 1. Valid MongoDB ObjectId
// 2. User authentication
// 3. Document belongs to logged-in user
// 4. File exists
// ============================================================

router.get(
  "/:id/file",
  protect,

  async (req, res) => {

    try {

      // ========================================================
      // VALIDATE DOCUMENT ID
      // ========================================================

      const documentId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          documentId
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid document ID.",

        });

      }


      // ========================================================
      // FIND DOCUMENT
      // ONLY OWNER CAN ACCESS
      // ========================================================

      const document =
        await Document.findOne({

          _id: documentId,

          owner: req.user._id,

        });


      // ========================================================
      // DOCUMENT NOT FOUND
      // ========================================================

      if (!document) {

        return res.status(404).json({

          success: false,

          message:
            "Document not found.",

        });

      }


      // ========================================================
      // CHECK FILE PATH
      // ========================================================

      if (
        !document.filePath
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Document file path is not available.",

        });

      }


      // ========================================================
      // RESOLVE FILE PATH
      // ========================================================

      const filePath =
        path.resolve(
          document.filePath
        );


      // ========================================================
      // CHECK FILE EXISTS
      // ========================================================

      if (
        !fs.existsSync(
          filePath
        )
      ) {

        console.error(
          "Document file does not exist:",
          filePath
        );

        return res.status(404).json({

          success: false,

          message:
            "Document file was not found on the server.",

        });

      }


      // ========================================================
      // SET CONTENT TYPE
      // ========================================================

      if (
        document.mimeType
      ) {

        res.setHeader(
          "Content-Type",
          document.mimeType
        );

      }


      // ========================================================
      // INLINE DISPLAY
      //
      // Browser should open PDF/image instead
      // of downloading it.
      // ========================================================

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(
          document.originalName ||
          document.storedName ||
          "document"
        )}"`
      );


      // ========================================================
      // SEND FILE
      // ========================================================

      return res.sendFile(
        filePath
      );

    } catch (error) {

      console.error(
        "Open document error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to open document.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,

      });

    }

  }
);


// ============================================================
// DOWNLOAD DOCUMENT
// GET /api/documents/:id/download
//
// Used by frontend Download button.
// ============================================================

router.get(
  "/:id/download",
  protect,

  async (req, res) => {

    try {

      // ========================================================
      // VALIDATE DOCUMENT ID
      // ========================================================

      const documentId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          documentId
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid document ID.",

        });

      }


      // ========================================================
      // FIND DOCUMENT
      // ========================================================

      const document =
        await Document.findOne({

          _id: documentId,

          owner: req.user._id,

        });


      // ========================================================
      // DOCUMENT NOT FOUND
      // ========================================================

      if (!document) {

        return res.status(404).json({

          success: false,

          message:
            "Document not found.",

        });

      }


      // ========================================================
      // CHECK FILE PATH
      // ========================================================

      if (
        !document.filePath
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Document file path is not available.",

        });

      }


      // ========================================================
      // RESOLVE FILE PATH
      // ========================================================

      const filePath =
        path.resolve(
          document.filePath
        );


      // ========================================================
      // CHECK FILE EXISTS
      // ========================================================

      if (
        !fs.existsSync(
          filePath
        )
      ) {

        console.error(
          "Download file does not exist:",
          filePath
        );

        return res.status(404).json({

          success: false,

          message:
            "Document file was not found on the server.",

        });

      }


      // ========================================================
      // DOWNLOAD FILE
      // ========================================================

      return res.download(

        filePath,

        document.originalName ||
          document.storedName ||
          "document",

        (error) => {

          if (error) {

            console.error(
              "Document download error:",
              error
            );

            // If headers have already been sent,
            // don't try to send another response.

            if (
              !res.headersSent
            ) {

              return res.status(500).json({

                success: false,

                message:
                  "Unable to download document.",

              });

            }

          }

        }

      );

    } catch (error) {

      console.error(
        "Download document error:",
        error
      );

      if (
        !res.headersSent
      ) {

        return res.status(500).json({

          success: false,

          message:
            "Unable to download document.",

          error:
            process.env.NODE_ENV ===
            "development"
              ? error.message
              : undefined,

        });

      }

    }

  }
);


// ============================================================
// RE-ANALYZE DOCUMENT
// POST /api/documents/:id/reanalyze
// ============================================================

router.post(
  "/:id/reanalyze",
  protect,
  reanalyzeDocument
);


// ============================================================
// GET SINGLE DOCUMENT
// GET /api/documents/:id
// ============================================================

router.get(
  "/:id",
  protect,
  getDocumentById
);


// ============================================================
// DELETE DOCUMENT
// DELETE /api/documents/:id
// ============================================================

router.delete(
  "/:id",
  protect,
  deleteDocument
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;