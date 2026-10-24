import React, {
  useEffect,
  useState,
} from "react";

import api from "../services/api";


const ReminderPanel = () => {

  // ============================================================
  // STATE
  // ============================================================

  const [
    reminders,
    setReminders,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    generating,
    setGenerating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  // ============================================================
  // LOAD REMINDERS
  // ============================================================

  const loadReminders =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await api.get(
            "/reminders"
          );


        setReminders(
          response.data
            ?.reminders || []
        );

      } catch (error) {

        console.error(
          "Reminder loading error:",
          error
        );


        setError(
          error.response
            ?.data?.message ||
          "Unable to load reminders."
        );

      } finally {

        setLoading(false);

      }

    };


  // ============================================================
  // GENERATE
  // ============================================================

  const generateReminders =
    async () => {

      try {

        setGenerating(true);

        setError("");


        await api.post(
          "/reminders/generate",
          {}
        );


        await loadReminders();

      } catch (error) {

        console.error(
          "Reminder generation error:",
          error
        );


        setError(
          error.response
            ?.data?.message ||
          "Unable to generate reminders."
        );

      } finally {

        setGenerating(false);

      }

    };


  // ============================================================
  // COMPLETE
  // ============================================================

  const completeReminder =
    async (id) => {

      try {

        await api.patch(
          `/reminders/${id}/complete`,
          {}
        );


        setReminders(
          (previous) =>
            previous.filter(
              (reminder) =>
                reminder._id !== id
            )
        );

      } catch (error) {

        console.error(
          "Complete reminder error:",
          error
        );

        setError(
          error.response
            ?.data?.message ||
          "Unable to complete reminder."
        );

      }
    };


  // ============================================================
  // DISMISS
  // ============================================================

  const dismissReminder =
    async (id) => {

      try {

        await api.patch(
          `/reminders/${id}/dismiss`,
          {}
        );


        setReminders(
          (previous) =>
            previous.filter(
              (reminder) =>
                reminder._id !== id
            )
        );

      } catch (error) {

        console.error(
          "Dismiss reminder error:",
          error
        );

        setError(
          error.response
            ?.data?.message ||
          "Unable to dismiss reminder."
        );

      }
    };


  // ============================================================
  // DELETE
  // ============================================================

  const deleteReminder =
    async (id) => {

      try {

        await api.delete(
          `/reminders/${id}`
        );


        setReminders(
          (previous) =>
            previous.filter(
              (reminder) =>
                reminder._id !== id
            )
        );

      } catch (error) {

        console.error(
          "Delete reminder error:",
          error
        );

        setError(
          error.response
            ?.data?.message ||
          "Unable to delete reminder."
        );

      }
    };


  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate =
    (date) => {

      if (!date) {
        return "No date";
      }


      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    };


  // ============================================================
  // DAYS LEFT
  // ============================================================

  const getDaysLeft =
    (date) => {

      const target =
        new Date(date);

      const now =
        new Date();


      const difference =
        target.getTime() -
        now.getTime();


      return Math.ceil(
        difference /
        (
          1000 *
          60 *
          60 *
          24
        )
      );

    };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadReminders();

  }, []);


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <section className="reminder-panel">

        <div className="reminder-header">

          <div>

            <span className="section-label">
              LIFEVAULT AI
            </span>

            <h2>
              Reminders
            </h2>

          </div>

        </div>

        <p>
          Loading reminders...
        </p>

      </section>

    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <section
      className="reminder-panel"
      style={{
        marginTop: "24px",
        padding: "28px",
        background: "#ffffff",
        borderRadius: "18px",
        border:
          "1px solid #e5e7eb",
      }}
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "20px",
          marginBottom:
            "20px",
        }}
      >

        <div>

          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing:
                "2px",
              color: "#64748b",
            }}
          >
            LIFEVAULT AI
          </span>

          <h2
            style={{
              margin:
                "6px 0 0",
            }}
          >
            Reminders
          </h2>

        </div>


        <button
          onClick={
            generateReminders
          }
          disabled={
            generating
          }
          style={{
            padding:
              "10px 16px",
            borderRadius:
              "10px",
            border: "none",
            background:
              "#111827",
            color: "#fff",
            cursor:
              generating
                ? "not-allowed"
                : "pointer",
            opacity:
              generating
                ? 0.7
                : 1,
          }}
        >

          {generating
            ? "Generating..."
            : "Generate reminders"}

        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          style={{
            padding:
              "12px 14px",
            marginBottom:
              "16px",
            background:
              "#fef2f2",
            color:
              "#b91c1c",
            borderRadius:
              "10px",
            border:
              "1px solid #fecaca",
          }}
        >

          {error}

        </div>

      )}


      {/* =====================================================
          EMPTY
      ===================================================== */}

      {reminders.length === 0 && (

        <div
          style={{
            padding:
              "30px 20px",
            textAlign:
              "center",
            background:
              "#f8fafc",
            borderRadius:
              "12px",
            color:
              "#64748b",
          }}
        >

          <h3
            style={{
              marginBottom:
                "8px",
              color:
                "#334155",
            }}
          >
            No pending reminders
          </h3>

          <p>
            Your important document
            reminders will appear here.
          </p>

        </div>

      )}


      {/* =====================================================
          REMINDER LIST
      ===================================================== */}

      {reminders.length > 0 && (

        <div
          style={{
            display:
              "flex",
            flexDirection:
              "column",
            gap: "12px",
          }}
        >

          {reminders.map(
            (reminder) => {

              const days =
                getDaysLeft(
                  reminder.reminderDate
                );


              return (

                <div
                  key={
                    reminder._id
                  }
                  style={{
                    padding:
                      "18px",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "14px",
                    background:
                      "#fff",
                  }}
                >

                  {/* TOP */}

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: "16px",
                    }}
                  >

                    <div>

                      <h3
                        style={{
                          margin:
                            "0 0 6px",
                        }}
                      >
                        {
                          reminder.title
                        }
                      </h3>


                      {reminder.description && (

                        <p
                          style={{
                            margin:
                              "0 0 8px",
                            color:
                              "#64748b",
                          }}
                        >
                          {
                            reminder.description
                          }
                        </p>

                      )}


                      <div
                        style={{
                          fontSize:
                            "13px",
                          color:
                            "#64748b",
                        }}
                      >

                        Due:{" "}

                        {
                          formatDate(
                            reminder.reminderDate
                          )
                        }

                      </div>


                      {reminder.document && (

                        <div
                          style={{
                            marginTop:
                              "6px",
                            fontSize:
                              "13px",
                          }}
                        >

                          Document:{" "}

                          {
                            reminder
                              .document
                              .originalName
                          }

                        </div>

                      )}

                    </div>


                    {/* PRIORITY */}

                    <span
                      style={{
                        height:
                          "fit-content",
                        padding:
                          "5px 10px",
                        borderRadius:
                          "999px",
                        fontSize:
                          "12px",
                        fontWeight:
                          "700",
                        background:
                          reminder.priority ===
                          "high"
                            ? "#fee2e2"
                            : reminder.priority ===
                              "low"
                            ? "#dcfce7"
                            : "#fef3c7",
                        color:
                          reminder.priority ===
                          "high"
                            ? "#b91c1c"
                            : reminder.priority ===
                              "low"
                            ? "#166534"
                            : "#92400e",
                      }}
                    >

                      {
                        reminder.priority
                      }

                    </span>

                  </div>


                  {/* DAYS */}

                  <div
                    style={{
                      marginTop:
                        "12px",
                      fontSize:
                        "13px",
                      fontWeight:
                        "600",
                    }}
                  >

                    {days < 0
                      ? "Overdue"
                      : days === 0
                      ? "Due today"
                      : `${days} day${
                          days === 1
                            ? ""
                            : "s"
                        } remaining`}

                  </div>


                  {/* ACTIONS */}

                  <div
                    style={{
                      display:
                        "flex",
                      gap:
                        "8px",
                      marginTop:
                        "14px",
                      flexWrap:
                        "wrap",
                    }}
                  >

                    <button
                      onClick={() =>
                        completeReminder(
                          reminder._id
                        )
                      }
                      style={{
                        padding:
                          "8px 12px",
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
                      Complete
                    </button>


                    <button
                      onClick={() =>
                        dismissReminder(
                          reminder._id
                        )
                      }
                      style={{
                        padding:
                          "8px 12px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                        background:
                          "#fff",
                        cursor:
                          "pointer",
                      }}
                    >
                      Dismiss
                    </button>


                    <button
                      onClick={() =>
                        deleteReminder(
                          reminder._id
                        )
                      }
                      style={{
                        padding:
                          "8px 12px",
                        border:
                          "1px solid #fecaca",
                        borderRadius:
                          "8px",
                        background:
                          "#fff",
                        color:
                          "#dc2626",
                        cursor:
                          "pointer",
                      }}
                    >
                      Delete
                    </button>

                  </div>

                </div>

              );

            }
          )}

        </div>

      )}

    </section>

  );

};


export default ReminderPanel;