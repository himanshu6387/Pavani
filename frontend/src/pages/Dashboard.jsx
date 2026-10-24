import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ReminderPanel from "../components/ReminderPanel";
import AskLifeVault from "../components/AskLifeVault";
import SmartSearch from "../components/SmartSearch";
import CreateReminder from "../components/CreateReminder";

import api, { authAPI } from "../services/api";

import "../styles/Dashboard.css";
import "../styles/SmartSearch.css";
import "../styles/AskLifeVault.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // ============================================================
  // LOAD DOCUMENTS
  // ============================================================

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/documents");

      setDocuments(
        response.data?.documents ||
        response.data?.data ||
        []
      );
    } catch (err) {
      console.error("Dashboard document error:", err);

      setError(
        err.response?.data?.message ||
        "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await authAPI.logout();
    } catch (err) {
      console.warn("Logout API error:", err);
    } finally {
      // Clear every possible auth key
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");

      navigate("/login", {
        replace: true,
      });

      setLoggingOut(false);
    }
  };

  // ============================================================
  // EXPIRING DOCUMENTS
  // ============================================================

  const expiringDocuments = documents.filter((document) => {
    if (!document.expiryDate) {
      return false;
    }

    const now = new Date();

    const expiry = new Date(
      document.expiryDate
    );

    const thirtyDaysLater = new Date();

    thirtyDaysLater.setDate(
      thirtyDaysLater.getDate() + 30
    );

    return (
      expiry >= now &&
      expiry <= thirtyDaysLater
    );
  });

  // ============================================================
  // AI ANALYZED DOCUMENTS
  // ============================================================

  const analyzedDocuments = documents.filter(
    (document) =>
      document.aiProcessed === true ||
      document.aiStatus === "completed" ||
      document.status === "completed"
  );

  // ============================================================
  // CATEGORIES
  // ============================================================

  const categories = new Set(
    documents
      .map((document) => document.category)
      .filter(Boolean)
  );

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
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
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="dashboard-page">

        <div className="dashboard-loading">

          <div className="dashboard-loading-spinner" />

          <div>
            <strong>
              Loading LifeVault
            </strong>

            <span>
              Preparing your private vault...
            </span>
          </div>

        </div>

      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <main className="dashboard-page">

        <div className="dashboard-error">

          <div className="dashboard-error-icon">
            !
          </div>

          <h2>
            Something went wrong
          </h2>

          <p>
            {error}
          </p>

          <button
            className="dashboard-retry-button"
            onClick={loadDocuments}
          >
            Try again
          </button>

        </div>

      </main>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="dashboard-page">

      {/* ======================================================
          TOP NAVIGATION
      ====================================================== */}

      <nav className="dashboard-navbar">

        {/* BRAND */}

        <button
          className="dashboard-brand"
          onClick={() => navigate("/dashboard")}
        >

          <span className="dashboard-brand-mark">
            LV
          </span>

          <span className="dashboard-brand-text">
            LifeVault
            <small>AI</small>
          </span>

        </button>


        {/* NAV LINKS */}

        <div className="dashboard-nav-links">

          <button
            className="dashboard-nav-link active"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className="dashboard-nav-link"
            onClick={() =>
              navigate("/documents")
            }
          >
            Documents
          </button>

          <button
            className="dashboard-nav-link"
            onClick={() =>
              navigate("/timeline")
            }
          >
            Timeline
          </button>

          <button
            className="dashboard-nav-link"
            onClick={() =>
              navigate("/compare")
            }
          >
            Compare
          </button>

          <button
            className="dashboard-nav-link"
            onClick={() =>
              navigate("/form-filling")
            }
          >
            AI Forms
          </button>

        </div>


        {/* RIGHT ACTIONS */}

        <div className="dashboard-nav-actions">

          <button
            className="dashboard-add-button"
            onClick={() =>
              navigate("/documents/upload")
            }
          >
            <span>+</span>
            Add document
          </button>

          <button
            className="dashboard-logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </button>

        </div>

      </nav>


      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="dashboard-header">

        <div>

          <span className="section-eyebrow">
            YOUR PERSONAL VAULT
          </span>

          <h1>
            LifeVault Dashboard
          </h1>

          <p>
            Everything important, organized,
            understood and ready to use.
          </p>

        </div>

        <button
          className="dashboard-header-upload"
          onClick={() =>
            navigate("/documents/upload")
          }
        >
          <span>+</span>
          Add document
        </button>

      </section>


      {/* ======================================================
          AI HERO
      ====================================================== */}

      <section className="dashboard-ai-banner">

        <div className="dashboard-ai-content">

          <span className="dashboard-ai-badge">
            ✦ LIFEVAULT AI
          </span>

          <h2>
            Your documents are becoming intelligent.
          </h2>

          <p>
            Search your documents, ask questions,
            compare information and discover
            important events automatically.
          </p>

          <div className="dashboard-ai-actions">

            <button
              onClick={() =>
                navigate("/documents")
              }
            >
              Explore documents
              <span>→</span>
            </button>

            <button
              className="secondary"
              onClick={() =>
                navigate("/timeline")
              }
            >
              View timeline
            </button>

          </div>

        </div>

        <div className="dashboard-ai-visual">

          <div className="dashboard-ai-orbit orbit-one" />
          <div className="dashboard-ai-orbit orbit-two" />

          <div className="dashboard-ai-core">
            AI
          </div>

        </div>

      </section>


      {/* ======================================================
          SMART SEARCH
      ====================================================== */}

      <section className="dashboard-feature-section">

        <div className="dashboard-feature-heading">

          <div>

            <span className="section-eyebrow">
              INTELLIGENT SEARCH
            </span>

            <h2>
              Find anything in your vault
            </h2>

            <p>
              Search across your documents instantly.
            </p>

          </div>

        </div>

        <SmartSearch />

      </section>


      {/* ======================================================
          ASK LIFEVAULT
      ====================================================== */}

      <section className="dashboard-feature-section">

        <div className="dashboard-feature-heading">

          <div>

            <span className="section-eyebrow">
              AI ASSISTANT
            </span>

            <h2>
              Ask LifeVault
            </h2>

            <p>
              Ask questions and get answers
              from your own documents.
            </p>

          </div>

        </div>

        <AskLifeVault />

      </section>


      {/* ======================================================
          STATS
      ====================================================== */}

      <section className="dashboard-stats">

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-top">

            <span>
              TOTAL DOCUMENTS
            </span>

            <div className="dashboard-stat-icon">
              DOC
            </div>

          </div>

          <strong>
            {documents.length}
          </strong>

          <p>
            Stored securely in your vault
          </p>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-top">

            <span>
              AI ANALYZED
            </span>

            <div className="dashboard-stat-icon purple">
              AI
            </div>

          </div>

          <strong>
            {analyzedDocuments.length}
          </strong>

          <p>
            Documents understood by AI
          </p>

        </div>


        <div
          className={
            `dashboard-stat-card ${
              expiringDocuments.length > 0
                ? "attention"
                : ""
            }`
          }
        >

          <div className="dashboard-stat-top">

            <span>
              EXPIRING SOON
            </span>

            <div className="dashboard-stat-icon orange">
              !
            </div>

          </div>

          <strong>
            {expiringDocuments.length}
          </strong>

          <p>
            Documents expiring within 30 days
          </p>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-top">

            <span>
              CATEGORIES
            </span>

            <div className="dashboard-stat-icon green">
              #
            </div>

          </div>

          <strong>
            {categories.size}
          </strong>

          <p>
            Organized areas in your vault
          </p>

        </div>

      </section>


      {/* ======================================================
          QUICK TOOLS
      ====================================================== */}

      <section className="dashboard-tools-section">

        <div className="dashboard-section-heading">

          <div>

            <span className="section-eyebrow">
              INTELLIGENT TOOLS
            </span>

            <h2>
              Explore LifeVault
            </h2>

            <p>
              Powerful tools for your personal documents.
            </p>

          </div>

        </div>


        <div className="dashboard-tools-grid">

          <button
            className="dashboard-tool-card"
            onClick={() =>
              navigate("/documents")
            }
          >

            <div className="dashboard-tool-icon">
              DOC
            </div>

            <div>
              <h3>
                My Documents
              </h3>

              <p>
                Browse, open and manage your
                complete document vault.
              </p>
            </div>

            <span className="dashboard-tool-arrow">
              →
            </span>

          </button>


          <button
            className="dashboard-tool-card"
            onClick={() =>
              navigate("/timeline")
            }
          >

            <div className="dashboard-tool-icon purple">
              TL
            </div>

            <div>
              <h3>
                AI Timeline
              </h3>

              <p>
                Discover important events
                extracted from your documents.
              </p>
            </div>

            <span className="dashboard-tool-arrow">
              →
            </span>

          </button>


          <button
            className="dashboard-tool-card"
            onClick={() =>
              navigate("/compare")
            }
          >

            <div className="dashboard-tool-icon blue">
              ⇄
            </div>

            <div>
              <h3>
                Compare Documents
              </h3>

              <p>
                Find changes, differences
                and similarities using AI.
              </p>
            </div>

            <span className="dashboard-tool-arrow">
              →
            </span>

          </button>


          <button
            className="dashboard-tool-card"
            onClick={() =>
              navigate("/form-filling")
            }
          >

            <div className="dashboard-tool-icon green">
              AI
            </div>

            <div>
              <h3>
                AI Form Filling
              </h3>

              <p>
                Use information from your vault
                to complete forms faster.
              </p>
            </div>

            <span className="dashboard-tool-arrow">
              →
            </span>

          </button>


          <button
            className="dashboard-tool-card"
            onClick={() =>
              navigate("/expiry")
            }
          >

            <div className="dashboard-tool-icon orange">
              !
            </div>

            <div>
              <h3>
                Expiry Monitor
              </h3>

              <p>
                Keep track of important
                document expiration dates.
              </p>
            </div>

            <span className="dashboard-tool-arrow">
              →
            </span>

          </button>

        </div>

      </section>


      {/* ======================================================
          REMINDER CREATION
      ====================================================== */}

      <section className="dashboard-reminder-section">

        <div className="dashboard-section-heading">

          <div>

            <span className="section-eyebrow">
              SMART REMINDERS
            </span>

            <h2>
              Stay ahead of important dates
            </h2>

            <p>
              Create reminders for important
              documents and events.
            </p>

          </div>

        </div>

        <CreateReminder
          onCreated={() => {
            loadDocuments();
          }}
        />

      </section>


      {/* ======================================================
          REMINDER PANEL
      ====================================================== */}

      <section className="dashboard-reminder-panel">

        <ReminderPanel />

      </section>


      {/* ======================================================
          EXPIRING DOCUMENTS
      ====================================================== */}

      {expiringDocuments.length > 0 && (

        <section className="expiring-documents">

          <div className="dashboard-section-heading">

            <div>

              <span className="section-eyebrow">
                ATTENTION NEEDED
              </span>

              <h2>
                Expiring Documents
              </h2>

              <p>
                These documents may need your attention.
              </p>

            </div>

            <button
              className="expiry-view-button"
              onClick={() =>
                navigate("/expiry")
              }
            >
              View all →
            </button>

          </div>


          <div className="expiring-list">

            {expiringDocuments.map(
              (document) => (

                <button
                  className="expiring-item"
                  key={document._id}
                  onClick={() =>
                    navigate(
                      `/documents/${document._id}`
                    )
                  }
                >

                  <div className="expiring-file-icon">
                    !
                  </div>


                  <div className="expiring-info">

                    <h3>
                      {document.originalName ||
                        document.name ||
                        "Untitled document"}
                    </h3>

                    <p>
                      {document.category ||
                        "Other"}
                    </p>

                  </div>


                  <div className="expiring-date">

                    <span>
                      EXPIRY
                    </span>

                    <strong>
                      {formatDate(
                        document.expiryDate
                      )}
                    </strong>

                  </div>


                  <span className="expiring-arrow">
                    →
                  </span>

                </button>

              )
            )}

          </div>

        </section>

      )}


      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {documents.length === 0 && (

        <section className="dashboard-empty">

          <div className="dashboard-empty-icon">
            +
          </div>

          <h2>
            Your LifeVault is ready
          </h2>

          <p>
            Upload your first document to start
            building your intelligent personal vault.
          </p>

          <button
            onClick={() =>
              navigate("/documents/upload")
            }
          >
            Upload your first document
          </button>

        </section>

      )}


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="dashboard-footer">

        <div>
          <strong>
            LifeVault AI
          </strong>

          <span>
            Your private intelligent document vault.
          </span>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut
            ? "Logging out..."
            : "Logout"}
        </button>

      </footer>

    </main>
  );
};

export default Dashboard;