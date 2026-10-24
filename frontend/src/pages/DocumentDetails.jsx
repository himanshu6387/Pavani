import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import "../styles/DocumentDetails.css";

import axios from "axios";


// ============================================================
// API BASE URL
// ============================================================

const API_BASE_URL =
  "http://localhost:5000/api";


// ============================================================
// DOCUMENT DETAIL
// ============================================================

const DocumentDetail = () => {

  // ==========================================================
  // ROUTER
  // ==========================================================

  const { id } = useParams();

  const navigate =
    useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    documentData,
    setDocumentData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    question,
    setQuestion,
  ] = useState("");

  const [
    answer,
    setAnswer,
  ] = useState("");

  const [
    sources,
    setSources,
  ] = useState([]);

  const [
    askingAI,
    setAskingAI,
  ] = useState(false);

  const [
    openingDocument,
    setOpeningDocument,
  ] = useState(false);

  const [
    downloadingDocument,
    setDownloadingDocument,
  ] = useState(false);

  const [
    deletingDocument,
    setDeletingDocument,
  ] = useState(false);

  const [
    reanalyzing,
    setReanalyzing,
  ] = useState(false);


  // ==========================================================
  // AUTH TOKEN
  // ==========================================================

  const getToken = () => {

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("accessToken")
    );

  };


  // ==========================================================
  // AUTH HEADERS
  // ==========================================================

  const getAuthHeaders = () => {

    const token =
      getToken();

    if (!token) {
      return {};
    }

    return {
      Authorization:
        `Bearer ${token}`,
    };

  };


  // ==========================================================
  // FETCH DOCUMENT
  // ==========================================================

  const fetchDocument = async () => {

    try {

      setLoading(true);
      setError("");

      if (!id) {

        setError(
          "Document ID is missing."
        );

        return;
      }


      const response =
        await axios.get(
          `${API_BASE_URL}/documents/${id}`,
          {
            headers:
              getAuthHeaders(),
          }
        );


      if (
        response.data &&
        response.data.success
      ) {

        setDocumentData(
          response.data.document
        );

      } else {

        setError(
          response.data?.message ||
          "Unable to load document."
        );

      }

    } catch (err) {

      console.error(
        "Get document error:",
        err
      );


      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "accessToken"
        );

        sessionStorage.removeItem(
          "token"
        );

        sessionStorage.removeItem(
          "accessToken"
        );

        navigate("/login");

        return;
      }


      if (
        err.response?.status === 404
      ) {

        setError(
          "Document not found."
        );

        return;
      }


      setError(
        err.response?.data?.message ||
        "Failed to load document."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    fetchDocument();

  }, [id]);


  // ==========================================================
  // OPEN DOCUMENT
  // ==========================================================

  const handleOpenDocument =
    async () => {

      try {

        setOpeningDocument(true);

        const token =
          getToken();


        const response =
          await axios.get(
            `${API_BASE_URL}/documents/${id}/file`,
            {
              headers: {
                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),
              },

              responseType:
                "blob",
            }
          );


        const contentType =
          response.headers[
            "content-type"
          ] ||
          documentData?.mimeType ||
          "application/octet-stream";


        const blob =
          new Blob(
            [response.data],
            {
              type:
                contentType,
            }
          );


        const fileUrl =
          window.URL.createObjectURL(
            blob
          );


        const newWindow =
          window.open(
            fileUrl,
            "_blank"
          );


        if (!newWindow) {

          alert(
            "Please allow pop-ups to open the document."
          );

        }


        setTimeout(() => {

          window.URL.revokeObjectURL(
            fileUrl
          );

        }, 60000);

      } catch (err) {

        console.error(
          "Open document error:",
          err
        );

        alert(
          err.response?.data?.message ||
          "Unable to open document."
        );

      } finally {

        setOpeningDocument(false);

      }

    };


  // ==========================================================
  // DOWNLOAD DOCUMENT
  // ==========================================================

  const handleDownloadDocument =
    async () => {

      try {

        setDownloadingDocument(
          true
        );


        const response =
          await axios.get(
            `${API_BASE_URL}/documents/${id}/file`,
            {
              headers:
                getAuthHeaders(),

              responseType:
                "blob",
            }
          );


        const contentType =
          response.headers[
            "content-type"
          ] ||
          documentData?.mimeType ||
          "application/octet-stream";


        const blob =
          new Blob(
            [response.data],
            {
              type:
                contentType,
            }
          );


        const fileUrl =
          window.URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          fileUrl;


        link.download =
          documentData?.originalName ||
          documentData?.storedName ||
          "document";


        document.body.appendChild(
          link
        );


        link.click();

        link.remove();


        window.URL.revokeObjectURL(
          fileUrl
        );

      } catch (err) {

        console.error(
          "Download document error:",
          err
        );

        alert(
          err.response?.data?.message ||
          "Unable to download document."
        );

      } finally {

        setDownloadingDocument(
          false
        );

      }

    };


  // ==========================================================
  // ASK LIFEVAULT AI
  // ==========================================================

  const handleAskAI = async () => {

    try {

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (
        !question ||
        !question.trim()
      ) {

        setAnswer(
          "Please enter a question."
        );

        return;
      }


      if (!id) {

        setAnswer(
          "Document ID is missing."
        );

        return;
      }


      // --------------------------------------------------------
      // LOADING
      // --------------------------------------------------------

      setAskingAI(true);

      setAnswer("");

      setSources([]);


      const token =
        getToken();


      // --------------------------------------------------------
      // CORRECT DOCUMENT AI ENDPOINT
      // --------------------------------------------------------

      const askUrl =
        `${API_BASE_URL}/ask/document/${id}`;


      console.log(
        "================================================"
      );

      console.log(
        "ASK LIFEVAULT AI"
      );

      console.log(
        "Document ID:",
        id
      );

      console.log(
        "Question:",
        question.trim()
      );

      console.log(
        "Request URL:",
        askUrl
      );

      console.log(
        "================================================"
      );


      // --------------------------------------------------------
      // API REQUEST
      // --------------------------------------------------------

      const response =
        await axios.post(

          askUrl,

          {
            question:
              question.trim(),
          },

          {
            headers: {

              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },
          }

        );


      console.log(
        "Ask AI response:",
        response.data
      );


      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      if (
        response.data?.success
      ) {

        const aiAnswer =
          response.data?.answer ||
          response.data?.data?.answer ||
          response.data?.result?.answer ||
          "";


        setAnswer(
          aiAnswer ||
          "LifeVault AI could not generate an answer."
        );


        const responseSources =
          response.data?.sources ||
          response.data?.data?.sources ||
          [];


        setSources(
          Array.isArray(
            responseSources
          )
            ? responseSources
            : []
        );

      } else {

        setAnswer(
          response.data?.message ||
          "I couldn't find that information in your document."
        );

      }

    } catch (err) {

      console.error(
        "Ask AI error:",
        err
      );


      console.error(
        "Ask AI status:",
        err.response?.status
      );


      console.error(
        "Ask AI response:",
        err.response?.data
      );


      // --------------------------------------------------------
      // UNAUTHORIZED
      // --------------------------------------------------------

      if (
        err.response?.status === 401
      ) {

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "accessToken"
        );

        sessionStorage.removeItem(
          "token"
        );

        sessionStorage.removeItem(
          "accessToken"
        );

        navigate(
          "/login"
        );

        return;
      }


      // --------------------------------------------------------
      // NOT FOUND
      // --------------------------------------------------------

      if (
        err.response?.status === 404
      ) {

        setAnswer(
          "Document AI endpoint was not found. Please restart the backend server."
        );

        return;
      }


      // --------------------------------------------------------
      // BAD REQUEST
      // --------------------------------------------------------

      if (
        err.response?.status === 400
      ) {

        setAnswer(
          err.response?.data?.message ||
          "Unable to process this document."
        );

        return;
      }


      // --------------------------------------------------------
      // SERVER ERROR
      // --------------------------------------------------------

      if (
        err.response?.status === 500
      ) {

        setAnswer(
          err.response?.data?.message ||
          "LifeVault AI is temporarily unavailable."
        );

        return;
      }


      setAnswer(
        err.response?.data?.message ||
        "Unable to get an answer from LifeVault AI."
      );

    } finally {

      setAskingAI(false);

    }

  };


  // ==========================================================
  // ENTER KEY FOR ASK AI
  // ==========================================================

  const handleQuestionKeyDown =
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        handleAskAI();

      }

    };


  // ==========================================================
  // RE-ANALYZE DOCUMENT
  // ==========================================================

  const handleReanalyze =
    async () => {

      try {

        setReanalyzing(true);


        const response =
          await axios.post(
            `${API_BASE_URL}/documents/${id}/reanalyze`,
            {},
            {
              headers:
                getAuthHeaders(),
            }
          );


        if (
          response.data?.success
        ) {

          setDocumentData(
            response.data.document
          );


          alert(
            "Document re-analyzed successfully."
          );

        } else {

          alert(
            response.data?.message ||
            "Re-analysis failed."
          );

        }

      } catch (err) {

        console.error(
          "Re-analyze error:",
          err
        );

        alert(
          err.response?.data?.message ||
          "Unable to re-analyze document."
        );

      } finally {

        setReanalyzing(false);

      }

    };


  // ==========================================================
  // DELETE DOCUMENT
  // ==========================================================

  const handleDeleteDocument =
    async () => {

      try {

        const confirmed =
          window.confirm(
            "Are you sure you want to delete this document?"
          );


        if (!confirmed) {
          return;
        }


        setDeletingDocument(
          true
        );


        const response =
          await axios.delete(
            `${API_BASE_URL}/documents/${id}`,
            {
              headers:
                getAuthHeaders(),
            }
          );


        if (
          response.data?.success
        ) {

          alert(
            "Document deleted successfully."
          );


          navigate(
            "/dashboard"
          );

        } else {

          alert(
            response.data?.message ||
            "Unable to delete document."
          );

        }

      } catch (err) {

        console.error(
          "Delete document error:",
          err
        );

        alert(
          err.response?.data?.message ||
          "Unable to delete document."
        );

      } finally {

        setDeletingDocument(
          false
        );

      }

    };


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate =
    (date) => {

      if (!date) {
        return "Not available";
      }


      const parsedDate =
        new Date(date);


      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {

        return "Not available";

      }


      return parsedDate.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    };


  // ==========================================================
  // FORMAT FILE SIZE
  // ==========================================================

  const formatFileSize =
    (bytes) => {

      if (
        !bytes ||
        bytes <= 0
      ) {

        return "0 KB";

      }


      if (
        bytes < 1024
      ) {

        return `${bytes} B`;

      }


      if (
        bytes < 1024 * 1024
      ) {

        return `${(
          bytes / 1024
        ).toFixed(1)} KB`;

      }


      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(2)} MB`;

    };


  // ==========================================================
  // IMPORTANT INFORMATION
  // ==========================================================

  const getImportantInformation =
    () => {

      if (
        !documentData?.keyInformation
      ) {

        return [];

      }


      if (
        Array.isArray(
          documentData.keyInformation
        )
      ) {

        return (
          documentData.keyInformation
        );

      }


      if (
        typeof documentData.keyInformation ===
        "object"
      ) {

        return Object.entries(
          documentData.keyInformation
        ).map(
          ([label, value]) => ({

            label,

            value:
              typeof value === "string"
                ? value
                : JSON.stringify(
                    value
                  ),

          })
        );

      }


      return [];

    };


  // ==========================================================
  // LOADING UI
  // ==========================================================

  if (loading) {

    return (

      <div
        style={{
          minHeight:
            "100vh",

          background:
            "#f5f7fb",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          padding:
            "40px",
        }}
      >

        <div
          style={{
            background:
              "#fff",

            padding:
              "40px",

            borderRadius:
              "16px",

            textAlign:
              "center",

            boxShadow:
              "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >

          <h2>
            Loading document...
          </h2>

          <p>
            LifeVault AI is loading your document.
          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // ERROR UI
  // ==========================================================

  if (
    error ||
    !documentData
  ) {

    return (

      <div
        style={{
          minHeight:
            "100vh",

          background:
            "#f5f7fb",

          padding:
            "50px",
        }}
      >

        <div
          style={{
            maxWidth:
              "800px",

            margin:
              "0 auto",

            background:
              "#fff",

            padding:
              "40px",

            borderRadius:
              "16px",
          }}
        >

          <h2>
            Unable to load document
          </h2>

          <p>
            {error ||
              "Document not found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
            style={{
              padding:
                "12px 20px",

              border:
                "none",

              borderRadius:
                "8px",

              background:
                "#111827",

              color:
                "#fff",

              cursor:
                "pointer",
            }}
          >
            Back to Dashboard
          </button>

        </div>

      </div>

    );

  }


  // ==========================================================
  // IMPORTANT DATA
  // ==========================================================

  const importantInformation =
    getImportantInformation();


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{
        minHeight:
          "100vh",

        background:
          "#f5f7fb",

        padding:
          "30px 20px 60px",
      }}
    >

      <div
        style={{
          maxWidth:
            "1320px",

          margin:
            "0 auto",
        }}
      >

        {/* ==================================================
            BACK
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
          style={{
            border:
              "none",

            background:
              "transparent",

            cursor:
              "pointer",

            fontWeight:
              "600",

            marginBottom:
              "20px",
          }}
        >
          ← Back to Dashboard
        </button>


        {/* ==================================================
            DOCUMENT HEADER
        ================================================== */}

        <div
          style={{
            background:
              "#fff",

            borderRadius:
              "18px",

            padding:
              "28px",

            marginBottom:
              "24px",

            boxShadow:
              "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >

          <div
            style={{
              display:
                "flex",

              gap:
                "20px",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              flexWrap:
                "wrap",
            }}
          >

            <div
              style={{
                display:
                  "flex",

                gap:
                  "18px",

                alignItems:
                  "center",
              }}
            >

              <div
                style={{
                  width:
                    "64px",

                  height:
                    "64px",

                  borderRadius:
                    "14px",

                  background:
                    "#111827",

                  color:
                    "#fff",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  fontWeight:
                    "700",
                }}
              >
                DOC
              </div>


              <div>

                <div
                  style={{
                    fontSize:
                      "12px",

                    fontWeight:
                      "700",

                    letterSpacing:
                      "2px",

                    color:
                      "#718096",
                  }}
                >
                  DOCUMENT
                </div>


                <h1
                  style={{
                    margin:
                      "6px 0 10px",

                    fontSize:
                      "28px",

                    wordBreak:
                      "break-word",
                  }}
                >
                  {documentData.originalName}
                </h1>


                <div
                  style={{
                    display:
                      "flex",

                    gap:
                      "8px",

                    flexWrap:
                      "wrap",
                  }}
                >

                  <span
                    style={{
                      background:
                        "#f1f5f9",

                      padding:
                        "6px 10px",

                      borderRadius:
                        "20px",

                      fontSize:
                        "13px",
                    }}
                  >
                    {documentData.category ||
                      "Other"}
                  </span>


                  <span
                    style={{
                      background:
                        "#f1f5f9",

                      padding:
                        "6px 10px",

                      borderRadius:
                        "20px",

                      fontSize:
                        "13px",
                    }}
                  >
                    {documentData.mimeType ||
                      "Unknown type"}
                  </span>


                  <span
                    style={{
                      background:
                        "#f1f5f9",

                      padding:
                        "6px 10px",

                      borderRadius:
                        "20px",

                      fontSize:
                        "13px",
                    }}
                  >
                    {formatFileSize(
                      documentData.size
                    )}
                  </span>

                </div>

              </div>

            </div>


            {/* DOCUMENT ACTIONS */}

            <div
              style={{
                display:
                  "flex",

                gap:
                  "10px",

                flexWrap:
                  "wrap",
              }}
            >

              <button
                type="button"
                onClick={
                  handleOpenDocument
                }
                disabled={
                  openingDocument
                }
                style={{
                  padding:
                    "11px 18px",

                  borderRadius:
                    "9px",

                  border:
                    "none",

                  background:
                    "#111827",

                  color:
                    "#fff",

                  cursor:
                    openingDocument
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    openingDocument
                      ? 0.7
                      : 1,

                  fontWeight:
                    "600",
                }}
              >
                {openingDocument
                  ? "Opening..."
                  : "Open Document"}
              </button>


              <button
                type="button"
                onClick={
                  handleDownloadDocument
                }
                disabled={
                  downloadingDocument
                }
                style={{
                  padding:
                    "11px 18px",

                  borderRadius:
                    "9px",

                  border:
                    "1px solid #d1d5db",

                  background:
                    "#fff",

                  cursor:
                    downloadingDocument
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    downloadingDocument
                      ? 0.7
                      : 1,

                  fontWeight:
                    "600",
                }}
              >
                {downloadingDocument
                  ? "Downloading..."
                  : "Download"}
              </button>


              <button
                type="button"
                onClick={
                  handleDeleteDocument
                }
                disabled={
                  deletingDocument
                }
                style={{
                  padding:
                    "11px 18px",

                  borderRadius:
                    "9px",

                  border:
                    "1px solid #fecaca",

                  background:
                    "#fff",

                  color:
                    "#dc2626",

                  cursor:
                    deletingDocument
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    deletingDocument
                      ? 0.7
                      : 1,

                  fontWeight:
                    "600",
                }}
              >
                {deletingDocument
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>


        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "minmax(0, 1fr) 320px",

            gap:
              "24px",
          }}
        >

          {/* ==================================================
              LEFT COLUMN
          ================================================== */}

          <div>

            {/* ==================================================
                AI SUMMARY
            ================================================== */}

            <div
              style={{
                background:
                  "#fff",

                borderRadius:
                  "18px",

                padding:
                  "28px",

                marginBottom:
                  "24px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "2px",

                  color:
                    "#718096",
                }}
              >
                LIFEVAULT AI
              </div>

              <h2>
                AI Summary
              </h2>

              <div
                style={{
                  background:
                    "#f8fafc",

                  padding:
                    "18px",

                  borderRadius:
                    "12px",

                  lineHeight:
                    "1.7",

                  whiteSpace:
                    "pre-wrap",
                }}
              >
                {documentData.aiSummary ||
                  "AI summary is not available yet."}
              </div>

            </div>


            {/* ==================================================
                IMPORTANT INFORMATION
            ================================================== */}

            <div
              style={{
                background:
                  "#fff",

                borderRadius:
                  "18px",

                padding:
                  "28px",

                marginBottom:
                  "24px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "2px",

                  color:
                    "#718096",
                }}
              >
                AI EXTRACTED
              </div>

              <h2>
                Important Information
              </h2>


              {importantInformation.length === 0 ? (

                <div
                  style={{
                    background:
                      "#f8fafc",

                    padding:
                      "18px",

                    borderRadius:
                      "12px",

                    color:
                      "#64748b",
                  }}
                >
                  No important information extracted yet.
                </div>

              ) : (

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(240px, 1fr))",

                    gap:
                      "14px",
                  }}
                >

                  {importantInformation.map(
                    (item, index) => (

                      <div
                        key={index}
                        style={{
                          background:
                            "#f8fafc",

                          padding:
                            "16px",

                          borderRadius:
                            "12px",
                        }}
                      >

                        <div
                          style={{
                            fontSize:
                              "12px",

                            color:
                              "#718096",

                            fontWeight:
                              "600",

                            marginBottom:
                              "7px",
                          }}
                        >
                          {item.label ||
                            "Information"}
                        </div>


                        <div
                          style={{
                            fontWeight:
                              "600",

                            wordBreak:
                              "break-word",
                          }}
                        >
                          {item.value ||
                            "Not available"}
                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            {/* ==================================================
                ASK LIFEVAULT
            ================================================== */}

            <div
              style={{
                background:
                  "#fff",

                borderRadius:
                  "18px",

                padding:
                  "28px",

                marginBottom:
                  "24px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "2px",

                  color:
                    "#718096",
                }}
              >
                ASK LIFEVAULT
              </div>


              <h2>
                Ask about this document
              </h2>


              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "10px",

                  alignItems:
                    "stretch",
                }}
              >

                <textarea
                  value={question}
                  onChange={(event) =>
                    setQuestion(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleQuestionKeyDown
                  }
                  placeholder="Ask something about this document..."
                  rows={2}
                  style={{
                    flex:
                      "1",

                    resize:
                      "vertical",

                    border:
                      "1px solid #cbd5e1",

                    borderRadius:
                      "10px",

                    padding:
                      "14px",

                    fontSize:
                      "15px",

                    outline:
                      "none",
                  }}
                />


                <button
                  type="button"
                  onClick={
                    handleAskAI
                  }
                  disabled={
                    askingAI ||
                    !question.trim()
                  }
                  style={{
                    minWidth:
                      "100px",

                    border:
                      "none",

                    borderRadius:
                      "10px",

                    background:
                      "#111827",

                    color:
                      "#fff",

                    fontWeight:
                      "600",

                    cursor:
                      askingAI ||
                      !question.trim()
                        ? "not-allowed"
                        : "pointer",

                    opacity:
                      askingAI ||
                      !question.trim()
                        ? 0.6
                        : 1,
                  }}
                >
                  {askingAI
                    ? "Asking..."
                    : "Ask AI"}
                </button>

              </div>


              {/* AI ANSWER */}

              {answer && (

                <div
                  style={{
                    marginTop:
                      "18px",

                    background:
                      "#f8fafc",

                    borderRadius:
                      "12px",

                    padding:
                      "20px",
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "12px",

                      fontWeight:
                        "700",

                      letterSpacing:
                        "2px",

                      color:
                        "#718096",

                      marginBottom:
                        "10px",
                    }}
                  >
                    AI ANSWER
                  </div>


                  <div
                    style={{
                      lineHeight:
                        "1.7",

                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {answer}
                  </div>


                  {/* SOURCES */}

                  {sources.length > 0 && (

                    <div
                      style={{
                        marginTop:
                          "18px",

                        paddingTop:
                          "16px",

                        borderTop:
                          "1px solid #e2e8f0",
                      }}
                    >

                      <strong>
                        Sources
                      </strong>


                      <div
                        style={{
                          marginTop:
                            "10px",
                        }}
                      >

                        {sources.map(
                          (
                            source,
                            index
                          ) => (

                            <div
                              key={index}
                              style={{
                                marginBottom:
                                  "10px",
                              }}
                            >

                              <div
                                style={{
                                  fontWeight:
                                    "600",
                                }}
                              >
                                {source.documentName ||
                                  source.name ||
                                  "Document"}
                              </div>


                              {source.reason && (

                                <div
                                  style={{
                                    color:
                                      "#64748b",

                                    fontSize:
                                      "14px",

                                    marginTop:
                                      "3px",
                                  }}
                                >
                                  {source.reason}
                                </div>

                              )}

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>


            {/* ==================================================
                EXTRACTED TEXT
            ================================================== */}

            <div
              style={{
                background:
                  "#fff",

                borderRadius:
                  "18px",

                padding:
                  "28px",

                marginBottom:
                  "24px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "2px",

                  color:
                    "#718096",
                }}
              >
                DOCUMENT CONTENT
              </div>


              <h2>
                Extracted Text
              </h2>


              <div
                style={{
                  background:
                    "#f8fafc",

                  borderRadius:
                    "12px",

                  padding:
                    "18px",

                  maxHeight:
                    "500px",

                  overflowY:
                    "auto",

                  whiteSpace:
                    "pre-wrap",

                  lineHeight:
                    "1.6",

                  color:
                    "#334155",
                }}
              >
                {documentData.extractedText ||
                  "No extracted text available."}
              </div>

            </div>


            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            {documentData.description && (

              <div
                style={{
                  background:
                    "#fff",

                  borderRadius:
                    "18px",

                  padding:
                    "28px",

                  marginBottom:
                    "24px",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "12px",

                    fontWeight:
                      "700",

                    letterSpacing:
                      "2px",

                    color:
                      "#718096",
                  }}
                >
                  DESCRIPTION
                </div>


                <h2>
                  About this document
                </h2>


                <p
                  style={{
                    lineHeight:
                      "1.7",

                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {documentData.description}
                </p>

              </div>

            )}

          </div>


          {/* ==================================================
              RIGHT SIDEBAR
          ================================================== */}

          <div>

            {/* ==================================================
                AI STATUS
            ================================================== */}

            <div
              style={{
                background:
                  "#fff",

                borderRadius:
                  "18px",

                padding:
                  "24px",

                marginBottom:
                  "20px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "2px",

                  color:
                    "#718096",
                }}
              >
                PROCESSING
              </div>


              <h3>
                AI Status
              </h3>


              <div
                style={{
                  background:
                    documentData.aiProcessingStatus ===
                    "completed"
                      ? "#ecfdf5"
                      : "#fff7ed",

                  color:
                    documentData.aiProcessingStatus ===
                    "completed"
                      ? "#047857"
                      : "#c2410c",

                  padding:
                    "12px",

                  borderRadius:
                    "10px",

                  textTransform:
                    "capitalize",
                }}
              >
                {documentData.aiProcessingStatus ||
                  "pending"}
              </div>


              <button
                type="button"
                onClick={
                  handleReanalyze
                }
                disabled={
                  reanalyzing
                }
                style={{
                  width:
                    "100%",

                  marginTop:
                    "14px",

                  padding:
                    "11px",

                  borderRadius:
                    "9px",

                  border:
                    "1px solid #d1d5db",

                  background:
                    "#fff",

                  cursor:
                    reanalyzing
                      ? "not-allowed"
                      : "pointer",

                  fontWeight:
                    "600",

                  opacity:
                    reanalyzing
                      ? 0.6
                      : 1,
                }}
              >
                {reanalyzing
                  ? "Analyzing..."
                  : "Re-analyze"}
              </button>

            </div>


            {/* ==================================================
                CATEGORY
            ================================================== */}

            <div
              style={{
                background:
                  "#fff",

                borderRadius:
                  "18px",

                padding:
                  "24px",

                marginBottom:
                  "20px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "2px",

                  color:
                    "#718096",
                }}
              >
                CATEGORY
              </div>


              <h3>
                Document type
              </h3>


              <div
                style={{
                  background:
                    "#f8fafc",

                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  fontWeight:
                    "600",
                }}
              >
                {documentData.documentType ||
                  documentData.category ||
                  "Other"}
              </div>

            </div>


            {/* ==================================================
                EXPIRY
            ================================================== */}

            <div
              style={{
                background:
                  "#fff",

                borderRadius:
                  "18px",

                padding:
                  "24px",

                marginBottom:
                  "20px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "2px",

                  color:
                    "#718096",
                }}
              >
                IMPORTANT DATE
              </div>


              <h3>
                Expiry
              </h3>


              <div
                style={{
                  background:
                    "#fff7ed",

                  padding:
                    "16px",

                  borderRadius:
                    "10px",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "11px",

                    color:
                      "#9a3412",

                    fontWeight:
                      "700",

                    letterSpacing:
                      "1px",
                  }}
                >
                  EXPIRY DATE
                </div>


                <div
                  style={{
                    marginTop:
                      "8px",

                    fontSize:
                      "18px",

                    fontWeight:
                      "700",
                  }}
                >
                  {formatDate(
                    documentData.expiryDate
                  )}
                </div>

              </div>

            </div>


            {/* ==================================================
                FILE INFORMATION
            ================================================== */}

            <div
              style={{
                background:
                  "#fff",

                borderRadius:
                  "18px",

                padding:
                  "24px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  letterSpacing:
                    "2px",

                  color:
                    "#718096",
                }}
              >
                FILE
              </div>


              <h3>
                File information
              </h3>


              {/* ORIGINAL NAME */}

              <div
                style={{
                  background:
                    "#f8fafc",

                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  marginBottom:
                    "10px",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "11px",

                    color:
                      "#718096",

                    fontWeight:
                      "700",
                  }}
                >
                  ORIGINAL NAME
                </div>


                <div
                  style={{
                    marginTop:
                      "6px",

                    wordBreak:
                      "break-word",

                    fontWeight:
                      "600",
                  }}
                >
                  {documentData.originalName}
                </div>

              </div>


              {/* FILE SIZE */}

              <div
                style={{
                  background:
                    "#f8fafc",

                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  marginBottom:
                    "10px",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "11px",

                    color:
                      "#718096",

                    fontWeight:
                      "700",
                  }}
                >
                  FILE SIZE
                </div>


                <div
                  style={{
                    marginTop:
                      "6px",

                    fontWeight:
                      "600",
                  }}
                >
                  {formatFileSize(
                    documentData.size
                  )}
                </div>

              </div>


              {/* UPLOADED */}

              <div
                style={{
                  background:
                    "#f8fafc",

                  padding:
                    "14px",

                  borderRadius:
                    "10px",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "11px",

                    color:
                      "#718096",

                    fontWeight:
                      "700",
                  }}
                >
                  UPLOADED
                </div>


                <div
                  style={{
                    marginTop:
                      "6px",

                    fontWeight:
                      "600",
                  }}
                >
                  {formatDate(
                    documentData.createdAt
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};


// ============================================================
// EXPORT
// ============================================================

export default DocumentDetail;