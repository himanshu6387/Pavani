const Document =
  require("../models/Document");

const Reminder =
  require("../models/Reminder");

const {
  extractText
} = require(
  "../services/textExtractionService"
);

const {
  analyzeDocument
} = require(
  "../services/aiService"
);


// ==========================================
// ANALYZE DOCUMENT
// ==========================================

const processDocument = async (
  req,
  res
) => {

  let document = null;


  try {

    // ======================================
    // FIND DOCUMENT
    // ======================================

    document =
      await Document.findOne({
        _id: req.params.id,
        owner: req.user._id
      });


    if (!document) {

      return res.status(404).json({
        success: false,
        message: "Document not found."
      });

    }


    // ======================================
    // PROCESSING
    // ======================================

    document.aiProcessingStatus =
      "processing";

    await document.save();


    // ======================================
    // EXTRACT TEXT
    // ======================================

    const extractedText =
      await extractText(
        document.filePath,
        document.mimeType
      );


    if (
      !extractedText ||
      !extractedText.trim()
    ) {

      document.aiProcessingStatus =
        "failed";

      await document.save();


      return res.status(400).json({
        success: false,
        message:
          "No readable text was found in this document."
      });

    }


    // ======================================
    // AI ANALYSIS
    // ======================================

    const analysis =
      await analyzeDocument(
        extractedText
      );


    // ======================================
    // SAVE TEXT
    // ======================================

    document.extractedText =
      extractedText;


    // ======================================
    // DOCUMENT TYPE
    // ======================================

    document.documentType =
      analysis.documentType || "";


    // ======================================
    // CATEGORY
    // ======================================

    const allowedCategories = [
      "personal",
      "medical",
      "financial",
      "insurance",
      "education",
      "legal",
      "government",
      "work",
      "other"
    ];


    const aiCategory =
      String(
        analysis.category || "other"
      )
        .trim()
        .toLowerCase();


    document.category =
      allowedCategories.includes(
        aiCategory
      )
        ? aiCategory
        : "other";


    // ======================================
    // SUMMARY
    // ======================================

    document.aiSummary =
      analysis.summary || "";


    // ======================================
    // KEY INFORMATION
    // ======================================

    document.keyInformation =
      analysis.keyInformation || {};


    // ======================================
    // EXPIRY
    // ======================================

    document.expiryDetected =
      Boolean(
        analysis.expiryDetected
      );


    document.expiryDate = null;


    if (analysis.expiryDate) {

      const expiry =
        new Date(
          analysis.expiryDate
        );


      if (
        !Number.isNaN(
          expiry.getTime()
        )
      ) {

        document.expiryDate =
          expiry;

      } else {

        document.expiryDetected =
          false;

      }

    }


    // ======================================
    // INSIGHTS
    // ======================================

    document.aiInsights =
      Array.isArray(
        analysis.insights
      )
        ? analysis.insights
        : [];


    // ======================================
    // WARNINGS
    // ======================================

    document.aiWarnings =
      Array.isArray(
        analysis.warnings
      )
        ? analysis.warnings
        : [];


    // ======================================
    // AI COMPLETE
    // ======================================

    document.aiProcessed =
      true;

    document.aiProcessingStatus =
      "completed";


    await document.save();


    // ======================================
    // CREATE EXPIRY REMINDER
    // ======================================

    if (
      document.expiryDetected &&
      document.expiryDate
    ) {

      const expiry =
        new Date(
          document.expiryDate
        );


      const now =
        new Date();


      const thirtyDaysLater =
        new Date();


      thirtyDaysLater.setDate(
        thirtyDaysLater.getDate() + 30
      );


      // Only documents expiring
      // within next 30 days

      if (
        expiry >= now &&
        expiry <= thirtyDaysLater
      ) {

        const existingReminder =
          await Reminder.findOne({
            owner: req.user._id,
            document: document._id,
            type: "expiry"
          });


        if (!existingReminder) {

          const daysLeft =
            Math.ceil(
              (
                expiry.getTime() -
                now.getTime()
              ) /
              (
                1000 *
                60 *
                60 *
                24
              )
            );


          let message;


          if (daysLeft === 1) {

            message =
              `${document.originalName} expires tomorrow.`;

          } else {

            message =
              `${document.originalName} expires in ${daysLeft} days.`;

          }


          await Reminder.create({

            owner:
              req.user._id,

            document:
              document._id,

            title:
              "Document Expiring Soon",

            message,

            reminderDate:
              expiry,

            expiryDate:
              expiry,

            type:
              "expiry",

            status:
              "pending",

            isRead:
              false

          });

        }

      }

    }


    // ======================================
    // RESPONSE
    // ======================================

    return res.status(200).json({

      success: true,

      message:
        "Document analyzed successfully.",

      document

    });

  } catch (error) {

    console.error(
      "AI processing error:",
      error
    );


    // Mark processing failed

    if (document) {

      try {

        document.aiProcessingStatus =
          "failed";

        await document.save();

      } catch (saveError) {

        console.error(
          "Failed to update AI status:",
          saveError
        );

      }

    }


    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "AI document processing failed."

    });

  }
};


module.exports = {
  processDocument
};