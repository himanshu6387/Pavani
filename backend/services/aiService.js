const Groq = require("groq-sdk");


// ============================================================
// GROQ CLIENT
// ============================================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


// ============================================================
// MODEL
// ============================================================

const MODEL =
  process.env.GROQ_ANALYSIS_MODEL ||
  "openai/gpt-oss-20b";


// ============================================================
// LIMITS
// ============================================================
//
// Long PDFs can easily exceed Groq TPM limits.
//
// Keep the input reasonably sized.
// 12000 characters is roughly a few thousand tokens
// depending on the document.
//
// This leaves room for the AI response.
// ============================================================

const MAX_INPUT_CHARACTERS = 12000;

const MAX_OUTPUT_TOKENS = 3000;


// ============================================================
// CLEAN AI RESPONSE
// ============================================================

const cleanAIResponse = (content) => {

  if (!content) {
    return "";
  }


  let cleaned =
    String(content)
      .trim();


  // Remove markdown code fences

  cleaned =
    cleaned
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();


  // Sometimes model returns text before JSON.
  // Try to locate the first JSON object.

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");


  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {

    cleaned =
      cleaned.substring(
        firstBrace,
        lastBrace + 1
      );

  }


  return cleaned.trim();

};


// ============================================================
// FALLBACK RESULT
// ============================================================

const createFallbackResult = () => {

  return {

    summary:
      "The document was uploaded and text was extracted, but AI analysis could not be completed.",

    documentType:
      "Other",

    importantInformation:
      [],

    expiryDate:
      null

  };

};


// ============================================================
// ANALYZE DOCUMENT
// ============================================================

