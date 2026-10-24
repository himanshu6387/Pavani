const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const Document = require("../models/Document");

const { extractText } =
  require("../services/textExtractionService");

const { analyzeDocument } =
  require("../services/aiService");


// ============================================================
// CONSTANTS
// ============================================================

const VALID_CATEGORIES = [
  "Other",
  "Identity",
  "Medical",
  "Financial",
  "Insurance",
  "Education",
  "Legal",
  "Property",
  "Employment",
];


// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


const getUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};


// ============================================================
// GET UPLOADED FILE
// Supports:
//
// upload.single("document")
//
// upload.fields([
//   { name: "document" },
//   { name: "file" }
// ])
// ============================================================

const getUploadedFile = (req) => {

  // ------------------------------------------
  // upload.single()
  // ------------------------------------------

  if (req.file) {
    return req.file;
  }


  // ------------------------------------------
  // upload.fields()
  // ------------------------------------------

  if (req.files) {

    // document field
    if (
      Array.isArray(req.files.document) &&
      req.files.document.length > 0
    ) {
      return req.files.document[0];
    }


    // file field fallback
    if (
      Array.isArray(req.files.file) &&
      req.files.file.length > 0
    ) {
      return req.files.file[0];
    }

  }


  return null;
};


// ============================================================
// SAFE FILE DELETE
// ============================================================

const safelyDeleteFile = (filePath) => {

  try {

    if (
      filePath &&
      fs.existsSync(filePath)
    ) {

      fs.unlinkSync(filePath);

      console.log(
        "Deleted physical file:",
        filePath
      );
    }

  } catch (error) {

    console.error(
      "Unable to delete physical file:",
      error.message
    );

  }

};


// ============================================================
// APPLY AI RESULT
// ============================================================

const applyAIResult = (
  document,
  aiResult,
  extractedText
) => {

  if (!aiResult) {
    return;
  }


  // ------------------------------------------
  // SUMMARY
  // ------------------------------------------

  document.aiSummary =
    typeof aiResult.summary === "string"
      ? aiResult.summary
      : "";


  // ------------------------------------------
  // EXTRACTED TEXT
  // ------------------------------------------

  document.extractedText =
    extractedText || "";


  // ------------------------------------------
  // DOCUMENT TYPE
  // ------------------------------------------

  document.documentType =
    typeof aiResult.documentType === "string"
      ? aiResult.documentType
      : "";


  // ------------------------------------------
  // IMPORTANT INFORMATION
  // ------------------------------------------

  if (
    Array.isArray(
      aiResult.importantInformation
    )
  ) {

    document.keyInformation =
      aiResult.importantInformation;

  } else {

    document.keyInformation = [];

  }


  // ------------------------------------------
  // EXPIRY DATE
  // ------------------------------------------

  document.expiryDate = null;
  document.expiryDetected = false;


  if (aiResult.expiryDate) {

    const parsedExpiry =
      new Date(
        aiResult.expiryDate
      );


    if (
      !Number.isNaN(
        parsedExpiry.getTime()
      )
    ) {

      document.expiryDate =
        parsedExpiry;

      document.expiryDetected =
        true;

    }

  }


  // ------------------------------------------
  // AI INSIGHTS
  // ------------------------------------------

  document.aiInsights =
    Array.isArray(
      aiResult.aiInsights
    )
      ? aiResult.aiInsights
      : [];


  // ------------------------------------------
  // AI WARNINGS
  // ------------------------------------------

  document.aiWarnings =
    Array.isArray(
      aiResult.aiWarnings
    )
      ? aiResult.aiWarnings
      : [];


  // ------------------------------------------
  // AI STATUS
  // ------------------------------------------

  document.aiProcessed =
    true;

  document.aiProcessingStatus =
    "completed";


  // ------------------------------------------
  // CATEGORY
  // ------------------------------------------

  if (
    aiResult.documentType &&
    VALID_CATEGORIES.includes(
      aiResult.documentType
    )
  ) {

    document.category =
      aiResult.documentType;

  }

};


// ============================================================
// UPLOAD DOCUMENT
//
// POST /api/documents/upload
// ============================================================

