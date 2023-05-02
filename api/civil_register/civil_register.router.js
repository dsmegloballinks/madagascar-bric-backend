const router = require("express").Router();
// const { checkToken } = require("../../auth/token_validation");
const {
  create,
  getById,
  getAll,
  update,
  deleteById,
  convertFile,
  saveFileToDatabase,
  getChildCount,
  getAllFokontany,
  Dashboard,
  getSevenDayGraph
} = require("./civil_register.controller");
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

router.post('/convert', upload, convertFile);
router.get('/get-child-count', getChildCount);
router.get("/get-fokontany", getAllFokontany);
router.get("/dashboard", Dashboard);
router.get("/get-seven-day-graph", getSevenDayGraph);
router.get("/get-all", getAll);
router.post("/create", create);
router.patch("/update", update);
router.post("/delete", deleteById);

module.exports = router;