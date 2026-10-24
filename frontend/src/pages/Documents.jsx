import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Documents.css";
const Documents = () => {
  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD DOCUMENTS
  // GET /api/documents
  // ============================================================

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/documents");

      console.log("Documents response:", response.data);

      const documentList =
        response.data?.documents ||
        response.data?.data ||
        [];

      setDocuments(
        Array.isArray(documentList)
          ? documentList
          : []
      );
    } catch (err) {
      console.error(
        "Documents loading error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadDocuments();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "No date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "No date";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  // ============================================================
  // GET CATEGORY
  // ============================================================

  const getCategory = (document) => {
    if (!document) {
      return "Other";
    }

    return document.category || "Other";
  };

  // ============================================================
  // GET DOCUMENT NAME
  // ============================================================

  const getDocumentName = (document) => {
    if (!document) {
      return "Untitled document";
    }

    return (
      document.originalName ||
      document.name ||
      document.fileName ||
      document.storedName ||
      "Untitled document"
    );
  };

  // ============================================================
  // GET SUMMARY
  // ============================================================

  const getDocumentSummary = (document) => {
    if (!document) {
      return "AI summary is not available yet.";
    }

    return (
      document.aiSummary ||
      document.summary ||
      "AI summary is not available yet."
    );
  };

  // ============================================================
  // OPEN DOCUMENT
  // ============================================================

  const openDocument = (document) => {
    if (!document?._id) {
      console.error(
        "Cannot open document: missing document ID",
        document
      );

      return;
    }

    navigate(
      `/documents/${document._id}`
    );
  };

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading) {
    return (
      <main className="documents-page">

        <div className="documents-state">

          <p>
            Loading your documents...
          </p>

        </div>

      </main>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {
    return (
      <main className="documents-page">

        <div className="documents-state error">

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={loadDocuments}
          >
            Try again
          </button>

        </div>

      </main>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <main className="documents-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="documents-header">

        <div>

          <span className="section-eyebrow">
            YOUR PRIVATE VAULT
          </span>

          <h1>
            My Documents
          </h1>

          <p>
            All your important documents in one
            secure place.
          </p>

        </div>

        <button
          type="button"
          className="upload-document-button"
          onClick={() =>
            navigate("/documents/upload")
          }
        >
          + Add document
        </button>

      </div>

      {/* ======================================================
          DOCUMENT COUNT
      ====================================================== */}

      <div className="documents-count">

        {documents.length}{" "}

        {documents.length === 1
          ? "document"
          : "documents"}

      </div>

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {documents.length === 0 ? (

        <div className="documents-empty">

          <div className="empty-icon">
            +
          </div>

          <h2>
            Your vault is empty
          </h2>

          <p>
            Upload your first document to start
            building your LifeVault.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/documents/upload")
            }
          >
            Upload first document
          </button>

        </div>

      ) : (

        /* ====================================================
           DOCUMENT GRID
        ==================================================== */

        <div className="documents-grid">

          {documents.map((document) => {

            const documentName =
              getDocumentName(document);

            const category =
              getCategory(document);

            const summary =
              getDocumentSummary(document);

            const isAnalyzed =
              document.aiProcessed === true ||
              document.aiProcessingStatus ===
                "completed";

            return (

              <article
                className="document-card"
                key={
                  document._id ||
                  document.storedName ||
                  document.originalName
                }
                onClick={() =>
                  openDocument(document)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {

                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();

                    openDocument(document);
                  }

                }}
              >

                {/* ==================================================
                    CARD TOP
                ================================================== */}

                <div className="document-card-top">

                  <div className="document-icon">
                    DOC
                  </div>

                  <span
                    className={
                      isAnalyzed
                        ? "ai-status done"
                        : "ai-status pending"
                    }
                  >
                    {isAnalyzed
                      ? "AI analyzed"
                      : "Pending"}
                  </span>

                </div>

                {/* ==================================================
                    DOCUMENT NAME
                ================================================== */}

                <h2>
                  {documentName}
                </h2>

                {/* ==================================================
                    DOCUMENT META
                ================================================== */}

                <div className="document-card-meta">

                  <span>
                    {category}
                  </span>

                  <span>
                    {document.documentType ||
                      "Document"}
                  </span>

                </div>

                {/* ==================================================
                    AI SUMMARY
                ================================================== */}

                <p className="document-card-summary">

                  {summary}

                </p>

                {/* ==================================================
                    EXPIRY
                ================================================== */}

                {document.expiryDate && (

                  <div className="document-expiry">

                    <span>
                      Expiry
                    </span>

                    <strong>
                      {formatDate(
                        document.expiryDate
                      )}
                    </strong>

                  </div>

                )}

                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div className="document-card-footer">

                  <span>
                    Added{" "}
                    {formatDate(
                      document.createdAt
                    )}
                  </span>

                  <strong>
                    View →
                  </strong>

                </div>

              </article>

            );
          })}

        </div>

      )}

    </main>
  );
};

export default Documents;