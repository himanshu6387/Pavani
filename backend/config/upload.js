const multer = require("multer");
const path = require("path");
const fs = require("fs");


/*
=========================================================
UPLOAD DIRECTORY
=========================================================
*/

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads"
);


if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true
    }
  );
}


/*
=========================================================
STORAGE
=========================================================
*/

const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    cb(
      null,
      uploadDirectory
    );

  },

  filename: function (req, file, cb) {

    const extension =
      path.extname(file.originalname);

    const fileName =
      `${Date.now()}-${Math.round(
        Math.random() * 1000000000
      )}${extension}`;

    cb(
      null,
      fileName
    );

  }

});


/*
=========================================================
ALLOWED FILE TYPES
=========================================================
*/

const fileFilter = function (
  req,
  file,
  cb
) {

  const allowedMimeTypes = [

    "application/pdf",

    "image/jpeg",

    "image/jpg",

    "image/png"

  ];


  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {

    cb(
      null,
      true
    );

  } else {

    cb(
      new Error(
        "Only PDF, JPG, JPEG and PNG files are allowed."
      ),
      false
    );

  }

};


/*
=========================================================
MULTER
=========================================================
*/

const upload = multer({

  storage,

  fileFilter,

  limits: {

    fileSize:
      10 * 1024 * 1024

  }

});


module.exports = upload;