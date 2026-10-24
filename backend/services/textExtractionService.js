const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


/*
=========================================================
PDF TEXT EXTRACTION
=========================================================
*/

const extractPdfText = async (filePath) => {

  try {

    const pdfModule = require("pdf-parse");

    const absolutePath =
      path.resolve(filePath);

    const buffer =
      fs.readFileSync(absolutePath);


    console.log(
      "Reading PDF:",
      absolutePath
    );


    /*
    -----------------------------------------------------
    HANDLE DIFFERENT PDF-PARSE EXPORTS
    -----------------------------------------------------
    */

    let pdfParse = pdfModule;

    if (
      pdfModule &&
      typeof pdfModule.default === "function"
    ) {
      pdfParse = pdfModule.default;
    }

    /*
    Some newer versions expose PDFParse.
    */

    if (
      pdfModule &&
      typeof pdfModule.PDFParse === "function"
    ) {

      const parser =
        new pdfModule.PDFParse({
          data: buffer
        });

      const result =
        await parser.getText();

      /*
      Cleanup parser if available
      */

      if (
        typeof parser.destroy === "function"
      ) {
        await parser.destroy();
      }

      const text =
        result?.text || "";

      console.log(
        "PDF text extracted:",
        text.length,
        "characters"
      );

      return text;
    }


    /*
    -----------------------------------------------------
    NORMAL FUNCTION EXPORT
    -----------------------------------------------------
    */

    if (
      typeof pdfParse === "function"
    ) {

      const result =
        await pdfParse(buffer);

      const text =
        result?.text || "";

      console.log(
        "PDF text extracted:",
        text.length,
        "characters"
      );

      return text;
    }


    /*
    -----------------------------------------------------
    UNKNOWN EXPORT
    -----------------------------------------------------
    */

    console.error(
      "Unsupported pdf-parse export:",
      Object.keys(pdfModule || {})
    );

    throw new Error(
      "Installed pdf-parse version is incompatible."
    );

  } catch (error) {

    console.error(
      "PDF extraction ERROR:",
      error
    );

    throw error;
  }
};


/*
=========================================================
IMAGE OCR USING GROQ VISION
=========================================================
*/

const extractImageText = async (
  filePath,
  mimeType
) => {

  try {

    const absolutePath =
      path.resolve(filePath);


    console.log(
      "Reading image:",
      absolutePath
    );


    const imageBuffer =
      fs.readFileSync(
        absolutePath
      );


    const base64Image =
      imageBuffer.toString(
        "base64"
      );


    console.log(
      "Image size:",
      imageBuffer.length,
      "bytes"
    );


    const response =
      await groq.chat.completions.create({

        model:
          "qwen/qwen3.6-27b",

        messages: [

          {
            role: "system",

            content:
              "You are an OCR engine. Read the document image carefully and extract all visible text exactly. Include names, dates, numbers, IDs, addresses, amounts, headings and labels. Do not invent text."
          },

          {

            role: "user",

            content: [

              {
                type: "text",

                text:
                  "Extract all readable text from this document image. Return ONLY the extracted text."
              },

              {
                type: "image_url",

                image_url: {

                  url:
                    `data:${mimeType};base64,${base64Image}`

                }

              }

            ]

          }

        ],

        temperature: 0,

        max_completion_tokens: 4000

      });


    const text =
      response
        ?.choices?.[0]
        ?.message?.content || "";


    console.log(
      "OCR result length:",
      text.length
    );


    console.log(
      "OCR result:",
      text.substring(0, 500)
    );


    if (!text.trim()) {

      throw new Error(
        "Groq returned empty OCR text."
      );

    }


    return text;

  } catch (error) {

    console.error(
      "IMAGE OCR ERROR:",
      error
    );

    throw error;
  }
};


/*
=========================================================
MAIN TEXT EXTRACTION
=========================================================
*/

const extractText = async (
  filePath,
  mimeType
) => {

  console.log(
    "Extracting:",
    mimeType
  );


  /*
  -------------------------------------------------------
  PDF
  -------------------------------------------------------
  */

  if (
    mimeType ===
    "application/pdf"
  ) {

    return await extractPdfText(
      filePath
    );

  }


  /*
  -------------------------------------------------------
  JPEG / JPG
  -------------------------------------------------------
  */

  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/jpg"
  ) {

    return await extractImageText(
      filePath,
      "image/jpeg"
    );

  }


  /*
  -------------------------------------------------------
  PNG
  -------------------------------------------------------
  */

  if (
    mimeType === "image/png"
  ) {

    return await extractImageText(
      filePath,
      "image/png"
    );

  }


  throw new Error(
    `Unsupported document type: ${mimeType}`
  );
};


/*
=========================================================
EXPORT
=========================================================
*/

module.exports = {

  extractText,

  extractPdfText,

  extractImageText

};