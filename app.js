require("dotenv").config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const pool = require("./config/database");
const cors = require("cors");

const civilRegisterRouter = require("./api/civil_register/civil_register.router");
const excelRouter = require("./api/excel_upload_log/excel_upload_log.router");
const registrarRouter = require("./api/registrar_register/registrar_register.router");

app.use(express.json());
app.use(cors());

app.use("/api/civil_register", civilRegisterRouter);
app.use("/api/excel_upload_log", excelRouter);
app.use("/api/registrar_register", registrarRouter);

app.use(express.static("./upload"));

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error executing query', err.stack);
    return;
  }
  console.log('Connected to database at', res.rows[0].now);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log("server up and running on PORT :", port);
  });
});
