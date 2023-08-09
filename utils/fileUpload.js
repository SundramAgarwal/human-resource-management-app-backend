const multer = require("multer");

//define file storage
const storage = multer.diskStorage({
  destination: function (req, file, callBack) {
    callBack(null, "uploads");
  },
  filename: function (req, file, callBack) {
    callBack(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    ); //date format like--- date/month/year
  },
});

//Specify file format
function fileFilter(req, file, callBack) {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    callBack(null, true);
  } else {
    callBack(null, false);
  }
}

const upload = multer({ storage, fileFilter });

//file size formatter
const fileSizeFormatter = (bytes, decimal) => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const dm = decimal || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "YB", "ZB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1000));
  return (
    parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + " " + sizes[index]
  );
};

module.exports = { upload, fileSizeFormatter };
