import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/FormFilling.css";
const FormFilling = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [documents, setDocuments] = useState([]);

  const [selectedDocuments, setSelectedDocuments] =
    useState([]);

  const [formName, setFormName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [fields, setFields] =
    useState([
      {
        fieldName: "fullName",
        label: "Full Name",
        fieldType: "text",
        required: true
      },
      {
        fieldName: "dateOfBirth",
        label: "Date of Birth",
        fieldType: "date",
        required: false
      },
      {
        fieldName: "address",
        label: "Address",
        fieldType: "address",
        required: false
      }
    ]);

  const [loadingDocuments, setLoadingDocuments] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");

  // ==========================================================
  // LOAD DOCUMENTS
  // ==========================================================

  useEffect(() => {

    const loadDocuments = async () => {

      try {

        setLoadingDocuments(true);
        setError("");

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
          "Documents loading error:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to load documents."
        );

      } finally {

        setLoadingDocuments(false);

      }

    };

    loadDocuments();

  }, []);

  // ==========================================================
  // TOGGLE DOCUMENT
  // ==========================================================

  const toggleDocument = (
    documentId
  ) => {

    setSelectedDocuments(
      (previous) => {

        if (
          previous.includes(
            documentId
          )
        ) {

          return previous.filter(
            (id) =>
              id !== documentId
          );

        }

        return [
          ...previous,
          documentId
        ];

      }
    );

  };

  // ==========================================================
  // ADD FIELD
  // ==========================================================

  const addField = () => {

    const index =
      fields.length + 1;

    setFields(
      (previous) => [

        ...previous,

        {
          fieldName:
            `field${index}`,

          label:
            `Field ${index}`,

          fieldType:
            "text",

          required:
            false
        }

      ]
    );

  };

  // ==========================================================
  // UPDATE FIELD
  // ==========================================================

  const updateField = (
    index,
    key,
    value
  ) => {

    setFields(
      (previous) => {

        const updated =
          [...previous];

        updated[index] = {
          ...updated[index],
          [key]: value
        };

        return updated;

      }
    );

  };

  // ==========================================================
  // DELETE FIELD
  // ==========================================================

  const deleteField = (
    index
  ) => {

    setFields(
      (previous) =>
        previous.filter(
          (_, fieldIndex) =>
            fieldIndex !== index
        )
    );

  };

  // ==========================================================
  // GENERATE
  // ==========================================================

  const generateSuggestions =
    async () => {

      try {

        setError("");

        setResult(null);

        if (
          !formName.trim()
        ) {

          setError(
            "Please enter a form name."
          );

          return;

        }

        if (
          fields.length === 0
        ) {

          setError(
            "Add at least one form field."
          );

          return;

        }

        setGenerating(true);

        const response =
          await api.post(
            "/form-fill/generate",
            {

              formName:
                formName.trim(),

              description:
                description.trim(),

              documentIds:
                selectedDocuments,

              fields

            }
          );

        console.log(
          "Form filling response:",
          response.data
        );

        setResult(
          response.data?.form ||
          response.data?.data ||
          null
        );

      } catch (err) {

        console.error(
          "Form filling error:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to generate form suggestions."
        );

      } finally {

        setGenerating(false);

      }

    };

  // ==========================================================
  // UPDATE RESULT FIELD
  // ==========================================================

  const updateResultField = (
    fieldId,
    value
  ) => {

    setResult(
      (previous) => {

        if (!previous) {
          return previous;
        }

        return {

          ...previous,

          fields:
            previous.fields.map(
              (field) =>
                field._id === fieldId
                  ? {
                      ...field,
                      finalValue:
                        value
                    }
                  : field
            )

        };

      }
    );

  };

  // ==========================================================
  // VERIFY FIELD
  // ==========================================================

  const verifyField = async (
    field
  ) => {

    if (!result?._id) {
      return;
    }

    try {

      const response =
        await api.patch(
          `/form-fill/${result._id}/field/${field._id}`,
          {

            finalValue:
              field.finalValue ||
              field.suggestedValue ||
              "",

            verified:
              true

          }
        );

      setResult(
        response.data?.form ||
        result
      );

    } catch (err) {

      console.error(
        "Field verification error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to verify field."
      );

    }

  };

  // ==========================================================
  // FORMAT CONFIDENCE
  // ==========================================================

  const getConfidenceClass = (
    confidence
  ) => {

    const value =
      Number(
        confidence || 0
      );

    if (value >= 85) {
      return "high";
    }

    if (value >= 60) {
      return "medium";
    }

    return "low";

  };

  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <main
      className="form-filling-page"
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="form-filling-header"
      >

        <div>

          <span
            className="section-eyebrow"
          >
            LIFEVAULT INTELLIGENCE
          </span>

          <h1>
            AI Form Filling
          </h1>

          <p>
            Let LifeVault find information from
            your documents and suggest values for
            your form.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/documents"
            )
          }
        >
          My Documents
        </button>

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <div
          className="form-filling-error"
        >

          {error}

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


      <div
        className="form-filling-layout"
      >

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <section
          className="form-builder-card"
        >

          <div
            className="form-card-heading"
          >

            <div>

              <span>
                01
              </span>

              <h2>
                Describe your form
              </h2>

            </div>

          </div>


          {/* =================================================
              FORM NAME
          ================================================= */}

          <label>
            Form name
          </label>

          <input
            type="text"
            value={formName}
            placeholder="e.g. Insurance Claim Form"
            onChange={(event) =>
              setFormName(
                event.target.value
              )
            }
          />


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <label>
            Description
          </label>

          <textarea
            value={description}
            placeholder="Tell AI what this form is for..."
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
          />


          {/* =================================================
              DOCUMENTS
          ================================================= */}

          <div
            className="form-section-heading"
          >

            <div>

              <span>
                02
              </span>

              <h2>
                Choose source documents
              </h2>

            </div>

          </div>


          <p
            className="form-helper-text"
          >
            Select the documents LifeVault should
            use to find your information.
          </p>


          {loadingDocuments ? (

            <div
              className="form-loading"
            >
              Loading documents...
            </div>

          ) : documents.length === 0 ? (

            <div
              className="form-no-documents"
            >

              <strong>
                No documents found.
              </strong>

              <p>
                Upload documents first so AI can
                use them as a trusted source.
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
              className="source-document-list"
            >

              {documents.map(
                (document) => {

                  const id =
                    document._id;

                  const selected =
                    selectedDocuments.includes(
                      id
                    );

                  return (

                    <button
                      type="button"
                      className={
                        selected
                          ? "source-document selected"
                          : "source-document"
                      }
                      key={id}
                      onClick={() =>
                        toggleDocument(
                          id
                        )
                      }
                    >

                      <div
                        className="source-document-check"
                      >
                        {selected
                          ? "✓"
                          : ""}
                      </div>

                      <div
                        className="source-document-info"
                      >

                        <strong>
                          {
                            document.originalName ||
                            document.name ||
                            "Untitled document"
                          }
                        </strong>

                        <span>
                          {
                            document.category ||
                            document.documentType ||
                            "Document"
                          }
                        </span>

                      </div>

                    </button>

                  );

                }
              )}

            </div>

          )}


          {/* =================================================
              FIELD BUILDER
          ================================================= */}

          <div
            className="form-section-heading"
          >

            <div>

              <span>
                03
              </span>

              <h2>
                Form fields
              </h2>

            </div>

            <button
              type="button"
              onClick={
                addField
              }
            >
              + Add field
            </button>

          </div>


          <div
            className="form-field-builder"
          >

            {fields.map(
              (
                field,
                index
              ) => (

                <div
                  className="form-field-row"
                  key={`${field.fieldName}-${index}`}
                >

                  <div
                    className="field-number"
                  >
                    {index + 1}
                  </div>


                  <div
                    className="field-inputs"
                  >

                    <input
                      type="text"
                      value={
                        field.label
                      }
                      placeholder="Field label"
                      onChange={(
                        event
                      ) =>
                        updateField(
                          index,
                          "label",
                          event.target.value
                        )
                      }
                    />


                    <input
                      type="text"
                      value={
                        field.fieldName
                      }
                      placeholder="fieldName"
                      onChange={(
                        event
                      ) =>
                        updateField(
                          index,
                          "fieldName",
                          event.target.value
                        )
                      }
                    />


                    <select
                      value={
                        field.fieldType
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          index,
                          "fieldType",
                          event.target.value
                        )
                      }
                    >

                      <option value="text">
                        Text
                      </option>

                      <option value="number">
                        Number
                      </option>

                      <option value="date">
                        Date
                      </option>

                      <option value="email">
                        Email
                      </option>

                      <option value="phone">
                        Phone
                      </option>

                      <option value="address">
                        Address
                      </option>

                      <option value="textarea">
                        Long text
                      </option>

                      <option value="select">
                        Select
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>


                    <label
                      className="required-toggle"
                    >

                      <input
                        type="checkbox"
                        checked={
                          Boolean(
                            field.required
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          updateField(
                            index,
                            "required",
                            event.target.checked
                          )
                        }
                      />

                      Required

                    </label>

                  </div>


                  <button
                    type="button"
                    className="remove-field-button"
                    onClick={() =>
                      deleteField(
                        index
                      )
                    }
                  >
                    ×
                  </button>

                </div>

              )
            )}

          </div>


          {/* =================================================
              GENERATE
          ================================================= */}

          <button
            type="button"
            className="generate-form-button"
            disabled={
              generating
            }
            onClick={
              generateSuggestions
            }
          >

            {generating
              ? "✦ AI is finding your information..."
              : "✦ Fill with LifeVault AI"}

          </button>

        </section>


        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <section
          className="form-result-card"
        >

          {!result ? (

            <div
              className="form-result-empty"
            >

              <div
                className="form-result-ai-icon"
              >
                AI
              </div>

              <h2>
                Your filled form will appear here
              </h2>

              <p>
                Create your form fields, choose your
                trusted documents and let LifeVault
                find the matching information.
              </p>

              <div
                className="form-result-security"
              >

                <span>
                  ✓
                </span>

                <div>

                  <strong>
                    Source-backed suggestions
                  </strong>

                  <p>
                    Every suggestion shows where the
                    information came from and how
                    confident the AI is.
                  </p>

                </div>

              </div>

            </div>

          ) : (

            <div
              className="filled-form-result"
            >

              {/* ============================================
                  RESULT HEADER
              ============================================ */}

              <div
                className="result-header"
              >

                <div>

                  <span
                    className="section-eyebrow"
                  >
                    AI GENERATED
                  </span>

                  <h2>
                    {
                      result.formName ||
                      formName
                    }
                  </h2>

                </div>

                <div
                  className="completion-badge"
                >
                  {
                    result.completionPercentage ||
                    0
                  }%
                </div>

              </div>


              <p
                className="result-description"
              >
                Review every suggested value before
                using it in the actual form.
              </p>


              {/* ============================================
                  FIELDS
              ============================================ */}

              <div
                className="filled-fields-list"
              >

                {result.fields?.map(
                  (field) => {

                    const confidence =
                      Number(
                        field.confidence ||
                        0
                      );

                    return (

                      <div
                        className="filled-field"
                        key={
                          field._id ||
                          field.fieldName
                        }
                      >

                        <div
                          className="filled-field-header"
                        >

                          <label>
                            {
                              field.label ||
                              field.fieldName
                            }

                            {field.required && (
                              <span>
                                *
                              </span>
                            )}

                          </label>

                          {field.verified && (

                            <span
                              className="verified-badge"
                            >
                              ✓ Verified
                            </span>

                          )}

                        </div>


                        <textarea
                          value={
                            field.finalValue ||
                            field.suggestedValue ||
                            ""
                          }
                          placeholder="No information found"
                          onChange={(
                            event
                          ) =>
                            updateResultField(
                              field._id,
                              event.target.value
                            )
                          }
                        />


                        <div
                          className="field-evidence"
                        >

                          <div>

                            <span>
                              Source
                            </span>

                            <strong>
                              {
                                field.sourceDocument?.originalName ||
                                field.sourceDocumentName ||
                                "No source found"
                              }
                            </strong>

                          </div>


                          <div
                            className={
                              `confidence ${getConfidenceClass(
                                confidence
                              )}`
                            }
                          >

                            {confidence}%
                            confidence

                          </div>

                        </div>


                        {field.sourceText && (

                          <div
                            className="field-source-text"
                          >

                            <span>
                              Evidence
                            </span>

                            <p>
                              "{field.sourceText}"
                            </p>

                          </div>

                        )}


                        {!field.verified && (

                          <button
                            type="button"
                            className="verify-field-button"
                            onClick={() =>
                              verifyField(
                                field
                              )
                            }
                          >
                            ✓ Verify this value
                          </button>

                        )}

                      </div>

                    );

                  }
                )}

              </div>


              {/* ============================================
                  DISCLAIMER
              ============================================ */}

              <div
                className="form-result-disclaimer"
              >

                <strong>
                  Review before submitting
                </strong>

                <p>
                  AI suggestions are based only on
                  information found in your LifeVault
                  documents. Always verify important
                  information before submitting a form.
                </p>

              </div>

            </div>

          )}

        </section>

      </div>

    </main>

  );
};

export default FormFilling;