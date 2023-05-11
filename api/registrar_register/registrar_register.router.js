const router = require("express").Router();
const {
  create, getAll, delete2, update, createAppointment, getAppointmentByRegistrarId,
} = require("./registrar_register.controller");



router.post("/create", create);
router.get("/get-all", getAll);
router.post("/delete", delete2);
router.patch("/update-registrar", update);
router.post("/create-appointment", createAppointment);
router.get("/get-appointment-by-registrar-id", getAppointmentByRegistrarId);


module.exports = router;