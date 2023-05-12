const router = require("express").Router();
const {
  create, getAll, delete2, update, createAppointment, getAppointmentByRegistrarId, updateLastAppointment, updateAppointment,
} = require("./registrar_register.controller");



router.post("/create", create);
router.get("/get-all", getAll);
router.post("/delete", delete2);
router.patch("/update-registrar", update);
router.post("/create-appointment", createAppointment);
router.get("/get-appointment-by-registrar-id", getAppointmentByRegistrarId);
router.patch("/update-appointment", updateLastAppointment);


module.exports = router;