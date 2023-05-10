const router = require("express").Router();
// const { checkToken } = require("../../auth/token_validation");
const {
  create, getAll, delete2,
} = require("./registrar_register.controller");
const Paths = require("../../helper/constants/Paths");

const multer = require("multer");
/////
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./upload/${Paths.Paths.CSV}`);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});
//not a variable like a middlware
var upload = multer({
  storage: storage,
}).single("file");


router.post("/create", create);
router.get("/get-all", getAll);
router.post("/delete", delete2);

module.exports = router;