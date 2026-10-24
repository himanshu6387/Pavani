const mongoose = require("mongoose");

// ============================================================
// TIMELINE EVENT SCHEMA
// ============================================================

const timelineEventSchema = new mongoose.Schema(
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
    // EVENT TITLE
    // ==========================================================

    title: {
      type: String,
      required: true,
      trim: true
    },

    // ==========================================================
    // DESCRIPTION
    // ==========================================================

    description: {
      type: String,
      default: "",
      trim: true
    },

    // ==========================================================
    // EVENT DATE
    // ==========================================================

    eventDate: {
      type: Date,
      required: true,
      index: true
    },

    // ==========================================================
    // EVENT TYPE
    // ==========================================================

    eventType: {
      type: String,
      enum: [
        "medical",
        "financial",
        "insurance",
        "legal",
        "identity",
        "property",
        "education",
        "employment",
        "travel",
        "tax",
        "other"
      ],
      default: "other"
    },

    // ==========================================================
    // IMPORTANCE
    // ==========================================================

    importance: {
      type: String,
      enum: [
        "low",
        "medium",
        "high"
      ],
      default: "medium"
    },

    // ==========================================================
    // SOURCE EVIDENCE
    // ==========================================================

    evidence: {
      type: String,
      default: "",
      trim: true
    },

    // ==========================================================
    // DOCUMENT NAME
    // ==========================================================

    documentName: {
      type: String,
      default: "",
      trim: true
    },

    // ==========================================================
    // AI CONFIDENCE
    // ==========================================================

    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    }
  },
  {
    timestamps: true
  }
);


// ============================================================
// INDEXES
// ============================================================

timelineEventSchema.index({
  owner: 1,
  eventDate: -1
});

timelineEventSchema.index({
  owner: 1,
  eventType: 1,
  eventDate: -1
});

timelineEventSchema.index({
  owner: 1,
  document: 1
});


// ============================================================
// MODEL
// ============================================================

const TimelineEvent =
  mongoose.model(
    "TimelineEvent",
    timelineEventSchema
  );


// ============================================================
// EXPORT
// ============================================================

module.exports =
  TimelineEvent;