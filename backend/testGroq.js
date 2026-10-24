require("dotenv").config();

const Groq = require("groq-sdk");

const testGroq = async () => {
  try {
    console.log("==========================================");
    console.log("LIFEVAULT AI - GROQ CONNECTION TEST");
    console.log("==========================================");

    // ------------------------------------------
    // CHECK API KEY
    // ------------------------------------------

    if (!process.env.GROQ_API_KEY) {
      console.error(
        "ERROR: GROQ_API_KEY is missing."
      );

      process.exit(1);
    }

    console.log(
      "GROQ_API_KEY found: YES"
    );

    console.log(
      "API key length:",
      process.env.GROQ_API_KEY.length
    );

    // ------------------------------------------
    // CREATE GROQ CLIENT
    // ------------------------------------------

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    // ------------------------------------------
    // GET AVAILABLE MODELS
    // ------------------------------------------

    console.log("");
    console.log(
      "Fetching models available to this API key..."
    );

    const models =
      await groq.models.list();

    console.log("");
    console.log(
      "Models returned by Groq:"
    );

    console.log(
      "=========================================="
    );

    if (
      !models ||
      !models.data ||
      !Array.isArray(models.data)
    ) {
      console.log(
        "No model list returned."
      );

      process.exit(1);
    }

    models.data.forEach(
      (model, index) => {

        console.log(
          `${index + 1}. ${model.id}`
        );

      }
    );

    console.log(
      "=========================================="
    );

    // ------------------------------------------
    // CHECK REQUIRED MODELS
    // ------------------------------------------

    const modelIds =
      models.data.map(
        (model) => model.id
      );

    const modelsToCheck = [
      "llama-3.3-70b-versatile",
      "openai/gpt-oss-20b",
      "openai/gpt-oss-20b",
      "openai/gpt-oss-120b"
    ];

    console.log("");
    console.log(
      "Checking LifeVault AI models..."
    );

    console.log(
      "=========================================="
    );

    modelsToCheck.forEach(
      (modelName) => {

        if (
          modelIds.includes(modelName)
        ) {

          console.log(
            `AVAILABLE: ${modelName}`
          );

        } else {

          console.log(
            `NOT AVAILABLE: ${modelName}`
          );

        }

      }
    );

    console.log(
      "=========================================="
    );

    // ------------------------------------------
    // SELECT TEST MODEL
    // ------------------------------------------

    let testModel =
      null;

    if (
      modelIds.includes(
        "openai/gpt-oss-20b"
      )
    ) {

      testModel =
        "openai/gpt-oss-20b";

    } else if (
      modelIds.includes(
        "llama-3.3-70b-versatile"
      )
    ) {

      testModel =
        "llama-3.3-70b-versatile";

    } else if (
      modelIds.includes(
        "openai/gpt-oss-20b"
      )
    ) {

      testModel =
        "openai/gpt-oss-20b";

    }

    // ------------------------------------------
    // NO MODEL
    // ------------------------------------------

    if (!testModel) {

      console.error("");
      console.error(
        "NO USABLE CHAT MODEL IS AVAILABLE."
      );

      console.error(
        "The API key/project is not returning"
      );

      console.error(
        "any of the models required by LifeVault AI."
      );

      process.exit(1);
    }

    console.log("");
    console.log(
      "Selected test model:",
      testModel
    );

    // ------------------------------------------
    // TEST CHAT COMPLETION
    // ------------------------------------------

    console.log("");
    console.log(
      "Testing chat completion..."
    );

    const completion =
      await groq.chat.completions.create({

        model:
          testModel,

        messages: [
          {
            role: "system",

            content:
              "You are a test assistant."
          },

          {
            role: "user",

            content:
              "Reply with exactly: GROQ_TEST_SUCCESS"
          }
        ],

        temperature: 0,

        max_tokens: 50
      });

    // ------------------------------------------
    // GET RESPONSE
    // ------------------------------------------

    const response =
      completion
        ?.choices?.[0]
        ?.message
        ?.content;

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "GROQ RESPONSE:"
    );

    console.log(
      response
    );

    console.log(
      "=========================================="
    );

    // ------------------------------------------
    // SUCCESS
    // ------------------------------------------

    console.log("");
    console.log(
      "GROQ CONNECTION TEST SUCCESSFUL."
    );

    console.log(
      "LifeVault AI can use:",
      testModel
    );

    process.exit(0);

  } catch (error) {

    // ------------------------------------------
    // ERROR
    // ------------------------------------------

    console.log("");
    console.log(
      "=========================================="
    );

    console.error(
      "GROQ TEST FAILED"
    );

    console.log(
      "=========================================="
    );

    console.error(
      "Message:",
      error.message
    );

    if (error.status) {

      console.error(
        "Status:",
        error.status
      );

    }

    if (error.code) {

      console.error(
        "Code:",
        error.code
      );

    }

    if (error.error) {

      console.error(
        "Groq error:",
        error.error
      );

    }

    console.log(
      "=========================================="
    );

    process.exit(1);
  }
};

testGroq();