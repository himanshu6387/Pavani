import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Compare.css";
const CompareDocuments = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [documents, setDocuments] = useState([]);

  const [documentId1, setDocumentId1] = useState("");
  const [documentId2, setDocumentId2] = useState("");

  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  const [error, setError] = useState("");

  const [result, setResult] = useState(null);

  // ==========================================================
  // LOAD DOCUMENTS
  // ==========================================================

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/documents");

      console.log(
        "Compare documents response:",
        response.data
      );

      const list =
        response.data?.documents ||
        response.data?.data ||
        [];

      setDocuments(
        Array.isArray(list)
          ? list
          : []
      );

    } catch (err) {
      console.error(
        "Compare documents loading error:",
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

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDocuments();
  }, []);

  // ==========================================================
  // SAFE VALUE RENDERER
  //
  // AI kabhi string return karega
  // kabhi object return kar sakta hai.
  //
  // React directly object render nahi kar sakta.
  // Is function se dono safely handle honge.
  // ==========================================================

  const renderValue = (value) => {

    if (
      value === null ||
      value === undefined
    ) {
      return "Not mentioned";
    }

    // --------------------------------------------------------
    // STRING / NUMBER / BOOLEAN
    // --------------------------------------------------------

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    // --------------------------------------------------------
    // ARRAY
    // --------------------------------------------------------

    if (Array.isArray(value)) {

      return value
        .map((item) =>
          renderValue(item)
        )
        .join(", ");

    }

    // --------------------------------------------------------
    // OBJECT
    // --------------------------------------------------------

    if (
      typeof value === "object"
    ) {

      // Try useful common fields first.

      if (
        typeof value.text === "string"
      ) {
        return value.text;
      }

      if (
        typeof value.value === "string"
      ) {
        return value.value;
      }

      if (
        typeof value.description === "string"
      ) {
        return value.description;
      }

      if (
        typeof value.name === "string"
      ) {
        return value.name;
      }

      if (
        typeof value.field === "string"
      ) {
        return value.field;
      }

      // Fallback:
      // safely convert object to readable JSON.

      try {
        return JSON.stringify(
          value,
          null,
          2
        );
      } catch {
        return "Unable to display this value.";
      }

    }

    return String(value);
  };

  // ==========================================================
  // COMPARE DOCUMENTS
  // ==========================================================

  const handleCompare = async () => {

    try {

      setError("");
      setResult(null);

      // ------------------------------------------------------
      // VALIDATE FIRST DOCUMENT
      // ------------------------------------------------------

      if (!documentId1) {

        setError(
          "Please select the first document."
        );

        return;
      }

      // ------------------------------------------------------
      // VALIDATE SECOND DOCUMENT
      // ------------------------------------------------------

      if (!documentId2) {

        setError(
          "Please select the second document."
        );

        return;
      }

      // ------------------------------------------------------
      // SAME DOCUMENT CHECK
      // ------------------------------------------------------

      if (
        documentId1 === documentId2
      ) {

        setError(
          "Please select two different documents."
        );

        return;
      }

      // ------------------------------------------------------
      // START COMPARISON
      // ------------------------------------------------------

      setComparing(true);

      console.log(
        "Comparing documents:",
        {
          documentId1,
          documentId2
        }
      );

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response =
        await api.post(
          "/documents/compare",
          {
            documentId1,
            documentId2
          }
        );

      console.log(
        "Comparison response:",
        response.data
      );

      // ------------------------------------------------------
      // SAVE RESULT
      // ------------------------------------------------------

      const comparison =
        response.data?.comparison ||
        null;

      setResult(
        comparison
      );

    } catch (err) {

      console.error(
        "Document comparison error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to compare the selected documents."
      );

    } finally {

      setComparing(false);

    }

  };

  // ==========================================================
  // DOCUMENT NAME
  // ==========================================================

  const getDocumentName = (
    documentId
  ) => {

    const document =
      documents.find(
        (item) =>
          String(item._id) ===
          String(documentId)
      );

    return (
      document?.originalName ||
      document?.name ||
      "Selected document"
    );

  };

  // ==========================================================
  // RESET
  // ==========================================================

  const resetComparison = () => {

    setDocumentId1("");
    setDocumentId2("");

    setResult(null);

    setError("");

  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <main
        className="compare-page"
      >

        <div
          className="documents-state"
        >
          Loading your documents...
        </div>

      </main>

    );

  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <main
      className="compare-page"
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="documents-header"
      >

        <div>

          <span
            className="section-eyebrow"
          >
            AI DOCUMENT INTELLIGENCE
          </span>

          <h1>
            Compare Documents
          </h1>

          <p>
            Select two documents and let
            LifeVault AI identify important
            changes, similarities and
            recommendations.
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


      {/* ====================================================
          NO DOCUMENTS
      ==================================================== */}

      {documents.length === 0 ? (

        <section
          className="compare-empty"
        >

          <h2>
            No documents available
          </h2>

          <p>
            Upload at least two documents
            before using AI comparison.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/documents/upload"
              )
            }
          >
            Upload document
          </button>

        </section>

      ) : (

        <>

          {/* ==================================================
              DOCUMENT SELECTION
          ================================================== */}

          <section
            className="compare-selection"
          >

            {/* ------------------------------------------------
                DOCUMENT 1
            ------------------------------------------------ */}

            <div
              className="compare-selection-card"
            >

              <div
                className="compare-number"
              >
                01
              </div>

              <div
                className="compare-field"
              >

                <label>
                  First document
                </label>

                <select
                  value={documentId1}
                  onChange={(event) =>
                    setDocumentId1(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select a document
                  </option>

                  {documents.map(
                    (document) => (

                      <option
                        key={document._id}
                        value={document._id}
                      >
                        {
                          document.originalName ||
                          document.name ||
                          "Untitled document"
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            {/* ------------------------------------------------
                VS
            ------------------------------------------------ */}

            <div
              className="compare-vs"
            >
              VS
            </div>


            {/* ------------------------------------------------
                DOCUMENT 2
            ------------------------------------------------ */}

            <div
              className="compare-selection-card"
            >

              <div
                className="compare-number"
              >
                02
              </div>

              <div
                className="compare-field"
              >

                <label>
                  Second document
                </label>

                <select
                  value={documentId2}
                  onChange={(event) =>
                    setDocumentId2(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select a document
                  </option>

                  {documents.map(
                    (document) => (

                      <option
                        key={document._id}
                        value={document._id}
                      >
                        {
                          document.originalName ||
                          document.name ||
                          "Untitled document"
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>

          </section>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div
              className="compare-error"
            >
              {error}
            </div>

          )}


          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div
            className="compare-actions"
          >

            <button
              type="button"
              className="compare-button"
              disabled={
                comparing ||
                !documentId1 ||
                !documentId2
              }
              onClick={
                handleCompare
              }
            >

              {comparing
                ? "AI is comparing..."
                : "Compare with AI"}

            </button>


            {result && (

              <button
                type="button"
                className="compare-reset-button"
                onClick={
                  resetComparison
                }
              >
                New comparison
              </button>

            )}

          </div>


          {/* ==================================================
              AI LOADING
          ================================================== */}

          {comparing && (

            <div
              className="compare-ai-loading"
            >

              <div
                className="compare-loading-icon"
              >
                AI
              </div>

              <h2>
                LifeVault AI is comparing
              </h2>

              <p>
                Analyzing both documents for
                meaningful differences and
                changes...
              </p>

            </div>

          )}


          {/* ==================================================
              RESULTS
          ================================================== */}

          {result && !comparing && (

            <section
              className="comparison-results"
            >

              {/* =================================================
                  RESULT HEADER
              ================================================= */}

              <div
                className="comparison-result-header"
              >

                <div>

                  <span
                    className="section-eyebrow"
                  >
                    AI ANALYSIS COMPLETE
                  </span>

                  <h2>
                    Comparison Results
                  </h2>

                </div>

                <span
                  className={
                    `comparison-change-badge ${
                      result.overallChange ||
                      "moderate"
                    }`
                  }
                >
                  {
                    renderValue(
                      result.overallChange ||
                      "moderate"
                    )
                  }
                </span>

              </div>


              {/* =================================================
                  DOCUMENT NAMES
              ================================================= */}

              <div
                className="comparison-document-names"
              >

                <div>

                  <span>
                    Document 1
                  </span>

                  <strong>
                    {
                      getDocumentName(
                        documentId1
                      )
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Document 2
                  </span>

                  <strong>
                    {
                      getDocumentName(
                        documentId2
                      )
                    }
                  </strong>

                </div>

              </div>


              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div
                className="comparison-result-card"
              >

                <span
                  className="section-eyebrow"
                >
                  OVERVIEW
                </span>

                <h3>
                  What changed?
                </h3>

                <p>
                  {
                    renderValue(
                      result.summary ||
                      "No comparison summary available."
                    )
                  }
                </p>

              </div>


              {/* =================================================
                  KEY DIFFERENCES
              ================================================= */}

              <div
                className="comparison-result-card"
              >

                <div
                  className="comparison-card-heading"
                >

                  <div>

                    <span
                      className="section-eyebrow"
                    >
                      IMPORTANT
                    </span>

                    <h3>
                      Key differences
                    </h3>

                  </div>

                  <span>
                    {
                      Array.isArray(
                        result.keyDifferences
                      )
                        ? result.keyDifferences.length
                        : 0
                    }
                  </span>

                </div>


                {
                  Array.isArray(
                    result.keyDifferences
                  ) &&
                  result.keyDifferences.length > 0
                    ? (

                      <div
                        className="comparison-differences"
                      >

                        {
                          result.keyDifferences.map(
                            (
                              difference,
                              index
                            ) => {

                              const safeDifference =
                                difference &&
                                typeof difference ===
                                "object"
                                  ? difference
                                  : {
                                      field:
                                        "Difference",
                                      document1:
                                        difference,
                                      document2:
                                        "Not mentioned",
                                      importance:
                                        "medium"
                                    };

                              return (

                                <div
                                  className="comparison-difference"
                                  key={index}
                                >

                                  {/* FIELD */}

                                  <div
                                    className="difference-top"
                                  >

                                    <strong>
                                      {
                                        renderValue(
                                          safeDifference.field ||
                                          "Difference"
                                        )
                                      }
                                    </strong>

                                    <span
                                      className={
                                        `importance ${
                                          renderValue(
                                            safeDifference.importance ||
                                            "medium"
                                          )
                                        }`
                                      }
                                    >
                                      {
                                        renderValue(
                                          safeDifference.importance ||
                                          "medium"
                                        )
                                      }
                                    </span>

                                  </div>


                                  {/* VALUES */}

                                  <div
                                    className="difference-values"
                                  >

                                    <div>

                                      <span>
                                        Document 1
                                      </span>

                                      <p>
                                        {
                                          renderValue(
                                            safeDifference.document1 ||
                                            "Not mentioned"
                                          )
                                        }
                                      </p>

                                    </div>


                                    <div>

                                      <span>
                                        Document 2
                                      </span>

                                      <p>
                                        {
                                          renderValue(
                                            safeDifference.document2 ||
                                            "Not mentioned"
                                          )
                                        }
                                      </p>

                                    </div>

                                  </div>

                                </div>

                              );

                            }
                          )
                        }

                      </div>

                    )
                    : (

                      <p>
                        No major differences were detected.
                      </p>

                    )
                }

              </div>


              {/* =================================================
                  COMMON INFORMATION
              ================================================= */}

              <div
                className="comparison-result-card"
              >

                <span
                  className="section-eyebrow"
                >
                  MATCHED
                </span>

                <h3>
                  Common information
                </h3>


                {
                  Array.isArray(
                    result.commonInformation
                  ) &&
                  result.commonInformation.length > 0
                    ? (

                      <ul
                        className="comparison-list"
                      >

                        {
                          result.commonInformation.map(
                            (
                              item,
                              index
                            ) => (

                              <li
                                key={index}
                              >
                                {
                                  renderValue(
                                    item
                                  )
                                }
                              </li>

                            )
                          )
                        }

                      </ul>

                    )
                    : (

                      <p>
                        No common information
                        was identified.
                      </p>

                    )
                }

              </div>


              {/* =================================================
                  NEW INFORMATION
              ================================================= */}

              <div
                className="comparison-result-card"
              >

                <span
                  className="section-eyebrow"
                >
                  NEW
                </span>

                <h3>
                  New information
                </h3>


                {
                  Array.isArray(
                    result.newInformation
                  ) &&
                  result.newInformation.length > 0
                    ? (

                      <ul
                        className="comparison-list"
                      >

                        {
                          result.newInformation.map(
                            (
                              item,
                              index
                            ) => (

                              <li
                                key={index}
                              >
                                {
                                  renderValue(
                                    item
                                  )
                                }
                              </li>

                            )
                          )
                        }

                      </ul>

                    )
                    : (

                      <p>
                        No new information
                        was identified.
                      </p>

                    )
                }

              </div>


              {/* =================================================
                  REMOVED INFORMATION
              ================================================= */}

              <div
                className="comparison-result-card"
              >

                <span
                  className="section-eyebrow"
                >
                  REMOVED
                </span>

                <h3>
                  Removed information
                </h3>


                {
                  Array.isArray(
                    result.removedInformation
                  ) &&
                  result.removedInformation.length > 0
                    ? (

                      <ul
                        className="comparison-list"
                      >

                        {
                          result.removedInformation.map(
                            (
                              item,
                              index
                            ) => (

                              <li
                                key={index}
                              >
                                {
                                  renderValue(
                                    item
                                  )
                                }
                              </li>

                            )
                          )
                        }

                      </ul>

                    )
                    : (

                      <p>
                        No removed information
                        was identified.
                      </p>

                    )
                }

              </div>


              {/* =================================================
                  RECOMMENDATIONS
              ================================================= */}

              <div
                className="comparison-result-card recommendations"
              >

                <span
                  className="section-eyebrow"
                >
                  LIFEVAULT AI
                </span>

                <h3>
                  Recommendations
                </h3>


                {
                  Array.isArray(
                    result.recommendations
                  ) &&
                  result.recommendations.length > 0
                    ? (

                      <ul
                        className="comparison-list"
                      >

                        {
                          result.recommendations.map(
                            (
                              item,
                              index
                            ) => (

                              <li
                                key={index}
                              >
                                {
                                  renderValue(
                                    item
                                  )
                                }
                              </li>

                            )
                          )
                        }

                      </ul>

                    )
                    : (

                      <p>
                        No additional recommendations.
                      </p>

                    )
                }

              </div>

            </section>

          )}

        </>

      )}

    </main>

  );
};

export default CompareDocuments;