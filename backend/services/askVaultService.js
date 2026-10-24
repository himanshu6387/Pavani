const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================================
// GROQ MODEL
// ============================================================

const MODEL =
  process.env.GROQ_ANALYSIS_MODEL ||
  "openai/gpt-oss-20b";

// ============================================================
// LIMITS
// ============================================================

const MAX_DOCUMENTS = 20;

const MAX_SUMMARY_LENGTH = 700;

const MAX_EXTRACTED_TEXT_LENGTH = 1200;

const MAX_KEY_INFORMATION_LENGTH = 1000;

// ============================================================
// SAFE STRING
// ============================================================

const toSafeString = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
};

// ============================================================
// TRUNCATE
// ============================================================

const truncateText = (
  value,
  maxLength
) => {
  const text =
    toSafeString(value);

  if (
    text.length <= maxLength
  ) {
    return text;
  }

  return (
    text.substring(
      0,
      maxLength
    ) +
    "\n[Content truncated]"
  );
};

// ============================================================
// SAFE JSON STRINGIFY
// ============================================================

const safeStringify = (
  value
) => {
  try {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return JSON.stringify(
      value
    );
  } catch (error) {
    return "";
  }
};

// ============================================================
// FORMAT EXPIRY DATE
// ============================================================

const formatExpiryDate = (
  expiryDate
) => {
  if (!expiryDate) {
    return "Not available";
  }

  try {
    const date =
      new Date(expiryDate);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not available";
    }

    return date
      .toISOString()
      .split("T")[0];
  } catch (error) {
    return "Not available";
  }
};

// ============================================================
// PREPARE SINGLE DOCUMENT
// ============================================================

const prepareDocument = (
  document,
  index
) => {
  const documentName =
    document.originalName ||
    "Unknown document";

  const category =
    document.category ||
    "Other";

  const documentType =
    document.documentType ||
    "Not available";

  const summary =
    truncateText(
      document.aiSummary,
      MAX_SUMMARY_LENGTH
    ) ||
    "Not available";

  const extractedText =
    truncateText(
      document.extractedText,
      MAX_EXTRACTED_TEXT_LENGTH
    ) ||
    "No extracted text available.";

  const keyInformation =
    truncateText(
      safeStringify(
        document.keyInformation
      ),
      MAX_KEY_INFORMATION_LENGTH
    ) ||
    "Not available";

  const expiryDate =
    formatExpiryDate(
      document.expiryDate
    );

  return `
============================================================
DOCUMENT ${index + 1}
============================================================

Document Name:
${documentName}

Category:
${category}

Document Type:
${documentType}

AI Summary:
${summary}

Expiry Date:
${expiryDate}

Important Information:
${keyInformation}

Extracted Text:
${extractedText}

============================================================
`;
};

// ============================================================
// BUILD DOCUMENT CONTEXT
// ============================================================

const buildDocumentContext = (
  documents
) => {
  if (
    !Array.isArray(
      documents
    )
  ) {
    return "";
  }

  const limitedDocuments =
    documents.slice(
      0,
      MAX_DOCUMENTS
    );

  return limitedDocuments
    .map(
      (
        document,
        index
      ) => {
        return prepareDocument(
          document,
          index
        );
      }
    )
    .join("\n");
};

// ============================================================
// CLEAN AI RESPONSE
// ============================================================

const cleanAIResponse = (
  content
) => {
  if (!content) {
    return "";
  }

  return content
    .replace(
      /```json/gi,
      ""
    )
    .replace(
      /```/g,
      ""
    )
    .trim();
};

// ============================================================
// FALLBACK
// ============================================================

const createFallbackResponse =
  () => {
    return {
      answer:
        "I could not process the AI response correctly. Please try asking your question again.",

      sources: [],
    };
  };

// ============================================================
// ASK LIFEVAULT
// ============================================================

