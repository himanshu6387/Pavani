import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Expiry.css";
const Expiry = () => {
  const navigate = useNavigate();

  const [data, setData] = useState({
    counts: {
      total: 0,
      expired: 0,
      expiringSoon: 0,
      valid: 0,
      noExpiry: 0,
    },
    expired: [],
    expiringSoon: [],
    valid: [],
    noExpiry: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD EXPIRY DATA
  // ============================================================

  const loadExpiryData = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/documents/expiry");

      console.log(
        "Expiry response:",
        response.data
      );

      setData({
        counts:
          response.data?.counts || {
            total: 0,
            expired: 0,
            expiringSoon: 0,
            valid: 0,
            noExpiry: 0,
          },

        expired:
          response.data?.expired || [],

        expiringSoon:
          response.data?.expiringSoon || [],

        valid:
          response.data?.valid || [],

        noExpiry:
          response.data?.noExpiry || [],
      });

    } catch (err) {

      console.error(
        "Expiry loading error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to load expiry information."
      );

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadExpiryData();
  }, []);


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {

    if (!date) {
      return "No expiry date";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Invalid date";
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


  // ============================================================
  // DOCUMENT NAME
  // ============================================================

  const getDocumentName = (
    item
  ) => {

    const document =
      item?.document;

    return (
      document?.originalName ||
      document?.name ||
      document?.fileName ||
      "Untitled document"
    );
  };


  // ============================================================
  // OPEN DOCUMENT
  // ============================================================

  const openDocument = (
    item
  ) => {

    const document =
      item?.document;

    if (!document?._id) {
      return;
    }

    navigate(
      `/documents/${document._id}`
    );

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (
      <main className="expiry-page">

        <div className="documents-state">

          Loading expiry information...

        </div>

      </main>
    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (
      <main className="expiry-page">

        <div className="documents-state error">

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={loadExpiryData}
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
    <main className="expiry-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="documents-header">

        <div>

          <span className="section-eyebrow">
            DOCUMENT MONITORING
          </span>

          <h1>
            Expiry & Alerts
          </h1>

          <p>
            Keep track of documents that are
            expired or expiring soon.
          </p>

        </div>

        <button
          type="button"
          className="upload-document-button"
          onClick={() =>
            navigate("/documents")
          }
        >
          View documents
        </button>

      </div>


      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="expiry-stats">

        <div className="expiry-stat-card">

          <span>
            Total
          </span>

          <strong>
            {data.counts.total}
          </strong>

        </div>


        <div className="expiry-stat-card expired">

          <span>
            Expired
          </span>

          <strong>
            {data.counts.expired}
          </strong>

        </div>


        <div className="expiry-stat-card warning">

          <span>
            Expiring Soon
          </span>

          <strong>
            {data.counts.expiringSoon}
          </strong>

        </div>


        <div className="expiry-stat-card valid">

          <span>
            Valid
          </span>

          <strong>
            {data.counts.valid}
          </strong>

        </div>


        <div className="expiry-stat-card">

          <span>
            No Expiry
          </span>

          <strong>
            {data.counts.noExpiry}
          </strong>

        </div>

      </div>


      {/* ======================================================
          EXPIRED
      ====================================================== */}

      <section className="expiry-section">

        <div className="expiry-section-header">

          <div>

            <span className="section-eyebrow">
              ATTENTION REQUIRED
            </span>

            <h2>
              Expired documents
            </h2>

          </div>

          <span className="expiry-section-count">
            {data.expired.length}
          </span>

        </div>


        {data.expired.length === 0 ? (

          <div className="expiry-empty">

            No expired documents.

          </div>

        ) : (

          <div className="expiry-list">

            {data.expired.map(
              (item) => (

                <article
                  className="expiry-document-card expired"
                  key={
                    item.document?._id
                  }
                  onClick={() =>
                    openDocument(item)
                  }
                >

                  <div className="expiry-document-info">

                    <div className="document-icon">
                      DOC
                    </div>

                    <div>

                      <h3>
                        {getDocumentName(
                          item
                        )}
                      </h3>

                      <p>
                        Expired on{" "}
                        {formatDate(
                          item.expiryDate
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="expiry-document-status">

                    <strong>
                      {item.daysExpired || 0}
                      {" "}
                      days expired
                    </strong>

                    <span>
                      View →
                    </span>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </section>


      {/* ======================================================
          EXPIRING SOON
      ====================================================== */}

      <section className="expiry-section">

        <div className="expiry-section-header">

          <div>

            <span className="section-eyebrow">
              UPCOMING
            </span>

            <h2>
              Expiring soon
            </h2>

          </div>

          <span className="expiry-section-count">
            {data.expiringSoon.length}
          </span>

        </div>


        {data.expiringSoon.length === 0 ? (

          <div className="expiry-empty">

            No documents are expiring
            within the next 30 days.

          </div>

        ) : (

          <div className="expiry-list">

            {data.expiringSoon.map(
              (item) => (

                <article
                  className="expiry-document-card warning"
                  key={
                    item.document?._id
                  }
                  onClick={() =>
                    openDocument(item)
                  }
                >

                  <div className="expiry-document-info">

                    <div className="document-icon">
                      DOC
                    </div>

                    <div>

                      <h3>
                        {getDocumentName(
                          item
                        )}
                      </h3>

                      <p>
                        Expires on{" "}
                        {formatDate(
                          item.expiryDate
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="expiry-document-status">

                    <strong>
                      {item.daysRemaining === 0
                        ? "Expires today"
                        : `${item.daysRemaining} days left`}
                    </strong>

                    <span>
                      View →
                    </span>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </section>


      {/* ======================================================
          VALID
      ====================================================== */}

      <section className="expiry-section">

        <div className="expiry-section-header">

          <div>

            <span className="section-eyebrow">
              SAFE
            </span>

            <h2>
              Valid documents
            </h2>

          </div>

          <span className="expiry-section-count">
            {data.valid.length}
          </span>

        </div>


        {data.valid.length === 0 ? (

          <div className="expiry-empty">

            No valid documents with
            future expiry dates.

          </div>

        ) : (

          <div className="expiry-list">

            {data.valid.map(
              (item) => (

                <article
                  className="expiry-document-card valid"
                  key={
                    item.document?._id
                  }
                  onClick={() =>
                    openDocument(item)
                  }
                >

                  <div className="expiry-document-info">

                    <div className="document-icon">
                      DOC
                    </div>

                    <div>

                      <h3>
                        {getDocumentName(
                          item
                        )}
                      </h3>

                      <p>
                        Expires on{" "}
                        {formatDate(
                          item.expiryDate
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="expiry-document-status">

                    <strong>
                      {item.daysRemaining}{" "}
                      days remaining
                    </strong>

                    <span>
                      View →
                    </span>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </section>


      {/* ======================================================
          NO EXPIRY
      ====================================================== */}

      <section className="expiry-section">

        <div className="expiry-section-header">

          <div>

            <span className="section-eyebrow">
              INFORMATION
            </span>

            <h2>
              Documents without expiry
            </h2>

          </div>

          <span className="expiry-section-count">
            {data.noExpiry.length}
          </span>

        </div>


        {data.noExpiry.length === 0 ? (

          <div className="expiry-empty">

            All documents have expiry
            information.

          </div>

        ) : (

          <div className="expiry-list">

            {data.noExpiry.map(
              (item) => (

                <article
                  className="expiry-document-card"
                  key={
                    item.document?._id
                  }
                  onClick={() =>
                    openDocument(item)
                  }
                >

                  <div className="expiry-document-info">

                    <div className="document-icon">
                      DOC
                    </div>

                    <div>

                      <h3>
                        {getDocumentName(
                          item
                        )}
                      </h3>

                      <p>
                        No expiry date detected
                      </p>

                    </div>

                  </div>


                  <div className="expiry-document-status">

                    <span>
                      View →
                    </span>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </section>

    </main>
  );
};

export default Expiry;