const analyzeDocument = async (
  text
) => {

  // ==========================================================
  // EMPTY TEXT
  // ==========================================================

  if (
    !text ||
    !text.trim()
  ) {

    return {

      summary:
        "No readable text was found.",

      documentType:
        "Other",

      importantInformation:
        [],

      expiryDate:
        null

    };

  }


  // ==========================================================
  // LIMIT INPUT
  // ==========================================================

  const cleanText =
    text
      .trim();


  const documentText =
    cleanText.length >
    MAX_INPUT_CHARACTERS

      ? cleanText.substring(
          0,
          MAX_INPUT_CHARACTERS
        )

      : cleanText;


  // ==========================================================
  // PROMPT
  // ==========================================================

  const prompt = `
You are LifeVault AI, a precise document understanding assistant.

Analyze the document text below.

Return ONLY valid JSON.

Use exactly this structure:

{
  "summary": "short concise summary",
  "documentType": "Identity | Medical | Financial | Insurance | Education | Legal | Property | Employment | Other",
  "importantInformation": [
    {
      "label": "field name",
      "value": "field value"
    }
  ],
  "expiryDate": null
}

Rules:

1. Never invent information.
2. Only use information present in the document.
3. If information is unavailable, do not guess.
4. Keep summary under 2 sentences.
5. Extract important names, dates, IDs, amounts, policy numbers, institutions, diagnoses, treatments, registration numbers and other useful information.
6. expiryDate must be an ISO date such as 2027-05-20 or null.
7. Keep importantInformation concise.
8. Do not repeat the same information.
9. Return valid JSON only.
10. Do not use markdown.
11. Do not add explanations outside JSON.

DOCUMENT TEXT:

${documentText}
`;


  // ==========================================================
  // LOGGING
  // ==========================================================

  console.log(
    "Starting AI document analysis..."
  );

  console.log(
    "AI model:",
    MODEL
  );

  console.log(
    "AI input characters:",
    documentText.length
  );


  // ==========================================================
  // GROQ REQUEST
  // ==========================================================

  try {

    const completion =
      await groq.chat.completions.create({

        model:
          MODEL,

        messages: [

          {
            role: "system",

            content:
              "You are a precise document analysis AI. Return only valid JSON."
          },

          {
            role: "user",

            content:
              prompt
          }

        ],

        temperature:
          0,

        max_tokens:
          MAX_OUTPUT_TOKENS

      });


    // ========================================================
    // GET RESPONSE
    // ========================================================

    const content =
      completion
        ?.choices?.[0]
        ?.message?.content ||
      "";


    console.log(
      "AI response received."
    );


    // ========================================================
    // EMPTY RESPONSE
    // ========================================================

    if (
      !content.trim()
    ) {

      console.error(
        "AI returned an empty response."
      );

      return createFallbackResult();

    }


    // ========================================================
    // CLEAN RESPONSE
    // ========================================================

    console.log(
      "Parsing AI JSON response..."
    );


    const cleaned =
      cleanAIResponse(
        content
      );


    // ========================================================
    // PARSE JSON
    // ========================================================

    try {

      const parsed =
        JSON.parse(
          cleaned
        );


      // ======================================================
      // VALIDATE BASIC STRUCTURE
      // ======================================================

      if (
        typeof parsed !==
        "object" ||
        parsed === null
      ) {

        throw new Error(
          "AI response is not a JSON object."
        );

      }


      // ======================================================
      // ENSURE SUMMARY
      // ======================================================

      if (
        typeof parsed.summary !==
        "string"
      ) {

        parsed.summary =
          "";

      }


      // ======================================================
      // ENSURE DOCUMENT TYPE
      // ======================================================

      if (
        typeof parsed.documentType !==
        "string"
      ) {

        parsed.documentType =
          "Other";

      }


      // ======================================================
      // VALID CATEGORIES
      // ======================================================

      const validCategories = [

        "Other",

        "Identity",

        "Medical",

        "Financial",

        "Insurance",

        "Education",

        "Legal",

        "Property",

        "Employment"

      ];


      if (
        !validCategories.includes(
          parsed.documentType
        )
      ) {

        parsed.documentType =
          "Other";

      }


      // ======================================================
      // ENSURE IMPORTANT INFORMATION
      // ======================================================

      if (
        !Array.isArray(
          parsed.importantInformation
        )
      ) {

        parsed.importantInformation =
          [];

      }


      // ======================================================
      // CLEAN IMPORTANT INFORMATION
      // ======================================================

      parsed.importantInformation =
        parsed
          .importantInformation
          .filter(
            (item) =>
              item &&
              typeof item ===
                "object" &&
              typeof item.label ===
                "string" &&
              typeof item.value ===
                "string"
          )
          .map(
            (item) => ({

              label:
                item.label.trim(),

              value:
                item.value.trim()

            })
          );


      // ======================================================
      // EXPIRY DATE
      // ======================================================

      if (
        parsed.expiryDate ===
        undefined ||
        parsed.expiryDate ===
        "" ||
        parsed.expiryDate ===
        "null"
      ) {

        parsed.expiryDate =
          null;

      }


      console.log(
        "AI JSON parsing successful."
      );


      console.log(
        "Document type:",
        parsed.documentType
      );


      console.log(
        "Important information count:",
        parsed
          .importantInformation
          .length
      );


      return parsed;

    } catch (jsonError) {

      // ======================================================
      // JSON PARSE ERROR
      // ======================================================

      console.error(
        "AI JSON parsing failed."
      );

      console.error(
        "Raw AI response:"
      );

      console.error(
        content
      );


      console.error(
        "Cleaned AI response:"
      );

      console.error(
        cleaned
      );


      // ======================================================
      // IMPORTANT
      // ======================================================
      // Do NOT crash document upload because AI JSON failed.
      // Document itself is already successfully uploaded.
      // ======================================================

      return createFallbackResult();

    }

  } catch (error) {

    // ========================================================
    // GROQ ERROR
    // ========================================================

    console.error(
      "AI document analysis ERROR:",
      error.message
    );


    if (
      error?.status
    ) {

      console.error(
        "AI error status:",
        error.status
      );

    }


    if (
      error?.error
    ) {

      console.error(
        "Groq API Error:",
        error.error
      );

    }


    // ========================================================
    // DO NOT THROW
    // ========================================================
    // This is important.
    //
    // Upload should succeed even if AI fails.
    // ========================================================

    return createFallbackResult();

  }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  analyzeDocument
};