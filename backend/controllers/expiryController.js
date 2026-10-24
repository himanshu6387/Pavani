const mongoose = require("mongoose");
const Document = require("../models/Document");


// ============================================================
// HELPER
// ============================================================

const getUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};


// ============================================================
// GET EXPIRY STATUS FOR ALL DOCUMENTS
//
// GET /api/documents/expiry
//
// Returns:
// - expired
// - expiringSoon
// - valid
// - noExpiry
// ============================================================

const getExpiryDocuments = async (req, res) => {
  try {

    // ========================================================
    // AUTH CHECK
    // ========================================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }


    // ========================================================
    // GET USER DOCUMENTS
    // ========================================================

    const documents = await Document.find({
      owner: userId,
    }).sort({
      expiryDate: 1,
      createdAt: -1,
    });


    // ========================================================
    // DATE SETUP
    // ========================================================

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


    // 30 days from today

    const thirtyDaysFromNow = new Date(
      today
    );

    thirtyDaysFromNow.setDate(
      thirtyDaysFromNow.getDate() + 30
    );


    // ========================================================
    // CLASSIFY DOCUMENTS
    // ========================================================

    const expired = [];
    const expiringSoon = [];
    const valid = [];
    const noExpiry = [];


    for (const document of documents) {

      // ------------------------------------------------------
      // NO EXPIRY DATE
      // ------------------------------------------------------

      if (!document.expiryDate) {

        noExpiry.push({
          document,
          status: "noExpiry",
        });

        continue;
      }


      // ------------------------------------------------------
      // NORMALIZE EXPIRY DATE
      // ------------------------------------------------------

      const expiryDate = new Date(
        document.expiryDate
      );

      if (
        Number.isNaN(
          expiryDate.getTime()
        )
      ) {

        noExpiry.push({
          document,
          status: "noExpiry",
        });

        continue;
      }


      const expiryDay = new Date(
        expiryDate.getFullYear(),
        expiryDate.getMonth(),
        expiryDate.getDate()
      );


      // ------------------------------------------------------
      // EXPIRED
      // ------------------------------------------------------

      if (
        expiryDay < today
      ) {

        const difference =
          today.getTime() -
          expiryDay.getTime();

        const daysExpired =
          Math.ceil(
            difference /
              (1000 * 60 * 60 * 24)
          );


        expired.push({

          document,

          status: "expired",

          daysExpired,

          expiryDate,

        });

        continue;
      }


      // ------------------------------------------------------
      // EXPIRING SOON
      // 0 - 30 DAYS
      // ------------------------------------------------------

      if (
        expiryDay <=
        thirtyDaysFromNow
      ) {

        const difference =
          expiryDay.getTime() -
          today.getTime();

        const daysRemaining =
          Math.ceil(
            difference /
              (1000 * 60 * 60 * 24)
          );


        expiringSoon.push({

          document,

          status: "expiringSoon",

          daysRemaining,

          expiryDate,

        });

        continue;
      }


      // ------------------------------------------------------
      // VALID
      // ------------------------------------------------------

      const difference =
        expiryDay.getTime() -
        today.getTime();

      const daysRemaining =
        Math.ceil(
          difference /
            (1000 * 60 * 60 * 24)
        );


      valid.push({

        document,

        status: "valid",

        daysRemaining,

        expiryDate,

      });

    }


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      counts: {

        total:
          documents.length,

        expired:
          expired.length,

        expiringSoon:
          expiringSoon.length,

        valid:
          valid.length,

        noExpiry:
          noExpiry.length,

      },

      expired,

      expiringSoon,

      valid,

      noExpiry,

    });

  } catch (error) {

    console.error(
      "Get expiry documents error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch document expiry information.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }
};


// ============================================================
// GET SINGLE DOCUMENT EXPIRY STATUS
//
// GET /api/documents/:id/expiry
// ============================================================

const getDocumentExpiryStatus = async (
  req,
  res
) => {

  try {

    // ========================================================
    // AUTH CHECK
    // ========================================================

    const userId =
      getUserId(req);

    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });

    }


    // ========================================================
    // VALIDATE ID
    // ========================================================

    const documentId =
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        documentId
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid document ID.",

      });

    }


    // ========================================================
    // FIND DOCUMENT
    // OWNER ONLY
    // ========================================================

    const document =
      await Document.findOne({

        _id:
          documentId,

        owner:
          userId,

      });


    if (!document) {

      return res.status(404).json({

        success: false,

        message:
          "Document not found.",

      });

    }


    // ========================================================
    // NO EXPIRY
    // ========================================================

    if (!document.expiryDate) {

      return res.status(200).json({

        success: true,

        documentId:
          document._id,

        documentName:
          document.originalName,

        status:
          "noExpiry",

        expiryDate:
          null,

        daysRemaining:
          null,

      });

    }


    // ========================================================
    // DATE CALCULATION
    // ========================================================

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


    const expiryDate =
      new Date(
        document.expiryDate
      );


    if (
      Number.isNaN(
        expiryDate.getTime()
      )
    ) {

      return res.status(200).json({

        success: true,

        documentId:
          document._id,

        documentName:
          document.originalName,

        status:
          "noExpiry",

        expiryDate:
          null,

        daysRemaining:
          null,

      });

    }


    const expiryDay =
      new Date(
        expiryDate.getFullYear(),
        expiryDate.getMonth(),
        expiryDate.getDate()
      );


    const difference =
      expiryDay.getTime() -
      today.getTime();


    const days =
      Math.ceil(
        difference /
          (1000 * 60 * 60 * 24)
      );


    // ========================================================
    // EXPIRED
    // ========================================================

    if (days < 0) {

      return res.status(200).json({

        success: true,

        documentId:
          document._id,

        documentName:
          document.originalName,

        status:
          "expired",

        expiryDate,

        daysRemaining:
          days,

        daysExpired:
          Math.abs(days),

      });

    }


    // ========================================================
    // EXPIRING SOON
    // ========================================================

    if (days <= 30) {

      return res.status(200).json({

        success: true,

        documentId:
          document._id,

        documentName:
          document.originalName,

        status:
          "expiringSoon",

        expiryDate,

        daysRemaining:
          days,

      });

    }


    // ========================================================
    // VALID
    // ========================================================

    return res.status(200).json({

      success: true,

      documentId:
        document._id,

      documentName:
        document.originalName,

      status:
        "valid",

      expiryDate,

      daysRemaining:
        days,

    });

  } catch (error) {

    console.error(
      "Get document expiry status error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to check document expiry status.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// ============================================================
// GET EXPIRING DOCUMENTS ONLY
//
// GET /api/documents/expiry/upcoming
//
// Default: next 30 days
// ============================================================

const getUpcomingExpiries = async (
  req,
  res
) => {

  try {

    // ========================================================
    // AUTH
    // ========================================================

    const userId =
      getUserId(req);

    if (!userId) {

      return res.status(401).json({

        success: false,

        message:
          "Authentication required.",

      });

    }


    // ========================================================
    // DAYS PARAMETER
    // ========================================================

    let days = 30;

    if (
      req.query.days !== undefined
    ) {

      const parsedDays =
        Number(
          req.query.days
        );

      if (
        Number.isInteger(
          parsedDays
        ) &&
        parsedDays > 0 &&
        parsedDays <= 3650
      ) {

        days =
          parsedDays;

      }

    }


    // ========================================================
    // DATE RANGE
    // ========================================================

    const now = new Date();

    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


    const endDate =
      new Date(
        startDate
      );

    endDate.setDate(
      endDate.getDate() +
        days
    );


    // ========================================================
    // FETCH
    // ========================================================

    const documents =
      await Document.find({

        owner:
          userId,

        expiryDate: {

          $gte:
            startDate,

          $lte:
            endDate,

        },

      }).sort({

        expiryDate:
          1,

      });


    // ========================================================
    // ADD DAYS REMAINING
    // ========================================================

    const results =
      documents.map(
        (document) => {

          const expiryDate =
            new Date(
              document.expiryDate
            );

          const difference =
            expiryDate.getTime() -
            startDate.getTime();

          const daysRemaining =
            Math.ceil(
              difference /
                (1000 * 60 * 60 * 24)
            );


          return {

            document,

            status:
              "expiringSoon",

            daysRemaining,

            expiryDate,

          };

        }
      );


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      days,

      count:
        results.length,

      documents:
        results,

    });

  } catch (error) {

    console.error(
      "Upcoming expiry error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to fetch upcoming expiries.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,

    });

  }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  getExpiryDocuments,

  getDocumentExpiryStatus,

  getUpcomingExpiries,

};