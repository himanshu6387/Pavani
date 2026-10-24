const multer = require("multer");
const path = require("path");
const fs = require("fs");


// ============================================================
// LIFEVAULT AI
// FILE UPLOAD MIDDLEWARE
// ============================================================
//
// This middleware is responsible for:
//
// 1. Creating the uploads directory
// 2. Saving uploaded files to disk
// 3. Generating unique file names
// 4. Validating supported file types
// 5. Limiting file size
// 6. Supporting both:
//      - document
//      - file
//
// IMPORTANT
// ------------------------------------------------------------
// documentRoutes.js uses:
//
// upload.fields([
//   {
//     name: "document",
//     maxCount: 1
//   },
//   {
//     name: "file",
//     maxCount: 1
//   }
// ])
//
// Therefore this module MUST export the multer instance
// itself.
//
// ============================================================



// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDirectory =
  path.join(
    __dirname,
    "..",
    "uploads"
  );



// ============================================================
// CREATE UPLOAD DIRECTORY
// ============================================================
//
// If the uploads folder doesn't exist, create it.
//
// recursive: true also makes this safe if parent
// directories don't exist yet.
// ============================================================

try {

  if (
    !fs.existsSync(
      uploadDirectory
    )
  ) {

    fs.mkdirSync(
      uploadDirectory,
      {
        recursive: true
      }
    );

    console.log(
      "Uploads directory created:",
      uploadDirectory
    );

  }

} catch (error) {

  console.error(
    "Failed to create uploads directory:",
    error
  );

}



// ============================================================
// STORAGE CONFIGURATION
// ============================================================

const storage =
  multer.diskStorage({

    // ----------------------------------------------------------
    // DESTINATION
    // ----------------------------------------------------------

    destination: (
      req,
      file,
      callback
    ) => {

      callback(
        null,
        uploadDirectory
      );

    },


    // ----------------------------------------------------------
    // FILE NAME
    // ----------------------------------------------------------

    filename: (
      req,
      file,
      callback
    ) => {

      try {

        // ------------------------------------------------------
        // ORIGINAL FILE EXTENSION
        // ------------------------------------------------------

        const extension =
          path.extname(
            file.originalname
          );


        // ------------------------------------------------------
        // ORIGINAL FILE NAME
        // ------------------------------------------------------

        const originalBaseName =
          path.basename(
            file.originalname,
            extension
          );


        // ------------------------------------------------------
        // CLEAN FILE NAME
        // ------------------------------------------------------
        //
        // Remove characters that can cause problems in
        // Windows/Linux file systems.
        //
        // ------------------------------------------------------

        const cleanBaseName =
          originalBaseName
            .replace(
              /[^a-zA-Z0-9-_]/g,
              "_"
            )
            .replace(
              /_+/g,
              "_"
            )
            .replace(
              /^_+|_+$/g,
              ""
            );


        // ------------------------------------------------------
        // FALLBACK NAME
        // ------------------------------------------------------

        const safeBaseName =
          cleanBaseName ||
          "document";


        // ------------------------------------------------------
        // UNIQUE NAME
        // ------------------------------------------------------

        const uniquePart =
          `${Date.now()}-${Math.round(
            Math.random() * 1e9
          )}`;


        const finalFileName =
          `${safeBaseName}-${uniquePart}${extension}`;


        console.log(
          "Multer saving file as:",
          finalFileName
        );


        callback(
          null,
          finalFileName
        );


      } catch (error) {

        callback(
          error
        );

      }

    }

  });



// ============================================================
// ALLOWED MIME TYPES
// ============================================================
//
// LifeVault currently supports:
//
// PDF
// JPG
// JPEG
// PNG
// DOC
// DOCX
//
// ============================================================

const allowedMimeTypes = [

  // ----------------------------------------------------------
  // PDF
  // ----------------------------------------------------------

  "application/pdf",


  // ----------------------------------------------------------
  // JPEG
  // ----------------------------------------------------------

  "image/jpeg",

  "image/jpg",


  // ----------------------------------------------------------
  // PNG
  // ----------------------------------------------------------

  "image/png",


  // ----------------------------------------------------------
  // DOC
  // ----------------------------------------------------------

  "application/msword",


  // ----------------------------------------------------------
  // DOCX
  // ----------------------------------------------------------

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

];



// ============================================================
// ALLOWED EXTENSIONS
// ============================================================
//
// Some browsers may send slightly different MIME types.
// Extension checking gives us an additional safe fallback.
//
// ============================================================

const allowedExtensions = [

  ".pdf",

  ".jpg",

  ".jpeg",

  ".png",

  ".doc",

  ".docx"

];



