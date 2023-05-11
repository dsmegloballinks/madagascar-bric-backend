const router = require("express").Router();
const {
  create,
  getAll,
  update,
  deleteById,
  convertFile,
  getChildCount,
  getAllFokontany,
  Dashboard,
  getSevenDayGraph,
  login,
  getLatLong,
  getSevenDayGraphQuery,
  signUp,
  updateUser,
  deleteUser,
  getAllUser,
  updateUserStatus,
  fetchFile,
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

router.post("/sign-up", signUp);
router.patch("/update-user", updateUser);
router.patch("/update-user-status", updateUserStatus);
router.post('/convert', upload, convertFile);
router.post("/login", login);
router.get('/get-child-count', getChildCount);
router.get("/get-fokontany", getAllFokontany);
router.get("/dashboard", Dashboard);
router.get("/get-seven-day-graph", getSevenDayGraph);
router.get("/get-all", getAll);
router.post("/create", create);
router.patch("/update", update);
router.post("/delete", deleteById);
router.get("/get-lat-long", getLatLong);
router.get("/get-seven-day-graph-query", getSevenDayGraphQuery);
router.post("/delete-user", deleteUser);
router.get("/get-all-users", getAllUser);
router.get("/fetch-file", fetchFile);

module.exports = router;