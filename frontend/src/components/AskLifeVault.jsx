import React, {
  useState,
} from "react";

import api from "../services/api";
import "../styles/AskLifeVault.css";
// ============================================================
// ASK LIFEVAULT COMPONENT
// ============================================================

const AskLifeVault = () => {
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
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ==========================================================
  // ASK AI
  // ==========================================================

  const handleAsk = async () => {
    const cleanQuestion =
      question.trim();

    if (!cleanQuestion) {
      return;
    }

    setLoading(true);

    setError("");

    setAnswer("");

    setSources([]);

    try {
      const response =
        await api.post(
          "/ask",
          {
            question:
              cleanQuestion,
          }
        );

      const data =
        response.data;

      if (
        data &&
        data.success
      ) {
        setAnswer(
          data.answer ||
            "I could not find enough information in your LifeVault documents."
        );

        setSources(
          Array.isArray(
            data.sources
          )
            ? data.sources
            : []
        );
      } else {
        setError(
          data?.message ||
            "Unable to get an AI answer."
        );
      }
    } catch (requestError) {
      console.error(
        "Ask LifeVault error:",
        requestError
      );

      const serverMessage =
        requestError?.response
          ?.data
          ?.message;

      setError(
        serverMessage ||
          "Unable to connect to LifeVault AI."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!loading) {
        handleAsk();
      }
    }
  };

  // ==========================================================
  // SUGGESTED QUESTIONS
  // ==========================================================

  const suggestions = [
    "What medical information do I have?",
    "What documents do I have?",
    "Which documents are expiring soon?",
    "Summarize my important documents.",
  ];

  // ==========================================================
  // USE SUGGESTION
  // ==========================================================

  const useSuggestion = (
    suggestion
  ) => {
    setQuestion(
      suggestion
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="ask-lifevault">
      <div className="ask-lifevault-header">
        <div>
          <div className="section-eyebrow">
            AI ASSISTANT
          </div>

          <h2>
            Ask LifeVault
          </h2>

          <p>
            Ask questions about
            your personal documents.
          </p>
        </div>

        <div className="ai-badge">
          AI
        </div>
      </div>

      {/* ====================================================
          QUESTION INPUT
      ==================================================== */}

      <div className="ask-input-row">
        <input
          type="text"
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
          placeholder="Ask anything about your vault..."
          maxLength={500}
          disabled={loading}
        />

        <button
          type="button"
          onClick={
            handleAsk
          }
          disabled={
            loading ||
            !question.trim()
          }
        >
          {loading
            ? "Thinking..."
            : "Ask AI"}
        </button>
      </div>

      {/* ====================================================
          SUGGESTIONS
      ==================================================== */}

      <div className="ask-suggestions">
        <span>
          Try asking:
        </span>

        <div className="suggestion-list">
          {suggestions.map(
            (
              suggestion
            ) => (
              <button
                key={
                  suggestion
                }
                type="button"
                onClick={() =>
                  useSuggestion(
                    suggestion
                  )
                }
              >
                {suggestion}
              </button>
            )
          )}
        </div>
      </div>

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading && (
        <div className="ask-result loading-result">
          <div className="result-label">
            AI IS THINKING
          </div>

          <p>
            Searching your
            LifeVault documents
            and preparing an
            answer...
          </p>
        </div>
      )}

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && !loading && (
        <div className="ask-result error-result">
          <div className="result-label">
            ERROR
          </div>

          <p>
            {error}
          </p>
        </div>
      )}

      {/* ====================================================
          ANSWER
      ==================================================== */}

      {answer &&
        !loading &&
        !error && (
          <div className="ask-result">
            <div className="result-label">
              AI ANSWER
            </div>

            <div className="answer-text">
              {answer}
            </div>

            {/* ============================================
                SOURCES
            ============================================ */}

            {sources.length >
              0 && (
              <div className="answer-sources">
                <h3>
                  Sources
                </h3>

                <div className="source-list">
                  {sources.map(
                    (
                      source,
                      index
                    ) => (
                      <div
                        className="source-item"
                        key={`${source.documentName}-${index}`}
                      >
                        <strong>
                          {source.documentName ||
                            "LifeVault document"}
                        </strong>

                        {source.reason && (
                          <span>
                            {
                              source.reason
                            }
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
    </section>
  );
};

export default AskLifeVault;