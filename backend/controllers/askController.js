const Document = require("../models/Document");

const {
  askAI,
  askLifeVault
} = require("../services/askVaultService");

// ============================================================
// ASK LIFEVAULT
// POST /api/ask
// ============================================================

const askLifeVaultController = async (req, res) => {
  try {

    // ========================================================
    // AUTHENTICATION CHECK
    // ========================================================

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    // ========================================================
    // USER ID
    // ========================================================

    const userId =
      req.user._id ||
      req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication session."
      });
    }

    // ========================================================
    // QUESTION
    // ========================================================

    const question =
      typeof req.body?.question === "string"
        ? req.body.question.trim()
        : "";

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Please enter a question."
      });
    }

    // ========================================================
    // QUESTION LENGTH PROTECTION
    // ========================================================

    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        message:
          "Question is too long. Please keep it under 1000 characters."
      });
    }

    // ========================================================
    // FETCH USER DOCUMENTS
    // ========================================================

    const documents = await Document.find({
      owner: userId
    })
      .sort({
        createdAt: -1
      })
      .limit(50);

    // ========================================================
    // NO DOCUMENTS
    // ========================================================

    if (
      !documents ||
      documents.length === 0
    ) {
      return res.status(200).json({
        success: true,
        answer:
          "Your LifeVault does not contain any documents yet. Upload a document first and then ask me about it.",
        sources: [],
        documentsUsed: 0
      });
    }

    // ========================================================
    // PREPARE DOCUMENT DATA
    // ========================================================

    const documentData =
      documents.map(
        (document) => {

          return {
            _id:
              document._id,

            originalName:
              document.originalName,

            storedName:
              document.storedName,

            category:
              document.category,

            documentType:
              document.documentType,

            aiSummary:
              document.aiSummary,

            extractedText:
              document.extractedText,

            keyInformation:
              document.keyInformation,

            expiryDate:
              document.expiryDate,

            expiryDetected:
              document.expiryDetected,

            aiProcessed:
              document.aiProcessed,

            aiProcessingStatus:
              document.aiProcessingStatus,

            createdAt:
              document.createdAt
          };

        }
      );

    // ========================================================
    // ASK AI
    // ========================================================

    console.log(
      "============================================================"
    );

    console.log(
      "Ask LifeVault request received."
    );

    console.log(
      "User:",
      userId.toString()
    );

    console.log(
      "Question:",
      question
    );

    console.log(
      "Documents available:",
      documentData.length
    );

    // ========================================================
    // CALL AI SERVICE
    // ========================================================

    let aiResponse;

    try {

      if (
        typeof askAI ===
        "function"
      ) {

        aiResponse =
          await askAI(
            question,
            documentData
          );

      } else if (
        typeof askLifeVault ===
        "function"
      ) {

        aiResponse =
          await askLifeVault(
            question,
            documentData
          );

      } else {

        throw new Error(
          "Ask AI service function is not available."
        );

      }

    } catch (aiError) {

      console.error(
        "Ask LifeVault AI service error:",
        aiError.message
      );

      // ======================================================
      // GROQ RATE LIMIT
      // ======================================================

      if (
        aiError.status === 429 ||
        aiError.status === 413 ||
        aiError.code ===
          "rate_limit_exceeded"
      ) {

        return res.status(503).json({
          success: false,

          message:
            "LifeVault AI is temporarily busy. Please try again in a moment.",

          errorType:
            "AI_RATE_LIMIT"
        });

      }

      // ======================================================
      // GROQ MODEL ERROR
      // ======================================================

      if (
        aiError.status === 404 ||
        aiError.code ===
          "model_not_found"
      ) {

        return res.status(503).json({
          success: false,

          message:
            "LifeVault AI model is currently unavailable. Please check the AI configuration.",

          errorType:
            "AI_MODEL_ERROR"
        });

      }

      // ======================================================
      // GENERIC AI ERROR
      // ======================================================

      return res.status(500).json({
        success: false,

        message:
          "LifeVault AI could not process your question.",

        errorType:
          "AI_ERROR",

        error:
          process.env.NODE_ENV ===
          "development"
            ? aiError.message
            : undefined
      });
    }

    // ========================================================
    // NORMALIZE AI RESPONSE
    // ========================================================

    let answer = "";

    let sources = [];

    // ========================================================
    // OBJECT RESPONSE
    // ========================================================

    if (
      aiResponse &&
      typeof aiResponse ===
        "object"
    ) {

      answer =
        typeof aiResponse.answer ===
        "string"
          ? aiResponse.answer.trim()
          : "";

      if (
        Array.isArray(
          aiResponse.sources
        )
      ) {

        sources =
          aiResponse.sources;

      }

    }

    // ========================================================
    // STRING RESPONSE
    // ========================================================

    else if (
      typeof aiResponse ===
      "string"
    ) {

      answer =
        aiResponse.trim();

    }

    // ========================================================
    // EMPTY RESPONSE
    // ========================================================

    if (!answer) {

      return res.status(500).json({
        success: false,

        message:
          "LifeVault AI returned an empty response.",

        sources: []
      });

    }

    // ========================================================
    // VALIDATE SOURCES
    // ========================================================

    const validDocumentNames =
      new Set(
        documentData.map(
          (document) =>
            document.originalName
        )
      );

    const safeSources =
      Array.isArray(sources)
        ? sources
            .filter(
              (source) => {

                if (
                  !source ||
                  typeof source !==
                    "object"
                ) {
                  return false;
                }

                if (
                  !source.documentName
                ) {
                  return false;
                }

                return validDocumentNames.has(
                  source.documentName
                );
              }
            )
            .map(
              (source) => {

                return {
                  documentName:
                    source.documentName,

                  reason:
                    source.reason ||
                    "Relevant information was found in this document."
                };

              }
            )
        : [];

    // ========================================================
    // RESPONSE
    // ========================================================

    console.log(
      "Ask LifeVault completed successfully."
    );

    console.log(
      "Sources:",
      safeSources.length
    );

    console.log(
      "============================================================"
    );

    return res.status(200).json({

      success: true,

      answer,

      sources:
        safeSources,

      documentsUsed:
        documentData.length

    });

  } catch (error) {

    // ========================================================
    // CONTROLLER ERROR
    // ========================================================

    console.error(
      "Ask LifeVault controller error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to process your LifeVault question.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined

    });

  }
};

