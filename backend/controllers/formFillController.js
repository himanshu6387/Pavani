const mongoose = require("mongoose");

const FormFill = require("../models/FormFill");
const Document = require("../models/Document");

// ============================================================
// AI CONFIGURATION
// ============================================================

const AI_MODEL =
  process.env.GROQ_MODEL ||
  process.env.AI_MODEL ||
  "openai/gpt-oss-20b";

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const OPENROUTER_API_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const OPENAI_API_URL =
  "https://api.openai.com/v1/chat/completions";

// ============================================================
// HELPER
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ============================================================
// EXTRACT DOCUMENT TEXT
// ============================================================

const getDocumentText = (document) => {
  const possibleFields = [
    "extractedText",
    "extracted_text",
    "text",
    "content",
    "ocrText",
    "ocr_text",
    "analysisText",
    "documentText",
    "rawText",
    "raw_text",
  ];

  for (const field of possibleFields) {
    if (
      typeof document?.[field] === "string" &&
      document[field].trim()
    ) {
      return document[field].trim();
    }
  }

  // ----------------------------------------------------------
  // AI ANALYSIS FALLBACK
  // ----------------------------------------------------------

  if (document?.aiAnalysis) {
    if (typeof document.aiAnalysis === "string") {
      return document.aiAnalysis;
    }

    try {
      return JSON.stringify(document.aiAnalysis);
    } catch (error) {
      return "";
    }
  }

  // ----------------------------------------------------------
  // SUMMARY FALLBACK
  // ----------------------------------------------------------

  if (document?.aiSummary) {
    return String(document.aiSummary);
  }

  return "";
};

// ============================================================
// GET DOCUMENT NAME
// ============================================================

const getDocumentName = (document) => {
  return (
    document?.originalName ||
    document?.name ||
    document?.fileName ||
    "Untitled document"
  );
};

// ============================================================
// CLEAN AI JSON
// ============================================================