// ============================================================
// FILE FILTER
// ============================================================

const fileFilter =
  (
    req,
    file,
    callback
  ) => {

    try {

      console.log(
        "Multer received upload request."
      );


      console.log(
        "Upload field:",
        file.fieldname
      );


      console.log(
        "Original filename:",
        file.originalname
      );


      console.log(
        "MIME type:",
        file.mimetype
      );


      // --------------------------------------------------------
      // GET EXTENSION
      // --------------------------------------------------------

      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();


      // --------------------------------------------------------
      // MIME CHECK
      // --------------------------------------------------------

      const validMimeType =
        allowedMimeTypes.includes(
          file.mimetype
        );


      // --------------------------------------------------------
      // EXTENSION CHECK
      // --------------------------------------------------------

      const validExtension =
        allowedExtensions.includes(
          extension
        );


      // --------------------------------------------------------
      // ACCEPT FILE
      // --------------------------------------------------------
      //
      // We accept if either MIME type OR extension confirms
      // a supported document type.
      //
      // This is useful because some browsers/OS combinations
      // report slightly different MIME values for DOC/DOCX.
      //
      // --------------------------------------------------------

      if (
        validMimeType ||
        validExtension
      ) {

        console.log(
          "File type accepted by Multer."
        );


        callback(
          null,
          true
        );


        return;

      }


      // --------------------------------------------------------
      // REJECT FILE
      // --------------------------------------------------------

      console.error(
        "Unsupported file type:",
        {
          originalName:
            file.originalname,

          mimeType:
            file.mimetype,

          extension:
            extension

        }
      );


      callback(
        new Error(
          "Unsupported file type. Please upload PDF, JPG, PNG, DOC or DOCX."
        )
      );


    } catch (error) {

      console.error(
        "Multer file filter error:",
        error
      );


      callback(
        error
      );

    }

  };



// ============================================================
// MULTER INSTANCE
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
// Export THIS multer instance.
//
// documentRoutes.js imports it like:
//
// const upload =
//   require("../middleware/uploadMiddleware");
//
// Then it can safely call:
//
// upload.single("document")
//
// OR:
//
// upload.fields([...])
//
// ============================================================

const upload =
  multer({

    storage:

      storage,


    fileFilter:

      fileFilter,


    limits: {

      // --------------------------------------------------------
      // 10 MB MAXIMUM FILE SIZE
      // --------------------------------------------------------

      fileSize:
        10 * 1024 * 1024,

      // --------------------------------------------------------
      // ONLY A SMALL NUMBER OF FILES ARE EXPECTED
      // --------------------------------------------------------

      files:
        2

    }

  });



// ============================================================
// MULTER ERROR HANDLER HELPER
// ============================================================
//
// This helper is exported as well so it can be used if you
// ever want centralized Multer error handling.
//
// It does NOT replace the multer instance export.
//
// ============================================================

const handleUploadError =
  (
    error,
    req,
    res,
    next
  ) => {

    if (!error) {

      return next();

    }


    console.error(
      "Multer upload error:",
      error
    );


    // ----------------------------------------------------------
    // FILE TOO LARGE
    // ----------------------------------------------------------

    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "File is too large. Maximum allowed size is 10 MB."

      });

    }


    // ----------------------------------------------------------
    // TOO MANY FILES
    // ----------------------------------------------------------

    if (
      error.code ===
      "LIMIT_FILE_COUNT"
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Too many files were uploaded."

      });

    }


    // ----------------------------------------------------------
    // UNEXPECTED FIELD
    // ----------------------------------------------------------

    if (
      error.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          `Unexpected upload field: ${
            error.field ||
            "unknown"
          }`

      });

    }


    // ----------------------------------------------------------
    // GENERAL MULTER ERROR
    // ----------------------------------------------------------

    if (
      error instanceof
      multer.MulterError
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          error.message ||
          "File upload failed."

      });

    }


    // ----------------------------------------------------------
    // CUSTOM FILE FILTER ERROR
    // ----------------------------------------------------------

    if (
      error.message &&
      error.message.includes(
        "Unsupported file type"
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }


    // ----------------------------------------------------------
    // PASS UNKNOWN ERROR
    // ----------------------------------------------------------

    return next(
      error
    );

  };



// ============================================================
// EXPORT
// ============================================================
//
// DEFAULT EXPORT:
//   upload
//
// NAMED PROPERTY:
//   handleUploadError
//
// This keeps compatibility with:
//
// const upload = require(...)
//
// while also allowing:
//
// const {
//   handleUploadError
// } = require(...)
//
// ============================================================

module.exports =
  upload;


module.exports.upload =
  upload;


module.exports.handleUploadError =
  handleUploadError;