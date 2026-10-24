import React, { useEffect, useState } from "react";

import api from "../services/api";


const CreateReminder = ({ onCreated }) => {

  // ============================================================
  // STATE
  // ============================================================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [type, setType] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [documentId, setDocumentId] = useState("");

  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // ============================================================
  // LOAD DOCUMENTS
  // ============================================================

  const loadDocuments = async () => {

    try {

      setDocumentsLoading(true);

      const response =
        await api.get("/documents");

      setDocuments(
        response.data?.documents || []
      );

    } catch (error) {

      console.error(
        "Load documents error:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | Don't overwrite the whole dashboard.
      | If documents fail, reminder creation can still work without
      | selecting a related document.
      |--------------------------------------------------------------------------
      */

      setDocuments([]);

    } finally {

      setDocumentsLoading(false);

    }

  };


  // ============================================================
  // LOAD ON MOUNT
  // ============================================================

  useEffect(() => {

    loadDocuments();

  }, []);


  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {

    setTitle("");
    setDescription("");
    setReminderDate("");
    setType("general");
    setPriority("medium");
    setDocumentId("");

  };


  // ============================================================
  // CREATE REMINDER
  // ============================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!title.trim()) {

      setError(
        "Please enter a reminder title."
      );

      return;

    }


    if (!reminderDate) {

      setError(
        "Please select a reminder date."
      );

      return;

    }


    // ==========================================================
    // DATE
    // ==========================================================

    const selectedDate =
      new Date(reminderDate);


    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {

      setError(
        "Please select a valid date."
      );

      return;

    }


    // ==========================================================
    // PREVENT INVALID PAST DATE
    // ==========================================================

    if (
      selectedDate.getTime() <
      Date.now()
    ) {

      setError(
        "Reminder date cannot be in the past."
      );

      return;

    }


    // ==========================================================
    // PAYLOAD
    // ==========================================================

    const payload = {

      title: title.trim(),

      description:
        description.trim(),

      reminderDate:
        selectedDate.toISOString(),

      type,

      priority,

    };


    if (documentId) {

      payload.document =
        documentId;

    }


    // ==========================================================
    // API REQUEST
    // ==========================================================

    try {

      setLoading(true);

      const response =
        await api.post(
          "/reminders",
          payload
        );


      console.log(
        "Reminder created:",
        response.data
      );


      setSuccess(
        "Reminder created successfully."
      );


      resetForm();


      // ========================================================
      // REFRESH PARENT
      // ========================================================

      if (onCreated) {

        await onCreated(
          response.data?.reminder
        );

      }

    } catch (error) {

      console.error(
        "Create reminder error:",
        error
      );


      /*
      |--------------------------------------------------------------------------
      | 401 is handled centrally by api.js.
      |--------------------------------------------------------------------------
      */

      setError(
        error.response
          ?.data
          ?.message ||
        "Unable to create reminder."
      );

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // UI
  // ============================================================

  return (

    <section
      style={{
        marginTop: "24px",
        padding: "28px",
        background: "#ffffff",
        border:
          "1px solid #e5e7eb",
        borderRadius: "18px",
      }}
    >

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div
        style={{
          marginBottom: "22px",
        }}
      >

        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "2px",
            color: "#64748b",
          }}
        >
          LIFEVAULT AI
        </span>

        <h2
          style={{
            margin:
              "6px 0 6px",
            color: "#172033",
          }}
        >
          Create a Reminder
        </h2>

        <p
          style={{
            margin: 0,
            color: "#64748b",
          }}
        >
          Never forget an important
          document or task.
        </p>

      </div>


      {/* ========================================================
          SUCCESS
      ======================================================== */}

      {success && (

        <div
          style={{
            marginBottom: "18px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#ecfdf5",
            color: "#047857",
            border:
              "1px solid #a7f3d0",
          }}
        >
          {success}
        </div>

      )}


      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (

        <div
          style={{
            marginBottom: "18px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            border:
              "1px solid #fecaca",
          }}
        >
          {error}
        </div>

      )}


      {/* ========================================================
          FORM
      ======================================================== */}

      <form
        onSubmit={handleSubmit}
      >

        {/* ======================================================
            TITLE
        ====================================================== */}

        <div
          style={{
            marginBottom: "18px",
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Reminder title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="e.g. Renew health insurance"
            maxLength={150}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding:
                "13px 14px",
              border:
                "1px solid #d1d5db",
              borderRadius: "10px",
              outline: "none",
              fontSize: "14px",
            }}
          />

        </div>


        {/* ======================================================
            DESCRIPTION
        ====================================================== */}

        <div
          style={{
            marginBottom: "18px",
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Add some details..."
            rows={4}
            maxLength={1000}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding:
                "13px 14px",
              border:
                "1px solid #d1d5db",
              borderRadius: "10px",
              outline: "none",
              fontSize: "14px",
              resize: "vertical",
            }}
          />

        </div>


        {/* ======================================================
            DATE
        ====================================================== */}

        <div
          style={{
            marginBottom: "18px",
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Reminder date & time
          </label>

          <input
            type="datetime-local"
            value={reminderDate}
            onChange={(event) =>
              setReminderDate(
                event.target.value
              )
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding:
                "13px 14px",
              border:
                "1px solid #d1d5db",
              borderRadius: "10px",
              outline: "none",
              fontSize: "14px",
            }}
          />

        </div>


        {/* ======================================================
            TWO COLUMN
        ====================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "18px",
          }}
        >

          {/* ====================================================
              TYPE
          ==================================================== */}

          <div>

            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Reminder type
            </label>

            <select
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "13px 14px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#fff",
                fontSize: "14px",
              }}
            >

              <option value="general">
                General
              </option>

              <option value="document">
                Document
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

              <option value="expiry">
                Expiry
              </option>

            </select>

          </div>


          {/* ====================================================
              PRIORITY
          ==================================================== */}

          <div>

            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Priority
            </label>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "13px 14px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#fff",
                fontSize: "14px",
              }}
            >

              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>

            </select>

          </div>

        </div>


        {/* ======================================================
            DOCUMENT
        ====================================================== */}

        <div
          style={{
            marginBottom: "22px",
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Related document
          </label>

          <select
            value={documentId}
            onChange={(event) =>
              setDocumentId(
                event.target.value
              )
            }
            disabled={
              documentsLoading
            }
            style={{
              width: "100%",
              padding:
                "13px 14px",
              border:
                "1px solid #d1d5db",
              borderRadius: "10px",
              background: "#fff",
              fontSize: "14px",
            }}
          >

            <option value="">
              {documentsLoading
                ? "Loading documents..."
                : "No document"}
            </option>

            {documents.map(
              (document) => (

                <option
                  key={
                    document._id
                  }
                  value={
                    document._id
                  }
                >
                  {
                    document.originalName
                  }
                </option>

              )
            )}

          </select>

        </div>


        {/* ======================================================
            SUBMIT
        ====================================================== */}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 18px",
            border: "none",
            borderRadius: "10px",
            background: "#111827",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "700",
            cursor: loading
              ? "not-allowed"
              : "pointer",
            opacity: loading
              ? 0.7
              : 1,
          }}
        >

          {loading
            ? "Creating reminder..."
            : "Create reminder"}

        </button>

      </form>

    </section>

  );

};


export default CreateReminder;