const mongoose = require("mongoose");


// ============================================================
// ACTION SCHEMA
// ============================================================

const actionSchema = new mongoose.Schema(
  {

    // ==========================================================
    // OWNER
    // ==========================================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },


    // ==========================================================
    // SOURCE DOCUMENT
    // ==========================================================

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true
    },


    // ==========================================================
    // ACTION TITLE
    // ==========================================================

    title: {
      type: String,
      required: true,
      trim: true
    },


    // ==========================================================
    // ACTION DESCRIPTION
    // ==========================================================

    description: {
      type: String,
      default: "",
      trim: true
    },


    // ==========================================================
    // REASON
    // ==========================================================

    reason: {
      type: String,
      default: "",
      trim: true
    },


    // ==========================================================
    // PRIORITY
    // ==========================================================

    priority: {
      type: String,

      enum: [
        "low",
        "medium",
        "high",
        "critical"
      ],

      default: "medium"
    },


    // ==========================================================
    // STATUS
    // ==========================================================

    status: {
      type: String,

      enum: [
        "pending",
        "completed",
        "dismissed"
      ],

      default: "pending",

      index: true
    },


    // ==========================================================
    // DUE DATE
    // ==========================================================

    dueDate: {
      type: Date,
      default: null,
      index: true
    },


    // ==========================================================
    // AI CONFIDENCE
    // ==========================================================

    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },


    // ==========================================================
    // EVIDENCE
    //
    // Small piece of text from the document supporting
    // why this action was created.
    // ==========================================================

    evidence: {
      type: String,
      default: "",
      trim: true
    },


    // ==========================================================
    // DOCUMENT NAME
    //
    // Stored separately so the UI can display the source
    // without always populating the document.
    // ==========================================================

    documentName: {
      type: String,
      default: "",
      trim: true
    },


    // ==========================================================
    // COMPLETION DATE
    // ==========================================================

    completedAt: {
      type: Date,
      default: null
    }

  },

  {
    timestamps: true
  }
);


// ============================================================
// INDEXES
// ============================================================

actionSchema.index({
  owner: 1,
  status: 1
});


actionSchema.index({
  owner: 1,
  dueDate: 1
});


actionSchema.index({
  owner: 1,
  createdAt: -1
});


// ============================================================
// MODEL
// ============================================================

const Action =
  mongoose.model(
    "Action",
    actionSchema
  );


// ============================================================
// EXPORT
// ============================================================

module.exports = Action;