const askLifeVault = async (
  question,
  documents
) => {
  // ==========================================================
  // QUESTION CHECK
  // ==========================================================

  if (
    !question ||
    !question.trim()
  ) {
    throw new Error(
      "Question is required."
    );
  }

  // ==========================================================
  // DOCUMENT CHECK
  // ==========================================================

  if (
    !Array.isArray(
      documents
    ) ||
    documents.length === 0
  ) {
    return {
      answer:
        "Your LifeVault does not contain any documents yet. Upload a document first and then ask me a question.",

      sources: [],
    };
  }

  // ==========================================================
  // CLEAN QUESTION
  // ==========================================================

  const cleanQuestion =
    question.trim();

  // ==========================================================
  // BUILD CONTEXT
  // ==========================================================

  const documentContext =
    buildDocumentContext(
      documents
    );

  // ==========================================================
  // PROMPT
  // ==========================================================

  const prompt = `
You are LifeVault AI.

You are a private personal document assistant.

Your job is to answer the user's question using ONLY
the information contained in the supplied LifeVault
document context.

USER QUESTION:

${cleanQuestion}

============================================================
LIFEVAULT DOCUMENT CONTEXT
============================================================

${documentContext}

============================================================
IMPORTANT RULES
============================================================

1. Use ONLY information present in the supplied documents.

2. Never invent information.

3. Never guess missing information.

4. If the requested information is not available in the
documents, clearly say that you could not find it in the
user's LifeVault documents.

5. If multiple documents contain relevant information,
combine them carefully.

6. Mention relevant document names in the sources array.

7. Keep the answer concise but useful.

8. For medical questions, only explain what is present
in the uploaded documents. Do not diagnose the user.

9. Do not make medical conclusions that are not explicitly
supported by the uploaded documents.

10. For expiry questions, use only expiry dates present
in the documents.

11. For employment questions, use only employment details
present in the documents.

12. For financial questions, use only financial information
present in the documents.

13. For insurance questions, use only insurance information
present in the documents.

14. For identity questions, use only identity information
present in the documents.

15. If the user asks for a summary, summarize only the
provided LifeVault documents.

16. Return ONLY valid JSON.

============================================================
REQUIRED JSON FORMAT
============================================================

{
  "answer": "your answer here",
  "sources": [
    {
      "documentName": "document name",
      "reason": "why this document supports the answer"
    }
  ]
}
`;

  try {
    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "============================================================"
    );

    console.log(
      "Starting LifeVault Ask AI..."
    );

    console.log(
      "AI model:",
      MODEL
    );

    console.log(
      "Documents available:",
      documents.length
    );

    console.log(
      "Documents sent:",
      Math.min(
        documents.length,
        MAX_DOCUMENTS
      )
    );

    console.log(
      "Question:",
      cleanQuestion
    );

    // ========================================================
    // GROQ
    // ========================================================

    const completion =
      await groq.chat.completions.create(
        {
          model: MODEL,

          messages: [
            {
              role: "system",

              content:
                "You are a precise personal document assistant. Use only the supplied LifeVault documents. Never invent information. Return valid JSON only.",
            },

            {
              role: "user",

              content:
                prompt,
            },
          ],

          temperature: 0.1,

          max_tokens: 1200,
        }
      );

    // ========================================================
    // GET RESPONSE
    // ========================================================

    const content =
      completion
        ?.choices?.[0]
        ?.message
        ?.content || "";

    console.log(
      "AI response received."
    );

    // ========================================================
    // EMPTY RESPONSE
    // ========================================================

    if (
      !content.trim()
    ) {
      throw new Error(
        "AI returned an empty response."
      );
    }

    // ========================================================
    // CLEAN RESPONSE
    // ========================================================

    const cleaned =
      cleanAIResponse(
        content
      );

    console.log(
      "AI cleaned response:"
    );

    console.log(
      cleaned
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
      // ANSWER
      // ======================================================

      const answer =
        typeof parsed.answer ===
        "string"
          ? parsed.answer.trim()
          : "";

      // ======================================================
      // SOURCES
      // ======================================================

      const sources =
        Array.isArray(
          parsed.sources
        )
          ? parsed.sources
          : [];

      // ======================================================
      // INVALID ANSWER
      // ======================================================

      if (!answer) {
        return createFallbackResponse();
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      return {
        answer: answer,

        sources: sources,
      };
    } catch (jsonError) {
      console.error(
        "Ask AI JSON parsing failed."
      );

      console.error(
        "JSON error:",
        jsonError.message
      );

      console.error(
        "Raw AI response:",
        content
      );

      return createFallbackResponse();
    }
  } catch (error) {
    console.error(
      "============================================================"
    );

    console.error(
      "LifeVault Ask AI ERROR"
    );

    console.error(
      "Error message:",
      error.message
    );

    console.error(
      "Error status:",
      error.status
    );

    console.error(
      "Error code:",
      error.code
    );

    console.error(
      "============================================================"
    );

    throw error;
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  askLifeVault,
};