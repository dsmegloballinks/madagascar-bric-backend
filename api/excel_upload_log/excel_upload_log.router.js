const router = require("express").Router();
const {
  convertFile, uploadFile, getAllLogs

} = require("./excel_upload_log.controller");
const Paths = require("../../helper/constants/Paths");

const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./upload/${Paths.Paths.FILE}`);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("file");


router.post('/convert', upload, convertFile);
router.post('/upload-file', upload, uploadFile);
router.get('/get-all-logs', getAllLogs);


module.exports = router;