const uploadDocument = async (
  req,
  res
) => {

  let uploadedFile = null;
  let createdDocument = null;


  try {

    console.log(
      "============================================================"
    );

    console.log(
      "DOCUMENT UPLOAD REQUEST"
    );

    console.log(
      "============================================================"
    );


    // ========================================================
    // AUTH CHECK
    // ========================================================

    const userId =
      getUserId(req);


    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });

    }


    // ========================================================
    // FILE CHECK
    // ========================================================

    /*
    IMPORTANT FIX:

    The route may use multer.fields(), therefore
    the uploaded file can exist in req.files instead
    of req.file.

    We support both.
    */

    uploadedFile =
      getUploadedFile(req);


    if (!uploadedFile) {

      console.error(
        "No uploaded file received."
      );

      console.error(
        "req.file:",
        req.file
      );

      console.error(
        "req.files:",
        req.files
      );


      return res.status(400).json({

        success: false,

        message:
          "Please select a document.",

      });

    }


    // ========================================================
    // MULTER FILE DATA
    // ========================================================

    console.log(
      "Multer received file:"
    );

    console.log(
      "Field name:",
      uploadedFile.fieldname
    );

    console.log(
      "Original name:",
      uploadedFile.originalname
    );

    console.log(
      "MIME type:",
      uploadedFile.mimetype
    );

    console.log(
      "File size:",
      uploadedFile.size
    );


    // ========================================================
    // FILE PATH
    // ========================================================

    const filePath =
      path.resolve(
        uploadedFile.path
      );


    // ========================================================
    // CATEGORY
    // ========================================================

    let category =
      typeof req.body?.category === "string"
        ? req.body.category.trim()
        : "Other";


    if (
      !VALID_CATEGORIES.includes(
        category
      )
    ) {

      category = "Other";

    }


    // ========================================================
    // DESCRIPTION
    // ========================================================

    const description =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : "";


    // ========================================================
    // CREATE DOCUMENT
    // ========================================================

    createdDocument =
      await Document.create({

        owner:
          userId,

        originalName:
          uploadedFile.originalname,

        storedName:
          uploadedFile.filename,

        filePath:
          filePath,

        mimeType:
          uploadedFile.mimetype,

        size:
          uploadedFile.size,

        category:
          category,

        description:
          description,

        aiProcessed:
          false,

        aiProcessingStatus:
          "processing",

        extractedText:
          "",

        documentType:
          "",

        aiSummary:
          "",

        keyInformation:
          [],

        expiryDate:
          null,

        expiryDetected:
          false,

        aiInsights:
          [],

        aiWarnings:
          [],

      });


    // ========================================================
    // TEXT EXTRACTION
    // ========================================================

    let extractedText = "";


    try {

      console.log(
        "Extracting:",
        uploadedFile.mimetype
      );


      extractedText =
        await extractText(
          filePath,
          uploadedFile.mimetype
        );


      console.log(
        "Extracted text length:",
        extractedText?.length || 0
      );


    } catch (error) {

      console.error(
        "Text extraction error:",
        error.message
      );


      createdDocument.aiProcessingStatus =
        "failed";

      createdDocument.aiProcessed =
        false;


      await createdDocument.save();


      return res.status(201).json({

        success: true,

        message:
          "Document uploaded successfully, but text extraction failed.",

        document:
          createdDocument,

      });

    }


    // ========================================================
    // SAVE EXTRACTED TEXT
    // ========================================================

    createdDocument.extractedText =
      extractedText || "";


    // ========================================================
    // NO TEXT
    // ========================================================

    if (
      !extractedText ||
      !extractedText.trim()
    ) {

      createdDocument.aiProcessed =
        false;

      createdDocument.aiProcessingStatus =
        "failed";


      await createdDocument.save();


      return res.status(201).json({

        success: true,

        message:
          "Document uploaded successfully. No readable text was found for AI analysis.",

        document:
          createdDocument,

      });

    }


    // ========================================================
    // AI ANALYSIS
    // ========================================================

    let aiResult = null;


    try {

      console.log(
        "Starting AI document analysis..."
      );


      aiResult =
        await analyzeDocument(
          extractedText
        );


      console.log(
        "AI document analysis completed successfully."
      );


      console.log(
        "Document type:",
        aiResult?.documentType
      );


      console.log(
        "Expiry date:",
        aiResult?.expiryDate
      );


      console.log(
        "Important information count:",
        Array.isArray(
          aiResult?.importantInformation
        )
          ? aiResult.importantInformation.length
          : 0
      );


    } catch (error) {

      console.error(
        "AI analysis error:",
        error.message
      );


      /*
      IMPORTANT:

      Upload must not fail simply because AI fails.

      The document is already safely stored.
      */

      createdDocument.aiProcessed =
        false;

      createdDocument.aiProcessingStatus =
        "failed";

      createdDocument.extractedText =
        extractedText;


      await createdDocument.save();


      return res.status(201).json({

        success: true,

        message:
          "Document uploaded successfully. AI analysis could not be completed.",

        document:
          createdDocument,

      });

    }


    // ========================================================
    // APPLY AI RESULT
    // ========================================================

    applyAIResult(
      createdDocument,
      aiResult,
      extractedText
    );


    // ========================================================
    // SAVE FINAL DOCUMENT
    // ========================================================

    await createdDocument.save();


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({

      success: true,

      message:
        "Document uploaded and analyzed successfully.",

      document:
        createdDocument,

    });


  } catch (error) {

    console.error(
      "Upload document error:",
      error
    );


    // ========================================================
    // CLEANUP
    // ========================================================

    if (
      uploadedFile &&
      uploadedFile.path &&
      !createdDocument
    ) {

      safelyDeleteFile(
        uploadedFile.path
      );

    }


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(500).json({

      success: false,

      message:
        "Failed to upload document.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// ============================================================
// GET ALL DOCUMENTS
//
// GET /api/documents
// ============================================================

const getDocuments = async (
  req,
  res
) => {

  try {

    // ========================================================
    // AUTH
    // ========================================================

    const userId =
      getUserId(req);


    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });

    }


    // ========================================================
    // FETCH ONLY USER DOCUMENTS
    // ========================================================

    const documents =
      await Document.find({

        owner:
          userId,

      })
      .sort({
        createdAt: -1,
      });


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      count:
        documents.length,

      documents,

    });


  } catch (error) {

    console.error(
      "Get documents error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch documents.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// ============================================================
// GET SINGLE DOCUMENT
//
// GET /api/documents/:id
// ============================================================

const getDocumentById = async (
  req,
  res
) => {

  try {

    // ========================================================
    // AUTH
    // ========================================================

    const userId =
      getUserId(req);


    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });

    }


    // ========================================================
    // VALIDATE ID
    // ========================================================

    const documentId =
      req.params.id;


    if (
      !isValidObjectId(
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
    // OWNER-ONLY QUERY
    // ========================================================

    const document =
      await Document.findOne({

        _id:
          documentId,

        owner:
          userId,

      });


    // ========================================================
    // NOT FOUND
    // ========================================================

    if (!document) {

      return res.status(404).json({

        success: false,

        message:
          "Document not found.",

      });

    }


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      document,

    });


  } catch (error) {

    console.error(
      "Get document error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch document.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// ============================================================
// RE-ANALYZE DOCUMENT
//
// POST /api/documents/:id/reanalyze
// ============================================================

const reanalyzeDocument = async (
  req,
  res
) => {

  try {

    // ========================================================
    // AUTH
    // ========================================================

    const userId =
      getUserId(req);


    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });

    }


    // ========================================================
    // VALIDATE ID
    // ========================================================

    const documentId =
      req.params.id;


    if (
      !isValidObjectId(
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
    // FIND ONLY OWNER DOCUMENT
    // ========================================================

    const document =
      await Document.findOne({

        _id:
          documentId,

        owner:
          userId,

      });


    if (!document) {

      return res.status(404).json({

        success: false,

        message:
          "Document not found.",

      });

    }


    // ========================================================
    // CHECK EXTRACTED TEXT
    // ========================================================

    if (
      !document.extractedText ||
      !document.extractedText.trim()
    ) {

      return res.status(400).json({

        success: false,

        message:
          "No extracted text is available for re-analysis.",

      });

    }


    // ========================================================
    // PROCESSING STATUS
    // ========================================================

    document.aiProcessingStatus =
      "processing";

    document.aiProcessed =
      false;


    await document.save();


    // ========================================================
    // AI ANALYSIS
    // ========================================================

    let aiResult = null;


    try {

      console.log(
        "Starting document re-analysis..."
      );


      console.log(
        "Document:",
        document._id.toString()
      );


      aiResult =
        await analyzeDocument(
          document.extractedText
        );


      console.log(
        "Document re-analysis completed."
      );


    } catch (error) {

      console.error(
        "Re-analysis AI error:",
        error.message
      );


      document.aiProcessingStatus =
        "failed";

      document.aiProcessed =
        false;


      await document.save();


      return res.status(500).json({

        success: false,

        message:
          "AI re-analysis failed.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,

      });

    }


    // ========================================================
    // APPLY AI RESULT
    // ========================================================

    applyAIResult(
      document,
      aiResult,
      document.extractedText
    );


    // ========================================================
    // SAVE
    // ========================================================

    await document.save();


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      message:
        "Document re-analyzed successfully.",

      document,

    });


  } catch (error) {

    console.error(
      "Re-analyze document error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to re-analyze document.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// ============================================================
// DELETE DOCUMENT
//
// DELETE /api/documents/:id
// ============================================================

const deleteDocument = async (
  req,
  res
) => {

  try {

    // ========================================================
    // AUTH
    // ========================================================

    const userId =
      getUserId(req);


    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });

    }


    // ========================================================
    // VALIDATE ID
    // ========================================================

    const documentId =
      req.params.id;


    if (
      !isValidObjectId(
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
    // OWNER ONLY
    // ========================================================

    const document =
      await Document.findOne({

        _id:
          documentId,

        owner:
          userId,

      });


    // ========================================================
    // NOT FOUND
    // ========================================================

    if (!document) {

      return res.status(404).json({

        success: false,

        message:
          "Document not found.",

      });

    }


    // ========================================================
    // SAVE FILE PATH BEFORE DB DELETE
    // ========================================================

    const filePath =
      document.filePath;


    // ========================================================
    // DELETE DATABASE DOCUMENT
    // ========================================================

    await Document.deleteOne({

      _id:
        document._id,

      owner:
        userId,

    });


    // ========================================================
    // DELETE PHYSICAL FILE
    // ========================================================

    safelyDeleteFile(
      filePath
    );


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      message:
        "Document deleted successfully.",

    });


  } catch (error) {

    console.error(
      "Delete document error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Failed to delete document.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  uploadDocument,

  getDocuments,

  getDocumentById,

  reanalyzeDocument,

  deleteDocument,

};