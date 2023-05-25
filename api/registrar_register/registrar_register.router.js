const router = require("express").Router();
const {
  create, getAll, delete_rr, update, createAppointment, getAppointmentByRegistrarId, updateLastAppointment,
} = require("./registrar_register.controller");



router.post("/create", create);
router.get("/get-all", getAll);
router.post("/delete", delete_rr);
router.patch("/update-registrar", update);
router.post("/create-appointment", createAppointment);
router.get("/get-appointment-by-registrar-id", getAppointmentByRegistrarId);
router.patch("/update-appointment", updateLastAppointment);


module.exports = router;