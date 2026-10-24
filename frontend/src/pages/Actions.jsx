import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/ActionExtractor.css";
const Actions = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [actions, setActions] = useState([]);

  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [extractingDocumentId, setExtractingDocumentId] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("pending");

  const [processingActionId, setProcessingActionId] =
    useState("");

  // ==========================================================
  // LOAD ACTIONS
  // ==========================================================

  const loadActions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/actions?status=${statusFilter}`
      );

      console.log(
        "Actions response:",
        response.data
      );

      const list =
        response.data?.actions ||
        response.data?.data ||
        [];

      setActions(
        Array.isArray(list)
          ? list
          : []
      );

    } catch (err) {

      console.error(
        "Load actions error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to load your actions."
      );

    } finally {

      setLoading(false);

    }
  };

  // ==========================================================
  // LOAD DOCUMENTS
  // ==========================================================

  const loadDocuments = async () => {

    try {

      const response =
        await api.get(
          "/documents"
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
        "Load documents error:",
        err
      );

    }

  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadActions();

    loadDocuments();

  }, [statusFilter]);

  // ==========================================================
  // EXTRACT ACTIONS
  // ==========================================================

  const extractActions = async (
    documentId
  ) => {

    try {

      setExtractingDocumentId(
        documentId
      );

      setError("");

      console.log(
        "Extracting actions from:",
        documentId
      );

      const response =
        await api.post(
          `/actions/extract/${documentId}`
        );

      console.log(
        "Action extraction response:",
        response.data
      );

      await loadActions();

      alert(
        response.data?.message ||
        "Actions extracted successfully."
      );

    } catch (err) {

      console.error(
        "Action extraction error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to extract actions from this document."
      );

    } finally {

      setExtractingDocumentId(
        ""
      );

    }

  };

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  const updateStatus = async (
    actionId,
    status
  ) => {

    try {

      setProcessingActionId(
        actionId
      );

      setError("");

      await api.patch(
        `/actions/${actionId}/status`,
        {
          status
        }
      );

      await loadActions();

    } catch (err) {

      console.error(
        "Update action error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to update action."
      );

    } finally {

      setProcessingActionId(
        ""
      );

    }

  };

  // ==========================================================
  // DELETE ACTION
  // ==========================================================

  const deleteAction = async (
    actionId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this action?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setProcessingActionId(
        actionId
      );

      setError("");

      await api.delete(
        `/actions/${actionId}`
      );

      await loadActions();

    } catch (err) {

      console.error(
        "Delete action error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to delete action."
      );

    } finally {

      setProcessingActionId(
        ""
      );

    }

  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "No deadline";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return "No deadline";

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

  // ==========================================================
  // CHECK OVERDUE
  // ==========================================================

  const isOverdue = (
    date
  ) => {

    if (!date) {
      return false;
    }

    const due =
      new Date(date);

    if (
      Number.isNaN(
        due.getTime()
      )
    ) {

      return false;

    }

    return (
      due < new Date()
    );

  };

  // ==========================================================
  // PRIORITY CLASS
  // ==========================================================

  const getPriorityClass = (
    priority
  ) => {

    const allowed = [
      "low",
      "medium",
      "high",
      "critical"
    ];

    if (
      allowed.includes(
        priority
      )
    ) {

      return priority;

    }

    return "medium";

  };

  // ==========================================================
  // DOCUMENT NAME
  // ==========================================================

  const getDocumentName = (
    action
  ) => {

    if (
      action?.documentName
    ) {

      return action.documentName;

    }

    if (
      action?.document?.originalName
    ) {

      return (
        action.document.originalName
      );

    }

    const matchingDocument =
      documents.find(
        (document) =>
          String(
            document._id
          ) ===
          String(
            action?.document
          )
      );

    return (
      matchingDocument?.originalName ||
      "Source document"
    );

  };

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {

    return (

      <main
        className="actions-page"
      >

        <div
          className="documents-state"
        >
          Loading your AI actions...
        </div>

      </main>

    );

  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <main
      className="actions-page"
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="actions-header"
      >

        <div>

          <span
            className="section-eyebrow"
          >
            LIFEVAULT AI
          </span>

          <h1>
            Action Center
          </h1>

          <p>
            Important tasks detected from your
            documents, with deadlines and context.
          </p>

        </div>

        <button
          type="button"
          className="upload-document-button"
          onClick={() =>
            navigate(
              "/documents"
            )
          }
        >
          View documents
        </button>

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <div
          className="actions-error"
        >

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>

        </div>

      )}


      {/* ====================================================
          DOCUMENT ACTION EXTRACTION
      ==================================================== */}

      <section
        className="action-extraction-panel"
      >

        <div
          className="action-extraction-header"
        >

          <div>

            <span
              className="section-eyebrow"
            >
              DOCUMENT → ACTION
            </span>

            <h2>
              Extract tasks from a document
            </h2>

            <p>
              LifeVault AI will read the document
              and identify actions you actually
              need to take.
            </p>

          </div>

        </div>


        {documents.length === 0 ? (

          <div
            className="action-no-documents"
          >

            <p>
              Upload a document first.
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

          </div>

        ) : (

          <div
            className="action-document-list"
          >

            {documents.map(
              (document) => (

                <div
                  className="action-document-row"
                  key={document._id}
                >

                  <div
                    className="action-document-info"
                  >

                    <div
                      className="action-document-icon"
                    >
                      DOC
                    </div>

                    <div>

                      <strong>
                        {
                          document.originalName ||
                          document.name ||
                          "Untitled document"
                        }
                      </strong>

                      <span>
                        {
                          document.documentType ||
                          document.category ||
                          "Document"
                        }
                      </span>

                    </div>

                  </div>


                  <button
                    type="button"
                    className="extract-action-button"
                    disabled={
                      extractingDocumentId ===
                      document._id
                    }
                    onClick={() =>
                      extractActions(
                        document._id
                      )
                    }
                  >

                    {
                      extractingDocumentId ===
                      document._id
                        ? "AI reading..."
                        : "Extract actions"
                    }

                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* ====================================================
          ACTION TOOLBAR
      ==================================================== */}

      <div
        className="actions-toolbar"
      >

        <div>

          <span
            className="actions-count"
          >
            {actions.length}
          </span>

          <span>
            {
              statusFilter === "pending"
                ? "pending actions"
                : statusFilter === "completed"
                  ? "completed actions"
                  : "dismissed actions"
            }
          </span>

        </div>


        <div
          className="action-filters"
        >

          <button
            type="button"
            className={
              statusFilter === "pending"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "pending"
              )
            }
          >
            Pending
          </button>


          <button
            type="button"
            className={
              statusFilter === "completed"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "completed"
              )
            }
          >
            Completed
          </button>


          <button
            type="button"
            className={
              statusFilter === "dismissed"
                ? "active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "dismissed"
              )
            }
          >
            Dismissed
          </button>

        </div>

      </div>


      {/* ====================================================
          EMPTY STATE
      ==================================================== */}

      {actions.length === 0 ? (

        <section
          className="actions-empty"
        >

          <div
            className="actions-empty-icon"
          >
            ✓
          </div>

          <h2>
            No {statusFilter} actions
          </h2>

          <p>
            {
              statusFilter === "pending"
                ? "Your documents don't currently have any detected tasks."
                : `You don't have any ${statusFilter} actions yet.`
            }
          </p>

        </section>

      ) : (

        /* ==================================================
           ACTION CARDS
        ================================================== */

        <section
          className="actions-grid"
        >

          {actions.map(
            (action) => {

              const overdue =
                isOverdue(
                  action.dueDate
                );

              const priority =
                getPriorityClass(
                  action.priority
                );

              const processing =
                processingActionId ===
                action._id;

              return (

                <article
                  className={
                    `action-card priority-${priority}`
                  }
                  key={action._id}
                >

                  {/* =========================================
                      TOP
                  ========================================= */}

                  <div
                    className="action-card-top"
                  >

                    <span
                      className={
                        `action-priority ${priority}`
                      }
                    >

                      {
                        priority.toUpperCase()
                      }

                    </span>


                    {overdue && (
                      <span
                        className="action-overdue"
                      >
                        OVERDUE
                      </span>
                    )}

                  </div>


                  {/* =========================================
                      TITLE
                  ========================================= */}

                  <h2>
                    {
                      action.title ||
                      "Untitled action"
                    }
                  </h2>


                  {/* =========================================
                      DESCRIPTION
                  ========================================= */}

                  <p
                    className="action-description"
                  >
                    {
                      action.description ||
                      "No additional description available."
                    }
                  </p>


                  {/* =========================================
                      DUE DATE
                  ========================================= */}

                  <div
                    className="action-due-date"
                  >

                    <span>
                      Due date
                    </span>

                    <strong
                      className={
                        overdue
                          ? "overdue-text"
                          : ""
                      }
                    >
                      {
                        formatDate(
                          action.dueDate
                        )
                      }
                    </strong>

                  </div>


                  {/* =========================================
                      SOURCE
                  ========================================= */}

                  <div
                    className="action-source"
                  >

                    <span>
                      Source
                    </span>

                    <strong>
                      {
                        getDocumentName(
                          action
                        )
                      }
                    </strong>

                  </div>


                  {/* =========================================
                      REASON
                  ========================================= */}

                  {action.reason && (

                    <div
                      className="action-reason"
                    >

                      <span>
                        Why?
                      </span>

                      <p>
                        {
                          action.reason
                        }
                      </p>

                    </div>

                  )}


                  {/* =========================================
                      EVIDENCE
                  ========================================= */}

                  {action.evidence && (

                    <div
                      className="action-evidence"
                    >

                      <span>
                        AI evidence
                      </span>

                      <p>
                        "
                        {
                          action.evidence
                        }
                        "
                      </p>

                    </div>

                  )}


                  {/* =========================================
                      CONFIDENCE
                  ========================================= */}

                  <div
                    className="action-confidence"
                  >

                    <div>

                      <span>
                        AI confidence
                      </span>

                      <strong>
                        {
                          Number(
                            action.confidence ||
                            0
                          )
                        }%
                      </strong>

                    </div>


                    <div
                      className="confidence-bar"
                    >

                      <div
                        className="confidence-progress"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              Number(
                                action.confidence ||
                                0
                              )
                            )
                          )}%`
                        }}
                      />

                    </div>

                  </div>


                  {/* =========================================
                      ACTION BUTTONS
                  ========================================= */}

                  <div
                    className="action-card-actions"
                  >

                    {statusFilter ===
                      "pending" && (

                      <>

                        <button
                          type="button"
                          className="complete-action-button"
                          disabled={
                            processing
                          }
                          onClick={() =>
                            updateStatus(
                              action._id,
                              "completed"
                            )
                          }
                        >

                          {
                            processing
                              ? "Updating..."
                              : "✓ Mark done"
                          }

                        </button>


                        <button
                          type="button"
                          className="dismiss-action-button"
                          disabled={
                            processing
                          }
                          onClick={() =>
                            updateStatus(
                              action._id,
                              "dismissed"
                            )
                          }
                        >
                          Dismiss
                        </button>

                      </>

                    )}


                    {statusFilter ===
                      "completed" && (

                      <button
                        type="button"
                        className="reopen-action-button"
                        disabled={
                          processing
                        }
                        onClick={() =>
                          updateStatus(
                            action._id,
                            "pending"
                          )
                        }
                      >
                        Move to pending
                      </button>

                    )}


                    {statusFilter ===
                      "dismissed" && (

                      <button
                        type="button"
                        className="reopen-action-button"
                        disabled={
                          processing
                        }
                        onClick={() =>
                          updateStatus(
                            action._id,
                            "pending"
                          )
                        }
                      >
                        Restore action
                      </button>

                    )}


                    <button
                      type="button"
                      className="delete-action-button"
                      disabled={
                        processing
                      }
                      onClick={() =>
                        deleteAction(
                          action._id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </article>

              );

            }
          )}

        </section>

      )}

    </main>

  );

};

export default Actions;