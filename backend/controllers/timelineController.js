const mongoose = require("mongoose");
const Groq = require("groq-sdk");

const Document = require("../models/Document");
const TimelineEvent = require("../models/TimelineEvent");


// ============================================================
// GROQ CLIENT
// ============================================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


// ============================================================
// HELPERS
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


const escapeRegex = (value) => {

  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

};


// ============================================================
// GENERATE TIMELINE
//
// POST /api/timeline/generate
//
// Reads all user's documents and extracts important
// chronological events.
// ============================================================

const generateTimeline = async (
  req,
  res
) => {

  try {

    console.log(
      "============================================================"
    );

    console.log(
      "LIFEVAULT TIMELINE GENERATION REQUEST"
    );


    // ==========================================================
    // AUTHENTICATION
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
    // VALIDATE USER ID
    // ==========================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid user ID."

      });

    }


    // ==========================================================
    // GET DOCUMENTS
    // ==========================================================

    const documents =
      await Document.find({
        owner: userId
      })
      .sort({
        createdAt: -1
      });


    console.log(
      "Timeline documents:",
      documents.length
    );


    // ==========================================================
    // NO DOCUMENTS
    // ==========================================================

    if (
      !documents ||
      documents.length === 0
    ) {

      return res.status(200).json({

        success: true,

        message:
          "No documents available for timeline generation.",

        events: []

      });

    }


    // ==========================================================
    // PREPARE DOCUMENT DATA
    //
    // Limit text per document so the AI request remains bounded.
    // ==========================================================

    const MAX_CHARS_PER_DOCUMENT =
      5000;


    const documentData =
      documents.map(
        (document, index) => {

          const extractedText =
            (
              document.extractedText ||
              ""
            ).trim();


          return {

            index:
              index + 1,

            id:
              document._id.toString(),

            name:
              document.originalName ||
              document.name ||
              "Untitled document",

            category:
              document.category ||
              "Other",

            documentType:
              document.documentType ||
              "Unknown",

            summary:
              document.aiSummary ||
              "",

            extractedText:
              extractedText.slice(
                0,
                MAX_CHARS_PER_DOCUMENT
              )

          };

        }
      );


    // ==========================================================
    // DOCUMENT CONTEXT
    // ==========================================================

    const documentContext =
      documentData
        .map(
          (document) => `

DOCUMENT ${document.index}

ID:
${document.id}

NAME:
${document.name}

CATEGORY:
${document.category}

DOCUMENT TYPE:
${document.documentType}

AI SUMMARY:
${document.summary || "Not available"}

DOCUMENT TEXT:
${document.extractedText || "No extracted text available."}

------------------------------------------------------------

`
        )
        .join("\n");


    // ==========================================================
    // AI PROMPT
    // ==========================================================

    const prompt = `

You are LifeVault AI's Document Intelligence Timeline Engine.

Your job is to convert a user's documents into a meaningful
chronological timeline.

Extract IMPORTANT REAL-WORLD EVENTS from the documents.

Examples:

- Medical consultation
- Diagnosis
- Test or investigation
- Hospital admission
- Insurance policy issuance
- Insurance renewal
- Policy change
- Loan approval
- Loan start
- Property purchase
- Property registration
- Tax filing
- Tax notice
- Employment start
- Employment change
- Education admission
- Graduation
- Identity document issuance
- Passport issuance
- Visa issuance
- Legal agreement signing
- Contract start
- Contract expiry
- Major financial transaction
- Travel event
- Other significant dated events

IMPORTANT:

The timeline should represent events that actually happened
or are explicitly scheduled/recorded in the documents.

Do NOT use the document upload date as the event date unless
the document itself clearly indicates that the upload date
represents the event.

Do NOT invent dates.

Do NOT invent events.

If an event has no reliable date, DO NOT include it.

Focus on significant events rather than every small piece
of information.

Multiple documents may describe the same event.

If multiple documents clearly refer to the same event,
create ONE timeline event and list the strongest source.

Return ONLY valid JSON.

Required format:

{
  "events": [
    {
      "documentId": "",
      "title": "",
      "description": "",
      "eventDate": "",
      "eventType": "medical | financial | insurance | legal | identity | property | education | employment | travel | tax | other",
      "importance": "low | medium | high",
      "confidence": 0,
      "evidence": ""
    }
  ]
}

Rules:

1. eventDate must be a valid ISO date.
2. Never invent an event date.
3. Never invent an event.
4. confidence must be between 0 and 100.
5. evidence must be supported by the document.
6. Keep title concise.
7. Description should explain the event clearly.
8. Only include meaningful events.
9. Avoid duplicate events.
10. Do not include ordinary document metadata as events.
11. Do not include the upload date unless it is explicitly the event date.
12. Return JSON only.
13. No markdown.
14. No code fences.

USER DOCUMENT VAULT:

${documentContext}

`;


    // ==========================================================
    // AI MODEL
    // ==========================================================

    const model =
      process.env.GROQ_ANALYSIS_MODEL ||
      "openai/gpt-oss-20b";


    console.log(
      "Timeline AI model:",
      model
    );


    console.log(
      "Documents sent:",
      documentData.length
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
              "You are a precise chronological document analysis engine. Return valid JSON only."
          },

          {
            role: "user",

            content: prompt
          }

        ],

        temperature: 0,

        max_tokens: 3500

      });


    // ==========================================================
    // RAW RESPONSE
    // ==========================================================

    const rawContent =
      response
        ?.choices?.[0]
        ?.message?.content ||
      "";


    console.log(
      "Timeline AI response received."
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
        "Timeline AI JSON parsing failed."
      );

      console.error(
        "Raw AI response:",
        rawContent
      );


      return res.status(502).json({

        success: false,

        message:
          "AI returned an invalid timeline response."

      });

    }


    // ==========================================================
    // EVENTS ARRAY
    // ==========================================================

    const aiEvents =
      Array.isArray(
        aiResult.events
      )
        ? aiResult.events
        : [];


    console.log(
      "AI events detected:",
      aiEvents.length
    );


    // ==========================================================
    // VALID DOCUMENT IDS
    // ==========================================================

    const validDocumentIds =
      new Set(
        documents.map(
          (document) =>
            document._id.toString()
        )
      );


    // ==========================================================
    // REMOVE INVALID EVENTS
    // ==========================================================

    const validEvents =
      aiEvents.filter(
        (event) => {

          if (
            !event ||
            typeof event !== "object"
          ) {

            return false;

          }


          if (
            typeof event.title !==
            "string" ||
            !event.title.trim()
          ) {

            return false;

          }


          if (
            !event.documentId ||
            !validDocumentIds.has(
              String(
                event.documentId
              )
            )
          ) {

            return false;

          }


          const parsedDate =
            normalizeDate(
              event.eventDate
            );


          if (!parsedDate) {

            return false;

          }


          return true;

        }
      );


    // ==========================================================
    // SAVE EVENTS
    // ==========================================================

    const savedEvents = [];


    for (
      const event
      of validEvents
    ) {

      // --------------------------------------------------------
      // DOCUMENT
      // --------------------------------------------------------

      const sourceDocument =
        documents.find(
          (document) =>
            document._id.toString() ===
            String(
              event.documentId
            )
        );


      if (!sourceDocument) {
        continue;
      }


      // --------------------------------------------------------
      // TITLE
      // --------------------------------------------------------

      const title =
        event.title
          .trim()
          .slice(
            0,
            200
          );


      // --------------------------------------------------------
      // DESCRIPTION
      // --------------------------------------------------------

      const description =
        typeof event.description ===
        "string"
          ? event.description
              .trim()
              .slice(
                0,
                1200
              )
          : "";


      // --------------------------------------------------------
      // DATE
      // --------------------------------------------------------

      const eventDate =
        normalizeDate(
          event.eventDate
        );


      if (!eventDate) {
        continue;
      }


      // --------------------------------------------------------
      // EVENT TYPE
      // --------------------------------------------------------

      const allowedEventTypes = [

        "medical",
        "financial",
        "insurance",
        "legal",
        "identity",
        "property",
        "education",
        "employment",
        "travel",
        "tax",
        "other"

      ];


      const eventType =
        allowedEventTypes.includes(
          event.eventType
        )
          ? event.eventType
          : "other";


      // --------------------------------------------------------
      // IMPORTANCE
      // --------------------------------------------------------

      const allowedImportance = [
        "low",
        "medium",
        "high"
      ];


      const importance =
        allowedImportance.includes(
          event.importance
        )
          ? event.importance
          : "medium";


      // --------------------------------------------------------
      // CONFIDENCE
      // --------------------------------------------------------

      let confidence =
        Number(
          event.confidence
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
        typeof event.evidence ===
        "string"
          ? event.evidence
              .trim()
              .slice(
                0,
                1000
              )
          : "";


      // ========================================================
      // DUPLICATE CHECK
      //
      // Same owner + same document + same title + same day.
      // ========================================================

      const startOfDay =
        new Date(
          eventDate
        );

      startOfDay.setHours(
        0,
        0,
        0,
        0
      );


      const endOfDay =
        new Date(
          eventDate
        );

      endOfDay.setHours(
        23,
        59,
        59,
        999
      );


      const existingEvent =
        await TimelineEvent.findOne({

          owner:
            userId,

          document:
            sourceDocument._id,

          title: {
            $regex:
              `^${escapeRegex(title)}$`,
            $options: "i"
          },

          eventDate: {
            $gte:
              startOfDay,

            $lte:
              endOfDay
          }

        });


      if (existingEvent) {

        savedEvents.push(
          existingEvent
        );

        continue;

      }


      // ========================================================
      // CREATE EVENT
      // ========================================================

      const newEvent =
        await TimelineEvent.create({

          owner:
            userId,

          document:
            sourceDocument._id,

          title,

          description,

          eventDate,

          eventType,

          importance,

          evidence,

          documentName:
            sourceDocument.originalName ||
            "",

          confidence

        });


      savedEvents.push(
        newEvent
      );

    }


    // ==========================================================
    // SORT CHRONOLOGICALLY
    // ==========================================================

    savedEvents.sort(
      (a, b) => {

        return (
          new Date(
            a.eventDate
          ) -
          new Date(
            b.eventDate
          )
        );

      }
    );


    // ==========================================================
    // RESPONSE
    // ==========================================================

    console.log(
      "Timeline events saved:",
      savedEvents.length
    );


    return res.status(200).json({

      success: true,

      message:
        savedEvents.length > 0
          ? "Document timeline generated successfully."
          : "No dated events were found in your documents.",

      count:
        savedEvents.length,

      events:
        savedEvents

    });

  } catch (error) {

    // ==========================================================
    // ERROR
    // ==========================================================

    console.error(
      "Timeline generation error:",
      error
    );


    // ==========================================================
    // LARGE REQUEST / RATE LIMIT
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
          "Your document vault is too large for one timeline scan."

      });

    }


    // ==========================================================
    // DEFAULT ERROR
    // ==========================================================

    return res.status(500).json({

      success: false,

      message:
        "Unable to generate document timeline.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined

    });

  }

};