const cleanAIResponse = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("AI returned an empty response.");
  }

  let cleaned = text.trim();

  // ----------------------------------------------------------
  // REMOVE MARKDOWN CODE BLOCK
  // ----------------------------------------------------------

  cleaned = cleaned.replace(/^```json\s*/i, "");

  cleaned = cleaned.replace(/^```\s*/i, "");

  cleaned = cleaned.replace(/\s*```$/i, "");

  // ----------------------------------------------------------
  // FIND JSON OBJECT
  // ----------------------------------------------------------

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    cleaned = cleaned.substring(
      firstBrace,
      lastBrace + 1
    );
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "AI Form JSON parsing failed."
    );

    console.error(
      "Raw AI response:",
      text
    );

    throw new Error(
      "AI returned invalid JSON."
    );
  }
};

// ============================================================
// CALL AI
// GROQ FIRST
// ============================================================

const callAI = async (
  systemPrompt,
  userPrompt
) => {
  try {
    // ========================================================
    // SELECT PROVIDER
    // ========================================================

    let apiKey = null;
    let apiUrl = null;
    let model = AI_MODEL;
    let provider = null;

    // --------------------------------------------------------
    // GROQ
    // --------------------------------------------------------

    if (process.env.GROQ_API_KEY) {
      apiKey = process.env.GROQ_API_KEY;
      apiUrl = GROQ_API_URL;
      model =
        process.env.GROQ_MODEL ||
        "openai/gpt-oss-20b";
      provider = "Groq";
    }

    // --------------------------------------------------------
    // OPENROUTER FALLBACK
    // --------------------------------------------------------

    else if (process.env.OPENROUTER_API_KEY) {
      apiKey =
        process.env.OPENROUTER_API_KEY;

      apiUrl = OPENROUTER_API_URL;

      model =
        process.env.OPENROUTER_MODEL ||
        process.env.AI_MODEL ||
        "openai/gpt-4o-mini";

      provider = "OpenRouter";
    }

    // --------------------------------------------------------
    // OPENAI FALLBACK
    // --------------------------------------------------------

    else if (process.env.OPENAI_API_KEY) {
      apiKey =
        process.env.OPENAI_API_KEY;

      apiUrl = OPENAI_API_URL;

      model =
        process.env.OPENAI_MODEL ||
        "gpt-4o-mini";

      provider = "OpenAI";
    }

    // --------------------------------------------------------
    // NO API KEY
    // --------------------------------------------------------

    else {
      throw new Error(
        "AI API key is missing. Add GROQ_API_KEY, OPENROUTER_API_KEY or OPENAI_API_KEY to backend/.env."
      );
    }

    console.log(
      "============================================================"
    );

    console.log(
      "AI PROVIDER:",
      provider
    );

    console.log(
      "AI MODEL:",
      model
    );

    console.log(
      "AI URL:",
      apiUrl
    );

    console.log(
      "============================================================"
    );

    // ========================================================
    // REQUEST HEADERS
    // ========================================================

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // OpenRouter-specific optional headers
    if (provider === "OpenRouter") {
      headers["HTTP-Referer"] =
        "http://localhost:5173";

      headers["X-Title"] =
        "LifeVault AI";
    }

    // ========================================================
    // AI REQUEST
    // ========================================================

    const response = await fetch(
      apiUrl,
      {
        method: "POST",

        headers,

        body: JSON.stringify({
          model,

          temperature: 0.1,

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },

            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      }
    );

    // ========================================================
    // READ RESPONSE
    // ========================================================

    const responseText =
      await response.text();

    // ========================================================
    // API ERROR
    // ========================================================

    if (!response.ok) {
      console.error(
        "AI API error:",
        response.status,
        responseText
      );

      let providerMessage =
        responseText;

      try {
        const errorData =
          JSON.parse(responseText);

        providerMessage =
          errorData?.error?.message ||
          errorData?.message ||
          responseText;
      } catch (parseError) {
        // Keep raw response
      }

      throw new Error(
        `${provider} AI request failed (${response.status}): ${providerMessage}`
      );
    }

    // ========================================================
    // PARSE RESPONSE
    // ========================================================

    let data;

    try {
      data = JSON.parse(
        responseText
      );
    } catch (error) {
      console.error(
        "Invalid AI API response:",
        responseText
      );

      throw new Error(
        "Invalid response received from AI provider."
      );
    }

    // ========================================================
    // GET CONTENT
    // ========================================================

    const content =
      data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error(
        "AI response:",
        JSON.stringify(data, null, 2)
      );

      throw new Error(
        "AI did not return any content."
      );
    }

    console.log(
      `${provider} AI response received successfully.`
    );

    return content;
  } catch (error) {
    console.error(
      "AI CALL ERROR:",
      error
    );

    throw error;
  }
};

// ============================================================
// GENERATE FORM FIELDS
//
// POST /api/form-fill/generate
//
// Body:
//
// {
//   "formName": "Insurance Claim Form",
//   "description": "...",
//   "fields": [
//      {
//        "fieldName": "fullName",
//        "label": "Full Name",
//        "fieldType": "text",
//        "required": true
//      }
//   ],
//   "documentIds": ["..."]
// }
//
// ============================================================

const generateFormFill = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.userId;

    // ========================================================
    // AUTH CHECK
    // ========================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // ========================================================
    // REQUEST DATA
    // ========================================================

    const {
      formName,
      description = "",
      fields = [],
      documentIds = [],
    } = req.body;

    // ========================================================
    // VALIDATE FORM NAME
    // ========================================================

    if (
      !formName ||
      !String(formName).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Form name is required.",
      });
    }

    // ========================================================
    // VALIDATE FIELDS
    // ========================================================

    if (
      !Array.isArray(fields) ||
      fields.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one form field is required.",
      });
    }

    // ========================================================
    // VALIDATE DOCUMENT IDS
    // ========================================================

    const validDocumentIds =
      Array.isArray(documentIds)
        ? documentIds.filter(
            (id) =>
              isValidObjectId(id)
          )
        : [];

    // ========================================================
    // GET USER DOCUMENTS
    // ========================================================

    let documents;

    if (
      validDocumentIds.length > 0
    ) {
      documents =
        await Document.find({
          _id: {
            $in:
              validDocumentIds,
          },

          user: userId,
        }).lean();
    } else {
      /*
      ----------------------------------------------------------
      If no documents are selected, automatically use all
      documents belonging to the current user.
      ----------------------------------------------------------
      */

      documents =
        await Document.find({
          user: userId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .lean();
    }

    // ========================================================
    // BUILD DOCUMENT CONTEXT
    // ========================================================

    const documentContext =
      documents
        .map(
          (
            document,
            index
          ) => {
            const text =
              getDocumentText(
                document
              );

            return [
              `DOCUMENT ${index + 1}`,

              `Document ID: ${document._id}`,

              `Document Name: ${getDocumentName(
                document
              )}`,

              `Category: ${
                document.category ||
                "Unknown"
              }`,

              `Document Type: ${
                document.documentType ||
                "Unknown"
              }`,

              `Content:`,

              text ||
                "No extracted text available.",
            ].join("\n");
          }
        )
        .join(
          "\n\n==============================\n\n"
        );

    // ========================================================
    // FORMAT FIELD REQUEST
    // ========================================================

    const fieldContext =
      fields.map(
        (
          field,
          index
        ) => {
          return {
            index,

            fieldName:
              field.fieldName ||
              `field_${index + 1}`,

            label:
              field.label ||
              field.fieldName ||
              `Field ${index + 1}`,

            fieldType:
              field.fieldType ||
              "text",

            required:
              Boolean(
                field.required
              ),
          };
        }
      );

    // ========================================================
    // AI SYSTEM PROMPT
    // ========================================================

    const systemPrompt = `
You are LifeVault AI's Form Filling Assistant.

Your job is to identify information from a user's existing personal documents and suggest values for fields in a form.

IMPORTANT RULES:

1. Only use information that actually appears in the provided documents.
2. Never invent personal information.
3. Never guess a value when the documents do not support it.
4. If information cannot be found, return an empty suggestedValue.
5. Always mention which document supports the value.
6. Return a confidence score from 0 to 100.
7. Preserve names, dates, IDs, addresses and other values exactly when possible.
8. Do not provide medical, legal or financial advice.
9. You are extracting information, not making decisions.
10. Return ONLY valid JSON.
11. Do not use markdown.
12. Do not put explanations outside the JSON object.

Return this exact structure:

{
  "fields": [
    {
      "fieldName": "string",
      "suggestedValue": "string",
      "sourceDocumentId": "string or null",
      "sourceDocumentName": "string",
      "sourceText": "short supporting text",
      "confidence": 0
    }
  ]
}
`;

    // ========================================================
    // AI USER PROMPT
    // ========================================================

    const userPrompt = `
FORM NAME:
${formName}

FORM DESCRIPTION:
${
  description ||
  "No description provided."
}

FIELDS TO FILL:

${JSON.stringify(
  fieldContext,
  null,
  2
)}

USER DOCUMENTS:

${
  documentContext ||
  "No documents are available."
}

Find the best supported value for every requested field.

If a value is not available, use:

""
for suggestedValue,

null
for sourceDocumentId,

""
for sourceDocumentName,

""
for sourceText,

0
for confidence.

Return JSON only.
`;

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "============================================================"
    );

    console.log(
      "AI Form Filling request received."
    );

    console.log(
      "User:",
      userId
    );

    console.log(
      "Form:",
      formName
    );

    console.log(
      "Documents available:",
      documents.length
    );

    console.log(
      "Fields:",
      fields.length
    );

    console.log(
      "Starting AI Form Filling..."
    );

    // ========================================================
    // CALL AI
    // ========================================================

    const aiResponse =
      await callAI(
        systemPrompt,
        userPrompt
      );

    // ========================================================
    // PARSE AI
    // ========================================================

    const parsed =
      cleanAIResponse(
        aiResponse
      );

    if (
      !Array.isArray(
        parsed.fields
      )
    ) {
      throw new Error(
        "AI returned an invalid fields structure."
      );
    }

    // ========================================================
    // MAP RESULTS
    // ========================================================

    const generatedFields =
      fieldContext.map(
        (
          requestedField
        ) => {
          const result =
            parsed.fields.find(
              (item) =>
                String(
                  item.fieldName
                ).toLowerCase() ===
                String(
                  requestedField.fieldName
                ).toLowerCase()
            );

          const sourceDocument =
            result?.sourceDocumentId &&
            documents.find(
              (document) =>
                String(
                  document._id
                ) ===
                String(
                  result.sourceDocumentId
                )
            );

          return {
            fieldName:
              requestedField.fieldName,

            label:
              requestedField.label,

            fieldType:
              requestedField.fieldType,

            required:
              requestedField.required,

            suggestedValue:
              result?.suggestedValue ||
              "",

            finalValue:
              result?.suggestedValue ||
              "",

            sourceDocument:
              sourceDocument?._id ||
              (
                result?.sourceDocumentId &&
                isValidObjectId(
                  result.sourceDocumentId
                )
                  ? result.sourceDocumentId
                  : null
              ),

            sourceText:
              result?.sourceText ||
              "",

            confidence:
              Math.max(
                0,
                Math.min(
                  100,
                  Number(
                    result?.confidence ||
                      0
                  )
                )
              ),

            verified:
              false,
          };
        }
      );

    // ========================================================
    // COMPLETION
    // ========================================================

    const filledCount =
      generatedFields.filter(
        (field) =>
          field.suggestedValue &&
          String(
            field.suggestedValue
          ).trim()
      ).length;

    const completionPercentage =
      generatedFields.length > 0
        ? Math.round(
            (
              filledCount /
              generatedFields.length
            ) *
              100
          )
        : 0;

    // ========================================================
    // SAVE FORM
    // ========================================================

    const formFill =
      await FormFill.create({
        user: userId,

        formName:
          String(
            formName
          ).trim(),

        description:
          String(
            description
          ).trim(),

        sourceDocuments:
          documents.map(
            (document) =>
              document._id
          ),

        fields:
          generatedFields,

        status:
          "ready",

        aiProcessed:
          true,

        completionPercentage,
      });

    // ========================================================
    // RESPONSE
    // ========================================================

    console.log(
      "AI Form Filling completed successfully."
    );

    console.log(
      "Filled fields:",
      filledCount,
      "/",
      generatedFields.length
    );

    console.log(
      "============================================================"
    );

    return res.status(201).json({
      success: true,

      message:
        "AI form suggestions generated successfully.",

      form: formFill,
    });
  } catch (error) {
    console.error(
      "AI Form Filling error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to generate AI form suggestions.",
    });
  }
};

// ============================================================
// GET FORM
//
// GET /api/form-fill/:id
// ============================================================

const getFormFill = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.userId;

    const { id } =
      req.params;

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid form ID.",
      });
    }

    const formFill =
      await FormFill.findOne({
        _id: id,
        user: userId,
      })
        .populate(
          "sourceDocuments",
          "originalName category documentType"
        )
        .populate(
          "fields.sourceDocument",
          "originalName category documentType"
        );

    if (!formFill) {
      return res.status(404).json({
        success: false,
        message:
          "Form fill record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      form: formFill,
    });
  } catch (error) {
    console.error(
      "Get form fill error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load form.",
    });
  }
};

// ============================================================
// GET ALL FORMS
//
// GET /api/form-fill
// ============================================================

const getFormFills = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.userId;

    const forms =
      await FormFill.find({
        user: userId,
      })
        .sort({
          createdAt: -1,
        })
        .populate(
          "sourceDocuments",
          "originalName category documentType"
        );

    return res.status(200).json({
      success: true,

      count:
        forms.length,

      forms,
    });
  } catch (error) {
    console.error(
      "Get form fills error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load form filling records.",
    });
  }
};

// ============================================================
// UPDATE FIELD
//
// PATCH /api/form-fill/:id/field/:fieldId
// ============================================================

const updateFormField = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.userId;

    const {
      id,
      fieldId,
    } = req.params;

    const {
      finalValue,
      verified,
    } = req.body;

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid form ID.",
      });
    }

    const formFill =
      await FormFill.findOne({
        _id: id,
        user: userId,
      });

    if (!formFill) {
      return res.status(404).json({
        success: false,
        message:
          "Form fill record not found.",
      });
    }

    const field =
      formFill.fields.id(
        fieldId
      );

    if (!field) {
      return res.status(404).json({
        success: false,
        message:
          "Form field not found.",
      });
    }

    // ========================================================
    // UPDATE FINAL VALUE
    // ========================================================

    if (
      finalValue !== undefined
    ) {
      field.finalValue =
        String(
          finalValue
        );
    }

    // ========================================================
    // UPDATE VERIFIED
    // ========================================================

    if (
      verified !== undefined
    ) {
      field.verified =
        Boolean(
          verified
        );
    }

    // ========================================================
    // RECALCULATE COMPLETION
    // ========================================================

    const completedFields =
      formFill.fields.filter(
        (item) =>
          item.finalValue &&
          String(
            item.finalValue
          ).trim()
      ).length;

    formFill.completionPercentage =
      formFill.fields.length > 0
        ? Math.round(
            (
              completedFields /
              formFill.fields.length
            ) *
              100
          )
        : 0;

    if (
      formFill.completionPercentage ===
      100
    ) {
      formFill.status =
        "completed";
    } else {
      formFill.status =
        "ready";
    }

    await formFill.save();

    return res.status(200).json({
      success: true,

      message:
        "Form field updated successfully.",

      form: formFill,
    });
  } catch (error) {
    console.error(
      "Update form field error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update form field.",
    });
  }
};

// ============================================================
// DELETE FORM
//
// DELETE /api/form-fill/:id
// ============================================================

const deleteFormFill = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.userId;

    const { id } =
      req.params;

    if (
      !isValidObjectId(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid form ID.",
      });
    }

    const deleted =
      await FormFill.findOneAndDelete({
        _id: id,
        user: userId,
      });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message:
          "Form fill record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Form fill record deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete form fill error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete form fill record.",
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  generateFormFill,
  getFormFill,
  getFormFills,
  updateFormField,
  deleteFormFill,
};