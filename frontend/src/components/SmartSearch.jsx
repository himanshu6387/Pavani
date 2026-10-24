import React, {
  useState,
} from "react";

import api from "../services/api";

import "../styles/SmartSearch.css";

// ============================================================
// CATEGORIES
// ============================================================

const CATEGORIES = [
  "all",
  "medical",
  "insurance",
  "financial",
  "legal",
  "education",
  "government",
  "work",
  "personal",
  "other",
];

// ============================================================
// SMART SEARCH
// ============================================================

function SmartSearch() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [query, setQuery] =
    useState("");

  const [category, setCategory] =
    useState("all");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searched, setSearched] =
    useState(false);

  // ==========================================================
  // SEARCH DOCUMENTS
  // ==========================================================

  const searchDocuments = async (
    searchText = query,
    selectedCategory = category
  ) => {
    try {
      // ------------------------------------------------------
      // CLEAN VALUES
      // ------------------------------------------------------

      const cleanQuery =
        typeof searchText === "string"
          ? searchText.trim()
          : "";

      const cleanCategory =
        typeof selectedCategory === "string"
          ? selectedCategory
              .trim()
              .toLowerCase()
          : "all";

      // ------------------------------------------------------
      // EMPTY SEARCH + ALL CATEGORY
      // ------------------------------------------------------

      /*
        Do NOT send:

        /api/search?q=&category=all

        because that was producing unnecessary
        bad requests in the previous implementation.
      */

      if (
        !cleanQuery &&
        cleanCategory === "all"
      ) {
        setResults([]);

        setSearched(false);

        setError("");

        return;
      }

      // ------------------------------------------------------
      // START LOADING
      // ------------------------------------------------------

      setLoading(true);

      setError("");

      setSearched(true);

      // ------------------------------------------------------
      // QUERY PARAMETERS
      // ------------------------------------------------------

      const params = {};

      // ------------------------------------------------------
      // SEARCH TEXT
      // ------------------------------------------------------

      if (cleanQuery) {
        params.q = cleanQuery;
      }

      // ------------------------------------------------------
      // CATEGORY
      // ------------------------------------------------------

      if (
        cleanCategory &&
        cleanCategory !== "all"
      ) {
        params.category =
          cleanCategory;
      }

      // ------------------------------------------------------
      // DEBUG
      // ------------------------------------------------------

      console.log(
        "Smart Search request:",
        params
      );

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response =
        await api.get(
          "/search",
          {
            params,
          }
        );

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      const data =
        response?.data || {};

      console.log(
        "Smart Search response:",
        data
      );

      // ------------------------------------------------------
      // DOCUMENTS
      // ------------------------------------------------------

      if (
        Array.isArray(
          data.documents
        )
      ) {
        setResults(
          data.documents
        );
      }

      else if (
        Array.isArray(
          data.results
        )
      ) {
        setResults(
          data.results
        );
      }

      else if (
        Array.isArray(data)
      ) {
        setResults(data);
      }

      else {
        setResults([]);
      }

    } catch (err) {
      // ------------------------------------------------------
      // ERROR
      // ------------------------------------------------------

      console.error(
        "Search error:",
        err
      );

      setResults([]);

      setError(
        err?.response?.data?.message ||
          "Unable to search documents."
      );

    } finally {
      // ------------------------------------------------------
      // STOP LOADING
      // ------------------------------------------------------

      setLoading(false);
    }
  };

  // ==========================================================
  // CATEGORY CHANGE
  // ==========================================================

  const handleCategoryChange = (
    newCategory
  ) => {
    // ------------------------------------------------------
    // UPDATE CATEGORY
    // ------------------------------------------------------

    setCategory(
      newCategory
    );

    // ------------------------------------------------------
    // QUERY EXISTS
    // ------------------------------------------------------

    if (
      query.trim()
    ) {
      searchDocuments(
        query,
        newCategory
      );

      return;
    }

    // ------------------------------------------------------
    // CATEGORY SELECTED
    // ------------------------------------------------------

    if (
      newCategory !== "all"
    ) {
      searchDocuments(
        "",
        newCategory
      );

      return;
    }

    // ------------------------------------------------------
    // ALL SELECTED
    // ------------------------------------------------------

    setResults([]);

    setSearched(false);

    setError("");
  };

  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    searchDocuments(
      query,
      category
    );
  };

  // ==========================================================
  // CLEAR SEARCH
  // ==========================================================

  const clearSearch = () => {
    setQuery("");

    setResults([]);

    setError("");

    setSearched(false);
  };

  // ==========================================================
  // GET TITLE
  // ==========================================================

  const getTitle = (
    document
  ) => {
    return (
      document?.title ||
      document?.originalName ||
      document?.fileName ||
      document?.name ||
      "Untitled document"
    );
  };

  // ==========================================================
  // GET CATEGORY
  // ==========================================================

  const getCategory = (
    document
  ) => {
    return (
      document?.category ||
      "Other"
    );
  };

  // ==========================================================
  // GET SUMMARY
  // ==========================================================

  const getSummary = (
    document
  ) => {
    return (
      document?.aiSummary ||
      document?.summary ||
      document?.description ||
      "No summary available."
    );
  };

  // ==========================================================
  // GET ID
  // ==========================================================

  const getId = (
    document
  ) => {
    return (
      document?._id ||
      document?.id
    );
  };

  // ==========================================================
  // FORMAT CATEGORY LABEL
  // ==========================================================

  const formatCategory =
    (value) => {
      if (!value) {
        return "All";
      }

      return (
        value
          .charAt(0)
          .toUpperCase() +
        value.slice(1)
      );
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="smart-search">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="smart-search-header">

        <div>

          <span className="section-label">
            YOUR VAULT
          </span>

          <h2>
            Find a document
          </h2>

          <p>
            Search across your
            LifeVault instantly.
          </p>

        </div>

      </div>

      {/* ======================================================
          SEARCH FORM
      ====================================================== */}

      <form
        className="smart-search-form"
        onSubmit={
          handleSubmit
        }
      >

        <div className="search-input-wrapper">

          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(
                event.target.value
              );
            }}
            placeholder="Search documents, policies, medical records..."
          />

          {query && (
            <button
              type="button"
              className="clear-search"
              onClick={
                clearSearch
              }
              aria-label="Clear search"
            >
              ×
            </button>
          )}

        </div>

        <button
          type="submit"
          className="search-button"
          disabled={loading}
        >
          {loading
            ? "Searching..."
            : "Search"}
        </button>

      </form>

      {/* ======================================================
          CATEGORY FILTERS
      ====================================================== */}

      <div className="search-categories">

        {CATEGORIES.map(
          (item) => (
            <button
              key={item}
              type="button"
              className={
                category === item
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() =>
                handleCategoryChange(
                  item
                )
              }
            >
              {formatCategory(
                item
              )}
            </button>
          )
        )}

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div className="search-loading">
          Searching your vault...
        </div>
      )}

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {!loading &&
        searched &&
        !error && (

          <div className="search-results">

            {/* ==================================================
                NO RESULTS
            ================================================== */}

            {results.length === 0 ? (

              <div className="no-results">

                <div className="no-results-icon">
                  🔎
                </div>

                <h3>
                  No documents found
                </h3>

                <p>
                  Try another search
                  or category.
                </p>

              </div>

            ) : (

              <>

                {/* ==============================================
                    RESULT COUNT
                ============================================== */}

                <div className="results-count">

                  {results.length}{" "}

                  {results.length === 1
                    ? "document"
                    : "documents"}

                  {" "}found

                </div>

                {/* ==============================================
                    RESULT GRID
                ============================================== */}

                <div className="results-grid">

                  {results.map(
                    (document) => {

                      const id =
                        getId(
                          document
                        );

                      return (

                        <div
                          className="search-result-card"
                          key={
                            id ||
                            document?.originalName ||
                            document?.fileName
                          }
                        >

                          {/* ==================================
                              CARD TOP
                          ================================== */}

                          <div className="result-card-top">

                            <div className="document-icon">
                              DOC
                            </div>

                            <span className="result-category">
                              {
                                getCategory(
                                  document
                                )
                              }
                            </span>

                          </div>

                          {/* ==================================
                              TITLE
                          ================================== */}

                          <h3>
                            {
                              getTitle(
                                document
                              )
                            }
                          </h3>

                          {/* ==================================
                              SUMMARY
                          ================================== */}

                          <p>
                            {
                              getSummary(
                                document
                              )
                            }
                          </p>

                          {/* ==================================
                              VIEW DOCUMENT
                          ================================== */}

                          {id && (
                            <a
                              href={`/documents/${id}`}
                              className="view-document"
                            >
                              View document →
                            </a>
                          )}

                        </div>

                      );

                    }
                  )}

                </div>

              </>

            )}

          </div>

        )}

    </section>
  );
}

// ============================================================
// EXPORT
// ============================================================

export default SmartSearch;