// ============================================================
// GET TIMELINE
//
// GET /api/timeline
//
// Optional:
// ?type=medical
// ?importance=high
// ============================================================

const getTimeline = async (
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
    // QUERY
    // ==========================================================

    const query = {

      owner:
        userId

    };


    // ==========================================================
    // EVENT TYPE FILTER
    // ==========================================================

    const type =
      typeof req.query.type ===
      "string"
        ? req.query.type.trim()
        : "";


    const allowedEventTypes = [

      "medical",
      "financial",
      "insurance",
      "legal",
      "identity",
      "property",
      "education",
      "employment",
      "travel",
      "tax",
      "other"

    ];


    if (
      type &&
      allowedEventTypes.includes(
        type
      )
    ) {

      query.eventType =
        type;

    }


    // ==========================================================
    // IMPORTANCE FILTER
    // ==========================================================

    const importance =
      typeof req.query.importance ===
      "string"
        ? req.query.importance.trim()
        : "";


    const allowedImportance = [
      "low",
      "medium",
      "high"
    ];


    if (
      importance &&
      allowedImportance.includes(
        importance
      )
    ) {

      query.importance =
        importance;

    }


    // ==========================================================
    // FETCH
    // ==========================================================

    const events =
      await TimelineEvent
        .find(query)
        .populate(
          "document",
          "originalName category documentType"
        )
        .sort({
          eventDate: -1
        });


    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.status(200).json({

      success: true,

      count:
        events.length,

      events

    });

  } catch (error) {

    console.error(
      "Get timeline error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch timeline.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined

    });

  }

};


// ============================================================
// DELETE TIMELINE EVENT
//
// DELETE /api/timeline/:id
// ============================================================

const deleteTimelineEvent = async (
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
    // EVENT ID
    // ==========================================================

    const eventId =
      typeof req.params.id ===
      "string"
        ? req.params.id.trim()
        : "";


    if (
      !mongoose.Types.ObjectId.isValid(
        eventId
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid timeline event ID."

      });

    }


    // ==========================================================
    // DELETE
    // ==========================================================

    const event =
      await TimelineEvent.findOneAndDelete({

        _id:
          eventId,

        owner:
          userId

      });


    if (!event) {

      return res.status(404).json({

        success: false,

        message:
          "Timeline event not found."

      });

    }


    // ==========================================================
    // RESPONSE
    // ==========================================================

    return res.status(200).json({

      success: true,

      message:
        "Timeline event deleted successfully."

    });

  } catch (error) {

    console.error(
      "Delete timeline event error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to delete timeline event.",

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

  generateTimeline,

  getTimeline,

  deleteTimelineEvent

};