const mongoose = require("mongoose");
const Groq = require("groq-sdk");

const Document = require("../models/Document");
const Action = require("../models/Action");


// ============================================================
// GROQ CLIENT
// ============================================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


// ============================================================
// HELPER
// ============================================================

const normalizeDate = (value) => {

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};


// ============================================================
// EXTRACT AI ACTIONS FROM DOCUMENT
//
// POST /api/actions/extract/:documentId
// ============================================================

const extractActionsFromDocument = async (
  req,
  res
) => {

  try {

    console.log(
      "============================================================"
    );

    console.log(
      "AI ACTION EXTRACTION REQUEST"
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
    // DOCUMENT ID
    // ==========================================================

    const documentId =
      typeof req.params.documentId === "string"
        ? req.params.documentId.trim()
        : "";


    if (!documentId) {

      return res.status(400).json({

        success: false,

        message:
          "Document ID is required."

      });

    }


    // ==========================================================
    // VALIDATE OBJECT ID
    // ==========================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        documentId
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid document ID."

      });

    }


    // ==========================================================
    // FIND DOCUMENT
    //
    // owner check is mandatory.
    // ==========================================================

    const document =
      await Document.findOne({

        _id: documentId,

        owner: userId

      });


    if (!document) {

      return res.status(404).json({

        success: false,

        message:
          "Document not found."

      });

    }


    console.log(
      "Document:",
      document.originalName
    );


    // ==========================================================
    // EXTRACTED TEXT
    // ==========================================================

    const extractedText =
      (
        document.extractedText ||
        ""
      ).trim();


    if (!extractedText) {

      return res.status(400).json({

        success: false,

        message:
          "This document does not have extracted text. Please analyze the document first."

      });

    }


    // ==========================================================
    // LIMIT TEXT
    //
    // Prevent huge AI requests.
    // ==========================================================

    const MAX_CHARS =
      12000;


    const safeText =
      extractedText.slice(
        0,
        MAX_CHARS
      );


    console.log(
      "Action extraction input characters:",
      safeText.length
    );


    // ==========================================================
    // AI PROMPT
    // ==========================================================

    const prompt = `

You are LifeVault AI's Action Extraction Engine.

Your job is to read a personal document and identify
real actions that the document requires the user to take.

Examples of useful actions:

- Renew an insurance policy
- Pay a bill
- Submit a form
- Complete KYC
- Attend an appointment
- Get a medical test
- Take a required follow-up
- Contact an organization
- Provide a missing document
- Review a contract before expiry
- File or submit a tax document

Do NOT create actions simply because something is mentioned.

Only create an action when the document indicates that
the user needs to do something.

Do NOT invent deadlines.

If a deadline is not explicitly available,
use null.

Return ONLY valid JSON.

Required format:

{
  "actions": [
    {
      "title": "",
      "description": "",
      "reason": "",
      "priority": "low | medium | high | critical",
      "dueDate": null,
      "confidence": 0,
      "evidence": ""
    }
  ]
}

Rules:

1. Extract only genuine user actions.
2. Do not invent actions.
3. Do not invent dates.
4. dueDate must be null if no reliable date exists.
5. confidence must be a number from 0 to 100.
6. evidence must be a short quote or factual reference from the document.
7. Keep titles short and actionable.
8. description should explain what the user should do.
9. reason should explain why the action is needed.
10. priority must reflect urgency.
11. If the document contains no actionable task, return:
{
  "actions": []
}
12. Return JSON only.
13. No markdown.
14. No code fences.

DOCUMENT NAME:

${document.originalName}

DOCUMENT CATEGORY:

${document.category || "Other"}

DOCUMENT TYPE:

${document.documentType || "Unknown"}

AI SUMMARY:

${document.aiSummary || "Not available"}

EXPIRY DATE:

${
  document.expiryDate
    ? document.expiryDate.toISOString()
    : "Not available"
}

DOCUMENT TEXT:

${safeText}

`;


    // ==========================================================
    // MODEL
    // ==========================================================

    const model =
      process.env.GROQ_ANALYSIS_MODEL ||
      "openai/gpt-oss-20b";


    console.log(
      "Action extraction model:",
      model
    );


    // ==========================================================
    // AI REQUEST
    // ==========================================================

    const response =
      await groq.chat.completions.create({

        model,

        messages: [

          {
            role: "system",

            content:
              "You extract only real actionable tasks from documents. Return valid JSON only."
          },

          {
            role: "user",

            content: prompt
          }

        ],

        temperature: 0,

        max_tokens: 1800

      });


    // ==========================================================
    // GET RESPONSE
    // ==========================================================

    const rawContent =
      response
        ?.choices?.[0]
        ?.message?.content ||
      "";


    console.log(
      "AI action extraction response received."
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

    let aiResult;


    try {

      aiResult =
        JSON.parse(
          cleanedContent
        );

    } catch (error) {

      console.error(
        "Action extraction JSON parsing failed."
      );

      console.error(
        "Raw AI response:",
        rawContent
      );


      return res.status(502).json({

        success: false,

        message:
          "AI returned an invalid action extraction response."

      });

    }


    // ==========================================================
    // GET ACTION ARRAY
    // ==========================================================

    const aiActions =
      Array.isArray(
        aiResult.actions
      )
        ? aiResult.actions
        : [];


    console.log(
      "AI actions detected:",
      aiActions.length
    );


    // ==========================================================
    // REMOVE INVALID ACTIONS
    // ==========================================================

    const validActions =
      aiActions.filter(
        (action) => {

          return (
            action &&
            typeof action === "object" &&
            typeof action.title === "string" &&
            action.title.trim()
          );

        }
      );


    // ==========================================================
    // SAVE ACTIONS
    // ==========================================================

    const savedActions = [];


    for (
      const action
      of validActions
    ) {

      // --------------------------------------------------------
      // NORMALIZE TITLE
      // --------------------------------------------------------

      const title =
        action.title
          .trim()
          .slice(
            0,
            200
          );


      // --------------------------------------------------------
      // NORMALIZE DESCRIPTION
      // --------------------------------------------------------

      const description =
        typeof action.description === "string"
          ? action.description
              .trim()
              .slice(
                0,
                1000
              )
          : "";


      // --------------------------------------------------------
      // NORMALIZE REASON
      // --------------------------------------------------------

      const reason =
        typeof action.reason === "string"
          ? action.reason
              .trim()
              .slice(
                0,
                1000
              )
          : "";


      // --------------------------------------------------------
      // PRIORITY
      // --------------------------------------------------------

      const allowedPriorities = [
        "low",
        "medium",
        "high",
        "critical"
      ];


      const priority =
        allowedPriorities.includes(
          action.priority
        )
          ? action.priority
          : "medium";


      // --------------------------------------------------------
      // DUE DATE
      // --------------------------------------------------------

      const dueDate =
        normalizeDate(
          action.dueDate
        );


      // --------------------------------------------------------
      // CONFIDENCE
      // --------------------------------------------------------

      let confidence =
        Number(
          action.confidence
        );


      if (
        Number.isNaN(
          confidence
        )
      ) {

        confidence = 80;

      }


      confidence =
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              confidence
            )
          )
        );


      // --------------------------------------------------------
      // EVIDENCE
      // --------------------------------------------------------

      const evidence =
        typeof action.evidence === "string"
          ? action.evidence
              .trim()
              .slice(
                0,
                1000
              )
          : "";


      // ========================================================
      // DUPLICATE CHECK
      //
      // Do NOT create the same pending action again.
      // ========================================================

      const existingAction =
        await Action.findOne({

          owner: userId,

          document: document._id,

          status: "pending",

          title: {
            $regex:
              `^${escapeRegex(title)}$`,
            $options: "i"
          }

        });


      if (existingAction) {

        console.log(
          "Skipping duplicate action:",
          title
        );


        savedActions.push(
          existingAction
        );

        continue;

      }


      // ========================================================
      // CREATE ACTION
      // ========================================================

      const newAction =
        await Action.create({

          owner: userId,

          document:
            document._id,

          title,

          description,

          reason,

          priority,

          status:
            "pending",

          dueDate,

          confidence,

          evidence,

          documentName:
            document.originalName || ""

        });


      savedActions.push(
        newAction
      );

    }


    // ==========================================================
    // RESPONSE
    // ==========================================================

    console.log(
      "Actions saved:",
      savedActions.length
    );


    return res.status(200).json({

      success: true,

      message:
        savedActions.length > 0
          ? "AI actions extracted successfully."
          : "No actionable tasks were found in this document.",

      document: {

        id:
          document._id,

        name:
          document.originalName,

        category:
          document.category,

        documentType:
          document.documentType

      },

      count:
        savedActions.length,

      actions:
        savedActions

    });

  } catch (error) {

    // ==========================================================
    // ERROR
    // ==========================================================

    console.error(
      "Action extraction error:",
      error
    );


    // ==========================================================
    // GROQ LARGE REQUEST / RATE LIMIT
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
          "The document is too large for AI action extraction. Please analyze a smaller document or reduce the document text."

      });

    }


    // ==========================================================
    // DEFAULT
    // ==========================================================

    return res.status(500).json({

      success: false,

      message:
        "Unable to extract actions from the document.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined

    });

  }

};


