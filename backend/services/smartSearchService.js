const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


/*
=========================================================
SMART SEARCH AI
=========================================================
*/

const understandSearchQuery = async (query) => {

  if (!query || !query.trim()) {

    return {
      searchTerms: [],
      categories: [],
      intent: "general"
    };

  }


  const prompt = `
You are the Smart Search engine for LifeVault AI.

The user wants to search their personal documents.

Convert the user's natural-language query into structured JSON.

Return ONLY valid JSON in this exact format:

{
  "searchTerms": [],
  "categories": [],
  "intent": "general"
}

Allowed categories:

- Other
- Identity
- Medical
- Financial
- Insurance
- Education
- Legal
- Property
- Employment

Possible intents:

- general
- category
- expiry
- name
- date
- policy
- amount
- document_type
- keyword

Rules:

1. Extract useful search keywords.
2. If the user mentions a document category, add it to categories.
3. Do not invent categories.
4. Keep searchTerms short and useful.
5. If no category is mentioned, return an empty categories array.
6. Return JSON only.

USER QUERY:

${query}
`;


  try {

    const response =
      await groq.chat.completions.create({

        model:
          process.env.GROQ_ANALYSIS_MODEL ||
          "llama-3.3-70b-versatile",

        messages: [

          {
            role: "system",

            content:
              "You are a precise document search query parser. Return only JSON."
          },

          {
            role: "user",

            content: prompt
          }

        ],

        temperature: 0,

        max_tokens: 500

      });


    const content =
      response
        ?.choices?.[0]
        ?.message
        ?.content || "";


    const cleaned =
      content
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();


    try {

      return JSON.parse(
        cleaned
      );

    } catch {

      return {

        searchTerms:
          query
            .trim()
            .split(/\s+/)
            .slice(0, 10),

        categories: [],

        intent: "keyword"

      };

    }

  } catch (error) {

    console.error(
      "Smart search AI error:",
      error
    );


    return {

      searchTerms:
        query
          .trim()
          .split(/\s+/)
          .slice(0, 10),

      categories: [],

      intent: "keyword"

    };

  }

};


module.exports = {
  understandSearchQuery
};