const mongoose = require("mongoose");
const Groq = require("groq-sdk");

const Document = require("../models/Document");


// ============================================================
// GROQ CLIENT
// ============================================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


// ============================================================
// COMPARE DOCUMENTS
//
// POST /api/documents/compare
//
// Body:
//
// {
//   "documentId1": "...",
//   "documentId2": "..."
// }
//
// ============================================================

const compareDocuments = async (req, res) => {

  try {

    console.log(
      "============================================================"
    );

    console.log(
      "AI DOCUMENT COMPARISON REQUEST"
    );


    // ==========================================================
    // AUTH CHECK
    // ==========================================================

    if (!req.user) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required."

      });

    }


    // ==========================================================
    // USER ID
    // ==========================================================

    const userId =
      req.user?._id ||
      req.user?.id;


    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid authenticated user."

      });

    }


    // ==========================================================
    // GET DOCUMENT IDS
    // ==========================================================

    const documentId1 =
      typeof req.body?.documentId1 === "string"
        ? req.body.documentId1.trim()
        : "";


    const documentId2 =
      typeof req.body?.documentId2 === "string"
        ? req.body.documentId2.trim()
        : "";


    console.log(
      "Document 1:",
      documentId1
    );

    console.log(
      "Document 2:",
      documentId2
    );


    // ==========================================================
    // VALIDATE IDS
    // ==========================================================

    if (!documentId1 || !documentId2) {

      return res.status(400).json({

        success: false,

        message:
          "Please select two documents to compare."

      });

    }


    if (documentId1 === documentId2) {

      return res.status(400).json({

        success: false,

        message:
          "Please select two different documents."

      });

    }


    if (
      !mongoose.Types.ObjectId.isValid(
        documentId1
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid first document ID."

      });

    }


    if (
      !mongoose.Types.ObjectId.isValid(
        documentId2
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid second document ID."

      });

    }


    // ==========================================================
    // FETCH DOCUMENTS
    //
    // IMPORTANT:
    //
    // owner is included so one user can NEVER compare
    // another user's private document.
    //
    // ==========================================================

    const documents =
      await Document.find({

        _id: {
          $in: [
            documentId1,
            documentId2
          ]
        },

        owner: userId

      });


    // ==========================================================
    // CHECK DOCUMENTS
    // ==========================================================

    if (documents.length !== 2) {

      return res.status(404).json({

        success: false,

        message:
          "One or both documents could not be found."

      });

    }


    // ==========================================================
    // FIND DOCUMENT 1
    // ==========================================================

    const document1 =
      documents.find(
        (document) =>
          document._id.toString() ===
          documentId1
      );


    // ==========================================================
    // FIND DOCUMENT 2
    // ==========================================================

    const document2 =
      documents.find(
        (document) =>
          document._id.toString() ===
          documentId2
      );


    if (!document1 || !document2) {

      return res.status(404).json({

        success: false,

        message:
          "Unable to load both documents."

      });

    }


    // ==========================================================
    // GET EXTRACTED TEXT
    // ==========================================================

    const text1 =
      (
        document1.extractedText ||
        ""
      ).trim();


    const text2 =
      (
        document2.extractedText ||
        ""
      ).trim();


    // ==========================================================
    // TEXT CHECK
    // ==========================================================

    if (!text1) {

      return res.status(400).json({

        success: false,

        message:
          `"${document1.originalName}" does not contain extracted text yet. Please analyze the document first.`

      });

    }


    if (!text2) {

      return res.status(400).json({

        success: false,

        message:
          `"${document2.originalName}" does not contain extracted text yet. Please analyze the document first.`

      });

    }


    // ==========================================================
    // LIMIT INPUT SIZE
    //
    // Prevent huge documents from exceeding Groq TPM limits.
    //
    // We intentionally keep both documents reasonably bounded.
    //
    // ==========================================================

    const MAX_CHARS_PER_DOCUMENT = 12000;


    const safeText1 =
      text1.slice(
        0,
        MAX_CHARS_PER_DOCUMENT
      );


    const safeText2 =
      text2.slice(
        0,
        MAX_CHARS_PER_DOCUMENT
      );


    console.log(
      "Document 1 characters:",
      safeText1.length
    );


    console.log(
      "Document 2 characters:",
      safeText2.length
    );


    // ==========================================================
    // AI PROMPT
    // ==========================================================

    const prompt = `

You are LifeVault AI, a secure personal document comparison assistant.

The user has selected two documents and wants a meaningful comparison.

Compare the documents carefully.

Do NOT invent information.

Only use information present in the supplied documents.

Return ONLY valid JSON.

Required JSON format:

{
  "summary": "",
  "overallChange": "major | moderate | minor | none",
  "keyDifferences": [
    {
      "field": "",
      "document1": "",
      "document2": "",
      "importance": "high | medium | low"
    }
  ],
  "commonInformation": [],
  "newInformation": [],
  "removedInformation": [],
  "recommendations": []
}

Rules:

1. Identify important differences between the documents.
2. Compare dates, amounts, names, categories, policy details, terms, diagnoses, coverage, expiry dates, IDs, or other relevant information when available.
3. Do not invent missing values.
4. If information exists only in one document, mention it under newInformation or removedInformation.
5. If two values are identical, do not list them as differences.
6. Use "Not mentioned" when a value is genuinely unavailable.
7. importance must be high, medium, or low.
8. Keep each difference concise.
9. recommendations should be practical and based ONLY on the documents.
10. Return JSON only.
11. Do not use markdown.
12. Do not wrap JSON inside code fences.

DOCUMENT 1:

Name:
${document1.originalName}

Category:
${document1.category || "Other"}

Document Type:
${document1.documentType || "Unknown"}

Expiry Date:
${
  document1.expiryDate
    ? document1.expiryDate.toISOString()
    : "Not mentioned"
}

AI Summary:
${document1.aiSummary || "Not available"}

Extracted Text:
${safeText1}


DOCUMENT 2:

Name:
${document2.originalName}

Category:
${document2.category || "Other"}

Document Type:
${document2.documentType || "Unknown"}

Expiry Date:
${
  document2.expiryDate
    ? document2.expiryDate.toISOString()
    : "Not mentioned"
}

AI Summary:
${document2.aiSummary || "Not available"}

Extracted Text:
${safeText2}

`;


    // ==========================================================
    // START AI
    // ==========================================================

    console.log(
      "Starting AI document comparison..."
    );


    const model =
      process.env.GROQ_ANALYSIS_MODEL ||
      "openai/gpt-oss-20b";


    console.log(
      "AI model:",
      model
    );


    // ==========================================================
    // GROQ REQUEST
    // ==========================================================

    const response =
      await groq.chat.completions.create({

        model: model,

        messages: [

          {
            role: "system",

            content:
              "You are a precise document comparison engine. Return only valid JSON."
          },

          {
            role: "user",

            content: prompt
          }

        ],

        temperature: 0,

        max_tokens: 2500

      });


    // ==========================================================
    // GET AI RESPONSE
    // ==========================================================

    const rawContent =
      response
        ?.choices?.[0]
        ?.message?.content ||
      "";


    console.log(
      "AI comparison response received."
    );


    // ==========================================================
    // CLEAN RESPONSE
    // ==========================================================

    const cleanedContent =
      rawContent
        .replace(
          /```json/gi,
          ""
        )
        .replace(
          /```/g,
          ""
        )
        .trim();


    // ==========================================================
    // PARSE JSON
    // ==========================================================

    let comparison;


    try {

      comparison =
        JSON.parse(
          cleanedContent
        );

    } catch (parseError) {

      console.error(
        "AI comparison JSON parsing failed."
      );

      console.error(
        "Raw AI response:",
        rawContent
      );


      return res.status(502).json({

        success: false,

        message:
          "AI returned an invalid comparison response.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? parseError.message
            : undefined

      });

    }


    // ==========================================================
    // NORMALIZE RESPONSE
    // ==========================================================

    const normalizedComparison = {

      summary:
        typeof comparison.summary === "string"
          ? comparison.summary
          : "No comparison summary available.",


      overallChange:
        [
          "major",
          "moderate",
          "minor",
          "none"
        ].includes(
          comparison.overallChange
        )
          ? comparison.overallChange
          : "moderate",


      keyDifferences:
        Array.isArray(
          comparison.keyDifferences
        )
          ? comparison.keyDifferences
          : [],


      commonInformation:
        Array.isArray(
          comparison.commonInformation
        )
          ? comparison.commonInformation
          : [],


      newInformation:
        Array.isArray(
          comparison.newInformation
        )
          ? comparison.newInformation
          : [],


      removedInformation:
        Array.isArray(
          comparison.removedInformation
        )
          ? comparison.removedInformation
          : [],


      recommendations:
        Array.isArray(
          comparison.recommendations
        )
          ? comparison.recommendations
          : []

    };


    // ==========================================================
    // RESPONSE
    // ==========================================================

    console.log(
      "AI document comparison completed successfully."
    );


    return res.status(200).json({

      success: true,

      message:
        "Documents compared successfully.",

      documents: {

        document1: {

          id:
            document1._id,

          name:
            document1.originalName,

          category:
            document1.category,

          documentType:
            document1.documentType,

          expiryDate:
            document1.expiryDate

        },


        document2: {

          id:
            document2._id,

          name:
            document2.originalName,

          category:
            document2.category,

          documentType:
            document2.documentType,

          expiryDate:
            document2.expiryDate

        }

      },

      comparison:
        normalizedComparison

    });

  } catch (error) {

    // ==========================================================
    // LOG ERROR
    // ==========================================================

    console.error(
      "AI document comparison error:",
      error
    );


    // ==========================================================
    // GROQ RATE LIMIT / LARGE REQUEST
    // ==========================================================

    if (
      error?.status === 413 ||
      error?.statusCode === 413 ||
      error?.code ===
        "rate_limit_exceeded"
    ) {

      return res.status(413).json({

        success: false,

        message:
          "The selected documents are too large for the AI comparison request. Please use smaller documents or analyze them separately first."

      });

    }


    // ==========================================================
    // DEFAULT ERROR
    // ==========================================================

    return res.status(500).json({

      success: false,

      message:
        "Unable to compare documents.",

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

  compareDocuments

};