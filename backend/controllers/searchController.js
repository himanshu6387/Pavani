const Document = require("../models/Document");

// ============================================================
// SEARCH DOCUMENTS CONTROLLER
// ============================================================

const searchDocuments = async (req, res) => {
  try {
    // ========================================================
    // AUTHENTICATED USER
    // ========================================================

    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ========================================================
    // QUERY PARAMETERS
    // ========================================================

    const q =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : "";

    const category =
      typeof req.query.category === "string"
        ? req.query.category.trim()
        : "";

    console.log("========================================");
    console.log("SEARCH REQUEST");
    console.log("User ID:", userId);
    console.log("Query:", q);
    console.log("Category:", category);
    console.log("========================================");

    // ========================================================
    // BASE QUERY
    // ========================================================

    const mongoQuery = {
      owner: userId,
    };

    // ========================================================
    // CATEGORY NORMALIZATION
    // ========================================================

    /*
      Frontend may send:

      medical
      Medical
      MEDICAL

      Database may contain:

      Medical

      We normalize the incoming category and use
      case-insensitive regex.
    */

    if (
      category &&
      category.toLowerCase() !== "all"
    ) {
      const normalizedCategory =
        normalizeCategory(category);

      mongoQuery.category = new RegExp(
        `^${escapeRegex(normalizedCategory)}$`,
        "i"
      );
    }

    // ========================================================
    // TEXT SEARCH
    // ========================================================

    if (q) {
      const searchRegex = new RegExp(
        escapeRegex(q),
        "i"
      );

      mongoQuery.$or = [
        {
          title: searchRegex,
        },

        {
          originalName: searchRegex,
        },

        {
          fileName: searchRegex,
        },

        {
          aiSummary: searchRegex,
        },

        {
          summary: searchRegex,
        },

        {
          extractedText: searchRegex,
        },

        {
          category: searchRegex,
        },
      ];
    }

    // ========================================================
    // DATABASE SEARCH
    // ========================================================

    const documents = await Document.find(
      mongoQuery
    )
      .sort({
        createdAt: -1,
      })
      .limit(50);

    // ========================================================
    // LOG RESULT
    // ========================================================

    console.log(
      "Documents found:",
      documents.length
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      count: documents.length,

      documents,
    });

  } catch (error) {
    // ========================================================
    // ERROR
    // ========================================================

    console.error(
      "Search documents error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to search documents.",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// NORMALIZE CATEGORY
// ============================================================

function normalizeCategory(category) {
  const value =
    String(category)
      .trim()
      .toLowerCase();

  const categoryMap = {
    all: "all",

    medical: "Medical",

    insurance: "Insurance",

    financial: "Financial",

    legal: "Legal",

    education: "Education",

    government: "Government",

    work: "Work",

    employment: "Employment",

    personal: "Personal",

    identity: "Identity",

    property: "Property",

    other: "Other",
  };

  return (
    categoryMap[value] ||
    capitalizeFirstLetter(value)
  );
}

// ============================================================
// CAPITALIZE FIRST LETTER
// ============================================================

function capitalizeFirstLetter(value) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

// ============================================================
// ESCAPE REGEX
// ============================================================

function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  searchDocuments,
};