// ============================================================
// ASK ABOUT SINGLE DOCUMENT
// POST /api/ask/document/:id
// ============================================================

const askAboutDocument = async (
  req,
  res
) => {

  try {

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    if (!req.user) {

      return res.status(401).json({
        success: false,
        message:
          "Authentication required."
      });

    }

    // ========================================================
    // USER ID
    // ========================================================

    const userId =
      req.user._id ||
      req.user.id;

    if (!userId) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication session."
      });

    }

    // ========================================================
    // DOCUMENT ID
    // ========================================================

    const documentId =
      req.params.id;

    if (!documentId) {

      return res.status(400).json({
        success: false,
        message:
          "Document ID is required."
      });

    }

    // ========================================================
    // QUESTION
    // ========================================================

    const question =
      typeof req.body?.question ===
      "string"
        ? req.body.question.trim()
        : "";

    if (!question) {

      return res.status(400).json({
        success: false,
        message:
          "Please enter a question."
      });

    }

    if (
      question.length > 1000
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Question is too long. Please keep it under 1000 characters."
      });

    }

    // ========================================================
    // FIND DOCUMENT
    // ========================================================

    const document =
      await Document.findOne({

        _id:
          documentId,

        owner:
          userId

      });

    if (!document) {

      return res.status(404).json({
        success: false,
        message:
          "Document not found."
      });

    }

    // ========================================================
    // PREPARE DOCUMENT
    // ========================================================

    const documentData = [

      {

        _id:
          document._id,

        originalName:
          document.originalName,

        storedName:
          document.storedName,

        category:
          document.category,

        documentType:
          document.documentType,

        aiSummary:
          document.aiSummary,

        extractedText:
          document.extractedText,

        keyInformation:
          document.keyInformation,

        expiryDate:
          document.expiryDate,

        expiryDetected:
          document.expiryDetected,

        aiProcessed:
          document.aiProcessed,

        aiProcessingStatus:
          document.aiProcessingStatus,

        createdAt:
          document.createdAt

      }

    ];

    // ========================================================
    // ASK AI
    // ========================================================

    let aiResponse;

    try {

      if (
        typeof askAI ===
        "function"
      ) {

        aiResponse =
          await askAI(
            question,
            documentData
          );

      } else if (
        typeof askLifeVault ===
        "function"
      ) {

        aiResponse =
          await askLifeVault(
            question,
            documentData
          );

      } else {

        throw new Error(
          "Ask AI service function is not available."
        );

      }

    } catch (aiError) {

      console.error(
        "Single document AI error:",
        aiError.message
      );

      if (
        aiError.status === 429 ||
        aiError.status === 413 ||
        aiError.code ===
          "rate_limit_exceeded"
      ) {

        return res.status(503).json({
          success: false,

          message:
            "LifeVault AI is temporarily busy. Please try again in a moment.",

          errorType:
            "AI_RATE_LIMIT"
        });

      }

      return res.status(500).json({

        success: false,

        message:
          "LifeVault AI could not process this document.",

        errorType:
          "AI_ERROR",

        error:
          process.env.NODE_ENV ===
          "development"
            ? aiError.message
            : undefined

      });

    }

    // ========================================================
    // NORMALIZE RESPONSE
    // ========================================================

    let answer = "";

    let sources = [];

    if (
      aiResponse &&
      typeof aiResponse ===
        "object"
    ) {

      answer =
        typeof aiResponse.answer ===
        "string"
          ? aiResponse.answer.trim()
          : "";

      if (
        Array.isArray(
          aiResponse.sources
        )
      ) {

        sources =
          aiResponse.sources;

      }

    } else if (
      typeof aiResponse ===
      "string"
    ) {

      answer =
        aiResponse.trim();

    }

    // ========================================================
    // FALLBACK SOURCE
    // ========================================================

    if (
      answer &&
      sources.length === 0
    ) {

      sources = [

        {

          documentName:
            document.originalName,

          reason:
            "This is the document you asked about."

        }

      ];

    }

    // ========================================================
    // EMPTY RESPONSE
    // ========================================================

    if (!answer) {

      return res.status(500).json({

        success: false,

        message:
          "LifeVault AI returned an empty response.",

        sources: []

      });

    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      answer,

      sources,

      document: {

        id:
          document._id,

        originalName:
          document.originalName,

        category:
          document.category,

        documentType:
          document.documentType

      }

    });

  } catch (error) {

    console.error(
      "Ask about document error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to answer your question about this document.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined

    });

  }

};

// ============================================================
// EXPORT
// ============================================================

module.exports = {

  askLifeVaultController,

  askAboutDocument

};