// ============================================================
// GET USER ACTIONS
//
// GET /api/actions
// ============================================================

const getActions = async (
  req,
  res
) => {

  try {

    // ==========================================================
    // AUTH
    // ==========================================================

    if (!req.user) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required."

      });

    }


    // ==========================================================
    // USER
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
    // STATUS FILTER
    // ==========================================================

    const status =
      typeof req.query.status === "string"
        ? req.query.status.trim()
        : "";


    const query = {

      owner: userId

    };


    const allowedStatuses = [
      "pending",
      "completed",
      "dismissed"
    ];


    if (
      status &&
      allowedStatuses.includes(
        status
      )
    ) {

      query.status =
        status;

    }


    // ==========================================================
    // FETCH
    // ==========================================================

    const actions =
      await Action
        .find(query)
        .populate(
          "document",
          "originalName category documentType"
        )
        .sort({

          status: 1,

          dueDate: 1,

          createdAt: -1

        });


    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.status(200).json({

      success: true,

      count:
        actions.length,

      actions

    });

  } catch (error) {

    console.error(
      "Get actions error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch actions.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined

    });

  }

};


// ============================================================
// UPDATE ACTION STATUS
//
// PATCH /api/actions/:id/status
//
// Body:
//
// {
//   "status": "completed"
// }
//
// ============================================================

