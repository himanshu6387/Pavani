import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Timeline.css";
const Timeline = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] =
    useState("all");

  const [importanceFilter, setImportanceFilter] =
    useState("all");

  const [deletingEventId, setDeletingEventId] =
    useState("");

  // ==========================================================
  // LOAD TIMELINE
  // ==========================================================

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (typeFilter !== "all") {
        params.type = typeFilter;
      }

      if (importanceFilter !== "all") {
        params.importance =
          importanceFilter;
      }

      const response = await api.get(
        "/timeline",
        {
          params
        }
      );

      console.log(
        "Timeline response:",
        response.data
      );

      const list =
        response.data?.events ||
        response.data?.data ||
        [];

      setEvents(
        Array.isArray(list)
          ? list
          : []
      );

    } catch (err) {
      console.error(
        "Timeline load error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to load your timeline."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL / FILTER LOAD
  // ==========================================================

  useEffect(() => {
    loadTimeline();
  }, [
    typeFilter,
    importanceFilter
  ]);

  // ==========================================================
  // GENERATE TIMELINE
  // ==========================================================

  const generateTimeline = async () => {
    try {
      setGenerating(true);
      setError("");

      const response =
        await api.post(
          "/timeline/generate"
        );

      console.log(
        "Timeline generation response:",
        response.data
      );

      await loadTimeline();

      alert(
        response.data?.message ||
        "Timeline generated successfully."
      );

    } catch (err) {
      console.error(
        "Timeline generation error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to generate timeline."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ==========================================================
  // DELETE EVENT
  // ==========================================================

  const deleteEvent = async (
    eventId
  ) => {

    const confirmed =
      window.confirm(
        "Delete this timeline event?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeletingEventId(
        eventId
      );

      setError("");

      await api.delete(
        `/timeline/${eventId}`
      );

      setEvents(
        (previous) =>
          previous.filter(
            (event) =>
              event._id !==
              eventId
          )
      );

    } catch (err) {

      console.error(
        "Delete timeline event error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to delete timeline event."
      );

    } finally {

      setDeletingEventId(
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
      return "Unknown date";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Unknown date";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  // ==========================================================
  // GET YEAR
  // ==========================================================

  const getYear = (
    date
  ) => {

    if (!date) {
      return "Unknown";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Unknown";
    }

    return parsed.getFullYear();
  };

  // ==========================================================
  // CATEGORY ICON
  // ==========================================================

  const getCategoryIcon = (
    type
  ) => {

    const icons = {
      medical: "♥",
      financial: "₹",
      insurance: "◈",
      legal: "§",
      identity: "ID",
      property: "⌂",
      education: "◆",
      employment: "▣",
      travel: "✈",
      tax: "%",
      other: "●"
    };

    return (
      icons[type] ||
      icons.other
    );
  };

  // ==========================================================
  // CATEGORY LABEL
  // ==========================================================

  const getCategoryLabel = (
    type
  ) => {

    if (!type) {
      return "Other";
    }

    return (
      type.charAt(0).toUpperCase() +
      type.slice(1)
    );
  };

  // ==========================================================
  // DOCUMENT NAME
  // ==========================================================

  const getDocumentName = (
    event
  ) => {

    if (
      event?.documentName
    ) {
      return event.documentName;
    }

    if (
      event?.document?.originalName
    ) {
      return event.document.originalName;
    }

    return "Source document";
  };

  // ==========================================================
  // GROUP EVENTS BY YEAR
  // ==========================================================

  const groupedEvents =
    useMemo(() => {

      const groups = {};

      events.forEach(
        (event) => {

          const year =
            getYear(
              event.eventDate
            );

          if (
            !groups[year]
          ) {
            groups[year] = [];
          }

          groups[year].push(
            event
          );
        }
      );

      return Object.entries(
        groups
      ).sort(
        ([yearA], [yearB]) =>
          Number(yearB) -
          Number(yearA)
      );

    }, [events]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <main
        className="timeline-page"
      >
        <div
          className="documents-state"
        >
          Loading your timeline...
        </div>
      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <main
      className="timeline-page"
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="timeline-header"
      >

        <div>

          <span
            className="section-eyebrow"
          >
            DOCUMENT INTELLIGENCE
          </span>

          <h1>
            Life Timeline
          </h1>

          <p>
            Important events discovered across
            your documents, arranged chronologically.
          </p>

        </div>


        <div
          className="timeline-header-actions"
        >

          <button
            type="button"
            className="timeline-secondary-button"
            onClick={() =>
              navigate(
                "/documents"
              )
            }
          >
            My documents
          </button>

          <button
            type="button"
            className="timeline-generate-button"
            disabled={generating}
            onClick={
              generateTimeline
            }
          >

            {generating
              ? "AI building timeline..."
              : "✦ Generate timeline"}

          </button>

        </div>

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <div
          className="timeline-error"
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
          EXPLANATION
      ==================================================== */}

      <section
        className="timeline-intelligence-card"
      >

        <div
          className="timeline-intelligence-icon"
        >
          AI
        </div>

        <div>

          <strong>
            Your documents tell a story.
          </strong>

          <p>
            LifeVault AI identifies meaningful
            dated events from your documents and
            connects them into one chronological
            view.
          </p>

        </div>

      </section>


      {/* ====================================================
          FILTERS
      ==================================================== */}

      <div
        className="timeline-toolbar"
      >

        <div
          className="timeline-result-count"
        >

          <strong>
            {events.length}
          </strong>

          <span>
            timeline{" "}
            {events.length === 1
              ? "event"
              : "events"}
          </span>

        </div>


        <div
          className="timeline-filters"
        >

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              All categories
            </option>

            <option value="medical">
              Medical
            </option>

            <option value="financial">
              Financial
            </option>

            <option value="insurance">
              Insurance
            </option>

            <option value="legal">
              Legal
            </option>

            <option value="identity">
              Identity
            </option>

            <option value="property">
              Property
            </option>

            <option value="education">
              Education
            </option>

            <option value="employment">
              Employment
            </option>

            <option value="travel">
              Travel
            </option>

            <option value="tax">
              Tax
            </option>

            <option value="other">
              Other
            </option>

          </select>


          <select
            value={
              importanceFilter
            }
            onChange={(event) =>
              setImportanceFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              All importance
            </option>

            <option value="high">
              High importance
            </option>

            <option value="medium">
              Medium importance
            </option>

            <option value="low">
              Low importance
            </option>

          </select>

        </div>

      </div>


      {/* ====================================================
          EMPTY STATE
      ==================================================== */}

      {events.length === 0 ? (

        <section
          className="timeline-empty"
        >

          <div
            className="timeline-empty-icon"
          >
            ◷
          </div>

          <h2>
            Your timeline is empty
          </h2>

          <p>
            Let LifeVault AI scan your documents
            and discover the important events hidden
            inside them.
          </p>

          <button
            type="button"
            className="timeline-generate-button"
            disabled={generating}
            onClick={
              generateTimeline
            }
          >

            {generating
              ? "Building timeline..."
              : "✦ Build my timeline"}

          </button>

        </section>

      ) : (

        /* ==================================================
           TIMELINE
        ================================================== */

        <section
          className="timeline-container"
        >

          {groupedEvents.map(
            ([year, yearEvents]) => (

              <div
                className="timeline-year-group"
                key={year}
              >

                {/* ==========================================
                    YEAR
                ========================================== */}

                <div
                  className="timeline-year"
                >

                  <span>
                    {year}
                  </span>

                </div>


                {/* ==========================================
                    EVENTS
                ========================================== */}

                <div
                  className="timeline-events"
                >

                  {yearEvents.map(
                    (event) => {

                      const category =
                        event.eventType ||
                        "other";

                      const importance =
                        event.importance ||
                        "medium";

                      const deleting =
                        deletingEventId ===
                        event._id;

                      return (

                        <article
                          className={
                            `timeline-event-card importance-${importance}`
                          }
                          key={
                            event._id
                          }
                        >

                          {/* =================================
                              TIMELINE LINE
                          ================================= */}

                          <div
                            className="timeline-event-marker"
                          >

                            <span>
                              {
                                getCategoryIcon(
                                  category
                                )
                              }
                            </span>

                          </div>


                          {/* =================================
                              EVENT CONTENT
                          ================================= */}

                          <div
                            className="timeline-event-content"
                          >

                            <div
                              className="timeline-event-top"
                            >

                              <span
                                className={
                                  `timeline-category ${category}`
                                }
                              >
                                {
                                  getCategoryLabel(
                                    category
                                  )
                                }
                              </span>

                              <time>
                                {
                                  formatDate(
                                    event.eventDate
                                  )
                                }
                              </time>

                            </div>


                            <h2>
                              {
                                event.title ||
                                "Timeline event"
                              }
                            </h2>


                            <p
                              className="timeline-event-description"
                            >
                              {
                                event.description ||
                                "No additional information available."
                              }
                            </p>


                            {/* =============================
                                SOURCE
                            ============================= */}

                            <div
                              className="timeline-source"
                            >

                              <span>
                                Source
                              </span>

                              <strong>
                                {
                                  getDocumentName(
                                    event
                                  )
                                }
                              </strong>

                            </div>


                            {/* =============================
                                EVIDENCE
                            ============================= */}

                            {event.evidence && (

                              <div
                                className="timeline-evidence"
                              >

                                <span>
                                  AI evidence
                                </span>

                                <p>
                                  "
                                  {
                                    event.evidence
                                  }
                                  "
                                </p>

                              </div>

                            )}


                            {/* =============================
                                FOOTER
                            ============================= */}

                            <div
                              className="timeline-event-footer"
                            >

                              <span
                                className={
                                  `timeline-importance ${importance}`
                                }
                              >
                                {importance}
                                {" "}
                                importance
                              </span>


                              <span
                                className="timeline-confidence"
                              >
                                AI confidence:{" "}
                                {
                                  Number(
                                    event.confidence ||
                                    0
                                  )
                                }%
                              </span>


                              <button
                                type="button"
                                disabled={
                                  deleting
                                }
                                onClick={() =>
                                  deleteEvent(
                                    event._id
                                  )
                                }
                              >
                                {deleting
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </div>

                          </div>

                        </article>

                      );

                    }
                  )}

                </div>

              </div>

            )
          )}

        </section>

      )}

    </main>

  );
};

export default Timeline;