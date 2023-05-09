require("dotenv").config();
const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const crypto = require("crypto");
const pool = require("./config/database");
const cors = require("cors");
const XLSX = require("xlsx");

//--Firebase push notifictions code ends--//


function generateUniqueId() {
  return crypto.randomBytes(16).toString("hex");
}

//--required all api's routers--//

const civilRegisterRouter = require("./api/civil_register/civil_register.router");
const excelRouter = require("./api/excel_upload_log/excel_upload_log.router");

app.use(express.json());
app.use(cors());

//--router used in app--//

app.use("/api/civil_register", civilRegisterRouter);
app.use("/api/excel_upload_log", excelRouter);
app.use(express.static("./upload"));
//--socket.io connection--//

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error executing query', err.stack);
    return;
  }
  console.log('Connected to database at', res.rows[0].now);
  
  // Start the server on localhost:3000
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log("server up and running on PORT :", port);
  });
});