const updateActionStatus = async (
  req,
  res
) => {

  try {

    // ==========================================================
    // AUTH
    // ==========================================================

    if (!req.user) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required."

      });

    }


    // ==========================================================
    // USER
    // ==========================================================

    const userId =
      req.user?._id ||
      req.user?.id;


    // ==========================================================
    // ACTION ID
    // ==========================================================

    const actionId =
      typeof req.params.id === "string"
        ? req.params.id.trim()
        : "";


    if (
      !mongoose.Types.ObjectId.isValid(
        actionId
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid action ID."

      });

    }


    // ==========================================================
    // STATUS
    // ==========================================================

    const status =
      typeof req.body?.status === "string"
        ? req.body.status.trim()
        : "";


    const allowedStatuses = [
      "pending",
      "completed",
      "dismissed"
    ];


    if (
      !allowedStatuses.includes(
        status
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid action status."

      });

    }


    // ==========================================================
    // FIND ACTION
    //
    // owner check prevents cross-user access.
    // ==========================================================

    const action =
      await Action.findOne({

        _id:
          actionId,

        owner:
          userId

      });


    if (!action) {

      return res.status(404).json({

        success: false,

        message:
          "Action not found."

      });

    }


    // ==========================================================
    // UPDATE
    // ==========================================================

    action.status =
      status;


    if (
      status === "completed"
    ) {

      action.completedAt =
        new Date();

    } else {

      action.completedAt =
        null;

    }


    await action.save();


    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.status(200).json({

      success: true,

      message:
        "Action status updated successfully.",

      action

    });

  } catch (error) {

    console.error(
      "Update action status error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to update action.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined

    });

  }

};


// ============================================================
// DELETE ACTION
//
// DELETE /api/actions/:id
// ============================================================

const deleteAction = async (
  req,
  res
) => {

  try {

    // ==========================================================
    // AUTH
    // ==========================================================

    if (!req.user) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required."

      });

    }


    // ==========================================================
    // USER
    // ==========================================================

    const userId =
      req.user?._id ||
      req.user?.id;


    // ==========================================================
    // ACTION ID
    // ==========================================================

    const actionId =
      typeof req.params.id === "string"
        ? req.params.id.trim()
        : "";


    if (
      !mongoose.Types.ObjectId.isValid(
        actionId
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid action ID."

      });

    }


    // ==========================================================
    // DELETE
    // ==========================================================

    const action =
      await Action.findOneAndDelete({

        _id:
          actionId,

        owner:
          userId

      });


    if (!action) {

      return res.status(404).json({

        success: false,

        message:
          "Action not found."

      });

    }


    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.status(200).json({

      success: true,

      message:
        "Action deleted successfully."

    });

  } catch (error) {

    console.error(
      "Delete action error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to delete action.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined

    });

  }

};


// ============================================================
// ESCAPE REGEX
// ============================================================

function escapeRegex(value) {

  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  extractActionsFromDocument,

  getActions,

  updateActionStatus,

  deleteAction

};