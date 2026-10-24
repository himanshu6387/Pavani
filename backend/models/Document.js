const mongoose = require("mongoose");


// ============================================================
// DOCUMENT SCHEMA
// ============================================================

const documentSchema =
  new mongoose.Schema(

    {

      // ======================================================
      // OWNER
      // ======================================================

      owner: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

        index:
          true,

      },


      // ======================================================
      // FILE INFORMATION
      // ======================================================

      originalName: {

        type:
          String,

        required:
          true,

        trim:
          true,

      },


      storedName: {

        type:
          String,

        required:
          true,

        unique:
          true,

      },


      filePath: {

        type:
          String,

        required:
          true,

      },


      mimeType: {

        type:
          String,

        required:
          true,

      },


      size: {

        type:
          Number,

        required:
          true,

      },


      // ======================================================
      // CATEGORY
      // ======================================================

      category: {

        type:
          String,

        enum: [

          "Other",

          "Identity",

          "Medical",

          "Financial",

          "Insurance",

          "Education",

          "Legal",

          "Property",

          "Employment",

        ],

        default:
          "Other",

      },


      // ======================================================
      // DESCRIPTION
      // ======================================================

      description: {

        type:
          String,

        default:
          "",

      },


      // ======================================================
      // AI PROCESSING
      // ======================================================

      aiProcessed: {

        type:
          Boolean,

        default:
          false,

      },


      aiProcessingStatus: {

        type:
          String,

        enum: [

          "pending",

          "processing",

          "completed",

          "failed",

        ],

        default:
          "pending",

      },


      // ======================================================
      // EXTRACTED TEXT
      // ======================================================

      extractedText: {

        type:
          String,

        default:
          "",

      },


      // ======================================================
      // DOCUMENT TYPE
      // ======================================================

      documentType: {

        type:
          String,

        default:
          "",

      },


      // ======================================================
      // AI SUMMARY
      // ======================================================

      aiSummary: {

        type:
          String,

        default:
          "",

      },


      // ======================================================
      // IMPORTANT INFORMATION
      // ======================================================

      keyInformation: {

        type:
          mongoose.Schema.Types.Mixed,

        default:
          [],

      },


      // ======================================================
      // EXPIRY
      // ======================================================

      expiryDate: {

        type:
          Date,

        default:
          null,

      },


      expiryDetected: {

        type:
          Boolean,

        default:
          false,

      },


      // ======================================================
      // AI INSIGHTS
      // ======================================================

      aiInsights: {

        type:
          [String],

        default:
          [],

      },


      // ======================================================
      // AI WARNINGS
      // ======================================================

      aiWarnings: {

        type:
          [String],

        default:
          [],

      },


      // ======================================================
      // ACTION ITEMS
      // ======================================================

      actionItems: {

        type:
          [String],

        default:
          [],

      },


      // ======================================================
      // AI RISK
      // ======================================================

      riskLevel: {

        type:
          String,

        enum: [

          "Low",

          "Medium",

          "High",

          "Unknown",

        ],

        default:
          "Unknown",

      },


      riskScore: {

        type:
          Number,

        min:
          0,

        max:
          100,

        default:
          null,

      },


      // ======================================================
      // AI CONFIDENCE
      // ======================================================

      aiConfidence: {

        type:
          Number,

        min:
          0,

        max:
          100,

        default:
          null,

      },

    },


    // ========================================================
    // TIMESTAMPS
    // ========================================================

    {

      timestamps:
        true,

    }

  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.model(
    "Document",
    documentSchema
  );