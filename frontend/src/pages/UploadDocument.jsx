import React, {
  useState,
  useRef
} from "react";

import api from "../services/api";


// ============================================================
// COMPONENT
// ============================================================

const UploadDocument = () => {

  // ==========================================================
  // STATE
  // ==========================================================

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [category, setCategory] =
    useState("Other");

  const [description, setDescription] =
    useState("");

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [uploadedDocument, setUploadedDocument] =
    useState(null);

  const fileInputRef =
    useRef(null);


  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories = [
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


  // ==========================================================
  // FILE SELECT
  // ==========================================================

  const handleFileChange = (event) => {

    setError("");
    setMessage("");
    setUploadedDocument(null);
    setUploadProgress(0);

    const file =
      event.target.files?.[0];

    if (!file) {

      setSelectedFile(null);

      return;
    }


    // ========================================================
    // FILE SIZE LIMIT
    // ========================================================

    const maxSize =
      10 * 1024 * 1024;

    if (
      file.size >
      maxSize
    ) {

      setError(
        "File size must be less than 10 MB."
      );

      setSelectedFile(null);

      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          "";

      }

      return;
    }


    // ========================================================
    // ALLOWED FILE TYPES
    // ========================================================

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Unsupported file type. Please upload PDF, JPG, PNG, DOC or DOCX."
      );

      setSelectedFile(null);

      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          "";

      }

      return;
    }


    // ========================================================
    // SET FILE
    // ========================================================

    setSelectedFile(
      file
    );

  };


  // ==========================================================
  // FORMAT FILE SIZE
  // ==========================================================

  const formatFileSize = (
    bytes
  ) => {

    if (
      bytes === 0
    ) {

      return "0 Bytes";

    }


    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB"
    ];


    const index =
      Math.floor(
        Math.log(bytes) /
        Math.log(1024)
      );


    return (
      parseFloat(
        (
          bytes /
          Math.pow(
            1024,
            index
          )
        ).toFixed(2)
      ) +
      " " +
      units[index]
    );

  };


  // ==========================================================
  // CLEAR FILE
  // ==========================================================

  const handleRemoveFile = () => {

    setSelectedFile(null);
    setError("");
    setMessage("");
    setUploadedDocument(null);
    setUploadProgress(0);


    if (
      fileInputRef.current
    ) {

      fileInputRef.current.value =
        "";

    }

  };


  // ==========================================================
  // UPLOAD DOCUMENT
  // ==========================================================

  const handleUpload = async (
    event
  ) => {

    event.preventDefault();


    // ========================================================
    // RESET
    // ========================================================

    setError("");
    setMessage("");
    setUploadedDocument(null);
    setUploadProgress(0);


    // ========================================================
    // FILE REQUIRED
    // ========================================================

    if (!selectedFile) {

      setError(
        "Please select a document first."
      );

      return;
    }


    // ========================================================
    // CREATE FORMDATA
    // ========================================================

    const formData =
      new FormData();


    // ========================================================
    // IMPORTANT
    // ========================================================
    //
    // Backend expects:
    //
    // upload.single("document")
    //
    // Therefore:
    //
    // formData.append("document", selectedFile)
    //
    // ========================================================

    formData.append(
      "document",
      selectedFile
    );


    // ========================================================
    // CATEGORY
    // ========================================================

    formData.append(
      "category",
      category
    );


    // ========================================================
    // DESCRIPTION
    // ========================================================

    if (
      description.trim()
    ) {

      formData.append(
        "description",
        description.trim()
      );

    }


    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
      "Uploading document:"
    );

    console.log(
      "File name:",
      selectedFile.name
    );

    console.log(
      "File type:",
      selectedFile.type
    );

    console.log(
      "File size:",
      selectedFile.size
    );

    console.log(
      "Category:",
      category
    );


    // ========================================================
    // UPLOAD
    // ========================================================

    try {

      setIsUploading(
        true
      );


      /*
      |--------------------------------------------------------------------------
      | IMPORTANT FIX
      |--------------------------------------------------------------------------
      |
      | Use authenticated api instance instead of direct axios.
      |
      | api.js automatically adds:
      |
      | Authorization: Bearer <JWT>
      |
      |--------------------------------------------------------------------------
      */

      const response =
        await api.post(
          "/documents/upload",
          formData,
          {
            /*
            |--------------------------------------------------------------------------
            | DO NOT manually set Content-Type.
            |--------------------------------------------------------------------------
            |
            | Axios/browser will automatically create the correct multipart
            | boundary for FormData.
            |
            |--------------------------------------------------------------------------
            */

            onUploadProgress:
              (progressEvent) => {

                if (
                  progressEvent.total
                ) {

                  const progress =
                    Math.round(
                      (
                        progressEvent.loaded /
                        progressEvent.total
                      ) *
                      100
                    );

                  setUploadProgress(
                    progress
                  );

                }

              }

          }
        );


      // ======================================================
      // RESPONSE
      // ======================================================

      console.log(
        "Upload response:",
        response.data
      );


      if (
        response.data?.success
      ) {

        setMessage(
          response.data.message ||
          "Document uploaded successfully."
        );


        setUploadedDocument(
          response.data.document ||
          null
        );


        setUploadProgress(
          100
        );


        // ====================================================
        // CLEAR FORM AFTER SUCCESS
        // ====================================================

        setSelectedFile(
          null
        );

        setDescription(
          ""
        );

        setCategory(
          "Other"
        );


        if (
          fileInputRef.current
        ) {

          fileInputRef.current.value =
            "";

        }

      } else {

        setError(
          response.data?.message ||
          "Document upload failed."
        );

      }

    } catch (uploadError) {

      // ======================================================
      // ERROR LOG
      // ======================================================

      console.error(
        "Upload error:",
        uploadError
      );


      console.error(
        "Upload response:",
        uploadError?.response?.data
      );


      // ======================================================
      // BACKEND MESSAGE
      // ======================================================

      const backendMessage =
        uploadError
          ?.response
          ?.data
          ?.message;


      const backendError =
        uploadError
          ?.response
          ?.data
          ?.error;


      // ======================================================
      // MULTER ERROR
      // ======================================================

      if (
        uploadError
          ?.response
          ?.data
          ?.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {

        setError(
          "Upload field mismatch. The backend expects the file field named 'document'."
        );

      }


      // ======================================================
      // 400
      // ======================================================

      else if (
        uploadError
          ?.response
          ?.status ===
        400
      ) {

        setError(
          backendMessage ||
          "Invalid upload request."
        );

      }


      // ======================================================
      // 401
      // ======================================================

      else if (
        uploadError
          ?.response
          ?.status ===
        401
      ) {

        setError(
          "Your session has expired. Please login again."
        );

      }


      // ======================================================
      // 413
      // ======================================================

      else if (
        uploadError
          ?.response
          ?.status ===
        413
      ) {

        setError(
          "File is too large. Please upload a smaller file."
        );

      }


      // ======================================================
      // 500
      // ======================================================

      else if (
        uploadError
          ?.response
          ?.status ===
        500
      ) {

        setError(
          backendMessage ||
          "Server error while uploading the document."
        );

      }


      // ======================================================
      // NETWORK ERROR
      // ======================================================

      else if (
        uploadError
          ?.code ===
        "ERR_NETWORK"
      ) {

        setError(
          "Cannot connect to LifeVault AI server. Make sure backend is running on port 5000."
        );

      }


      // ======================================================
      // GENERAL ERROR
      // ======================================================

      else {

        setError(
          backendMessage ||
          backendError ||
          "Document upload failed. Please try again."
        );

      }

    } finally {

      setIsUploading(
        false
      );

    }

  };


  // ==========================================================
  // OPEN FILE SELECTOR
  // ==========================================================

  const openFileSelector = () => {

    if (
      isUploading
    ) {

      return;

    }


    fileInputRef.current?.click();

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{
        minHeight:
          "100vh",

        padding:
          "40px 20px",

        boxSizing:
          "border-box",

        background:
          "#f7f9fc"
      }}
    >

      <div
        style={{
          maxWidth:
            "800px",

          margin:
            "0 auto",

          background:
            "#ffffff",

          borderRadius:
            "16px",

          padding:
            "32px",

          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)"
        }}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            marginBottom:
              "28px"
          }}
        >

          <h1
            style={{
              margin:
                "0 0 8px",

              fontSize:
                "30px",

              fontWeight:
                "700"
            }}
          >
            Upload Document
          </h1>


          <p
            style={{
              margin:
                "0",

              color:
                "#667085",

              fontSize:
                "15px"
            }}
          >
            Upload your personal documents and let LifeVault AI
            understand, organize and analyze them.
          </p>

        </div>


        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}

        {message && (

          <div
            style={{
              marginBottom:
                "20px",

              padding:
                "14px 16px",

              borderRadius:
                "10px",

              background:
                "#ecfdf3",

              color:
                "#027a48",

              border:
                "1px solid #abefc6",

              fontSize:
                "14px"
            }}
          >
            {message}
          </div>

        )}


        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}

        {error && (

          <div
            style={{
              marginBottom:
                "20px",

              padding:
                "14px 16px",

              borderRadius:
                "10px",

              background:
                "#fef3f2",

              color:
                "#b42318",

              border:
                "1px solid #fecdca",

              fontSize:
                "14px"
            }}
          >
            {error}
          </div>

        )}


        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={
            handleUpload
          }
        >

          {/* ==================================================
              FILE
          ================================================== */}

          <div
            style={{
              marginBottom:
                "24px"
            }}
          >

            <label
              style={{
                display:
                  "block",

                marginBottom:
                  "8px",

                fontWeight:
                  "600",

                fontSize:
                  "14px"
              }}
            >
              Document
            </label>


            <input
              ref={
                fileInputRef
              }

              type="file"

              accept="
                .pdf,
                .jpg,
                .jpeg,
                .png,
                .doc,
                .docx
              "

              onChange={
                handleFileChange
              }

              disabled={
                isUploading
              }

              style={{
                display:
                  "none"
              }}
            />


            <div
              onClick={
                openFileSelector
              }

              style={{
                border:
                  "2px dashed #d0d5dd",

                borderRadius:
                  "14px",

                padding:
                  "35px 20px",

                textAlign:
                  "center",

                cursor:
                  isUploading
                    ? "not-allowed"
                    : "pointer",

                background:
                  "#fafafa"
              }}
            >

              <div
                style={{
                  fontSize:
                    "40px",

                  marginBottom:
                    "10px"
                }}
              >
                📄
              </div>


              <div
                style={{
                  fontWeight:
                    "600",

                  marginBottom:
                    "6px"
                }}
              >
                Click to select a document
              </div>


              <div
                style={{
                  color:
                    "#667085",

                  fontSize:
                    "13px"
                }}
              >
                PDF, JPG, PNG, DOC or DOCX
                <br />
                Maximum size: 10 MB
              </div>

            </div>


            {/* ==============================================
                SELECTED FILE
            ============================================== */}

            {selectedFile && (

              <div
                style={{
                  marginTop:
                    "14px",

                  padding:
                    "14px",

                  border:
                    "1px solid #e4e7ec",

                  borderRadius:
                    "10px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "space-between",

                  gap:
                    "15px"
                }}
              >

                <div
                  style={{
                    minWidth:
                      "0"
                  }}
                >

                  <div
                    style={{
                      fontWeight:
                        "600",

                      fontSize:
                        "14px",

                      overflow:
                        "hidden",

                      textOverflow:
                        "ellipsis",

                      whiteSpace:
                        "nowrap"
                    }}
                  >
                    {selectedFile.name}
                  </div>


                  <div
                    style={{
                      marginTop:
                        "4px",

                      color:
                        "#667085",

                      fontSize:
                        "12px"
                    }}
                  >
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </div>

                </div>


                <button
                  type="button"

                  onClick={
                    handleRemoveFile
                  }

                  disabled={
                    isUploading
                  }

                  style={{
                    border:
                      "none",

                    background:
                      "transparent",

                    color:
                      "#d92d20",

                    cursor:
                      "pointer",

                    fontWeight:
                      "600"
                  }}
                >
                  Remove
                </button>

              </div>

            )}

          </div>


          {/* ==================================================
              CATEGORY
          ================================================== */}

          <div
            style={{
              marginBottom:
                "24px"
            }}
          >

            <label
              htmlFor="category"
              style={{
                display:
                  "block",

                marginBottom:
                  "8px",

                fontWeight:
                  "600",

                fontSize:
                  "14px"
              }}
            >
              Category
            </label>


            <select
              id="category"

              value={
                category
              }

              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }

              disabled={
                isUploading
              }

              style={{
                width:
                  "100%",

                padding:
                  "12px 14px",

                border:
                  "1px solid #d0d5dd",

                borderRadius:
                  "10px",

                fontSize:
                  "14px",

                background:
                  "#ffffff",

                outline:
                  "none"
              }}
            >

              {categories.map(
                (item) => (

                  <option
                    key={
                      item
                    }

                    value={
                      item
                    }
                  >
                    {item}
                  </option>

                )
              )}

            </select>

          </div>


          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <div
            style={{
              marginBottom:
                "24px"
            }}
          >

            <label
              htmlFor="description"
              style={{
                display:
                  "block",

                marginBottom:
                  "8px",

                fontWeight:
                  "600",

                fontSize:
                  "14px"
              }}
            >
              Description

              <span
                style={{
                  color:
                    "#98a2b3",

                  fontWeight:
                    "400",

                  marginLeft:
                    "5px"
                }}
              >
                Optional
              </span>

            </label>


            <textarea
              id="description"

              value={
                description
              }

              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }

              disabled={
                isUploading
              }

              placeholder="Add a short description about this document..."

              rows={
                4
              }

              style={{
                width:
                  "100%",

                padding:
                  "12px 14px",

                border:
                  "1px solid #d0d5dd",

                borderRadius:
                  "10px",

                fontSize:
                  "14px",

                resize:
                  "vertical",

                boxSizing:
                  "border-box",

                outline:
                  "none"
              }}
            />

          </div>


          {/* ==================================================
              UPLOAD PROGRESS
          ================================================== */}

          {isUploading && (

            <div
              style={{
                marginBottom:
                  "20px"
              }}
            >

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  marginBottom:
                    "7px",

                  fontSize:
                    "13px",

                  color:
                    "#475467"
                }}
              >

                <span>
                  Uploading document...
                </span>

                <span>
                  {uploadProgress}%
                </span>

              </div>


              <div
                style={{
                  width:
                    "100%",

                  height:
                    "8px",

                  background:
                    "#eaecf0",

                  borderRadius:
                    "20px",

                  overflow:
                    "hidden"
                }}
              >

                <div
                  style={{
                    width:
                      `${uploadProgress}%`,

                    height:
                      "100%",

                    background:
                      "#6941c6",

                    transition:
                      "width 0.2s ease"
                  }}
                />

              </div>

            </div>

          )}


          {/* ==================================================
              SUBMIT
          ================================================== */}

          <button
            type="submit"

            disabled={
              isUploading ||
              !selectedFile
            }

            style={{
              width:
                "100%",

              padding:
                "14px 20px",

              border:
                "none",

              borderRadius:
                "10px",

              background:
                isUploading ||
                !selectedFile
                  ? "#98a2b3"
                  : "#6941c6",

              color:
                "#ffffff",

              fontSize:
                "15px",

              fontWeight:
                "600",

              cursor:
                isUploading ||
                !selectedFile
                  ? "not-allowed"
                  : "pointer",

              transition:
                "0.2s ease"
            }}
          >

            {isUploading
              ? "Uploading & Analyzing..."
              : "Upload Document"}

          </button>

        </form>


        {/* ==================================================
            AI RESULT
        ================================================== */}

        {uploadedDocument && (

          <div
            style={{
              marginTop:
                "30px",

              padding:
                "20px",

              border:
                "1px solid #e4e7ec",

              borderRadius:
                "12px",

              background:
                "#fcfcfd"
            }}
          >

            <h2
              style={{
                margin:
                  "0 0 15px",

                fontSize:
                  "18px"
              }}
            >
              AI Analysis
            </h2>


            {uploadedDocument.originalName && (

              <div
                style={{
                  marginBottom:
                    "10px",

                  fontSize:
                    "14px"
                }}
              >

                <strong>
                  Document:
                </strong>{" "}

                {
                  uploadedDocument.originalName
                }

              </div>

            )}


            {uploadedDocument.category && (

              <div
                style={{
                  marginBottom:
                    "10px",

                  fontSize:
                    "14px"
                }}
              >

                <strong>
                  Category:
                </strong>{" "}

                {
                  uploadedDocument.category
                }

              </div>

            )}


            {uploadedDocument.documentType && (

              <div
                style={{
                  marginBottom:
                    "10px",

                  fontSize:
                    "14px"
                }}
              >

                <strong>
                  Document Type:
                </strong>{" "}

                {
                  uploadedDocument.documentType
                }

              </div>

            )}


            {uploadedDocument.aiSummary && (

              <div
                style={{
                  marginBottom:
                    "10px",

                  fontSize:
                    "14px",

                  lineHeight:
                    "1.6"
                }}
              >

                <strong>
                  Summary:
                </strong>{" "}

                {
                  uploadedDocument.aiSummary
                }

              </div>

            )}


            {uploadedDocument.expiryDate && (

              <div
                style={{
                  fontSize:
                    "14px"
                }}
              >

                <strong>
                  Expiry Date:
                </strong>{" "}

                {
                  new Date(
                    uploadedDocument.expiryDate
                  ).toLocaleDateString()
                }

              </div>

            )}

          </div>

        )}

      </div>

    </div>

  );

};


// ============================================================
// EXPORT
// ============================================================

export default UploadDocument;