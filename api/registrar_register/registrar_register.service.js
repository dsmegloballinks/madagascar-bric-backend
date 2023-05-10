const pool = require("../../config/database");
const Enums = require("../../helper/constants/Enums");
const Paths = require("../../helper/constants/Paths");
const helperfunctions = require("../../helper/helperfunctions");
const fs = require("fs");
const fastcsv = require('fast-csv');
const { error } = require("console");
const { runSql } = require("../../helper/helperfunctions");
const { removeCommaAtEnd } = require("../../helper/helperfunctions");
const { isNullOrEmpty } = require("../../helper/helperfunctions");
const { constrainedMemory } = require("process");
const { query } = require("express");
const { getMonthStartEnd } = require("../../helper/helperfunctions");
const { getLastYear } = require("../../helper/helperfunctions");
const { getLastSevenDays } = require("../../helper/helperfunctions");
const { isNull } = require("util");
const { getMinuteDiff } = require("../../helper/helperfunctions");
const { addMinutesToDate } = require("../../helper/helperfunctions");
const { stringToDate } = require("../../helper/helperfunctions");
const { convertDateToString } = require("../../helper/helperfunctions");
const { getCenterDate } = require("../../helper/helperfunctions");
const { convertDateToDDDD } = require("../../helper/helperfunctions");
const { convertToTime } = require("../../helper/helperfunctions");
const { convertDateToDDD } = require("../../helper/helperfunctions");
const { convertDateToMMM } = require("../../helper/helperfunctions");
const { formatDate } = require("../../helper/helperfunctions");
const { getLastDates } = require("../../helper/helperfunctions");
const { where } = require("sequelize");
const { convertDateToStringMoment } = require("../../helper/helperfunctions");
const { getCenterDateMoment } = require("../../helper/helperfunctions");
const moment = require("moment/moment");
const { callbackPromise } = require("nodemailer/lib/shared");
const { CallTracker } = require("assert");
const { body } = require("express-validator");


let fatherId;
let valueToSearch;
let decId;

module.exports = {

  create: async (data, callBack) => {
    try {
      let insertQuery = "INSERT INTO registrar_register(first_name, last_name, office_email, department_name, office_contact, location, appointment_status, date_appointed, time_appointed, appointed_by) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
      let insertResult = await runSql(pool, insertQuery, [
        data.first_name,
        data.last_name,
        data.office_email,
        data.department_name,
        data.office_contact,
        data.location,
        data.appointment_status,
        data.date_appointed,
        data.time_appointed,
        data.appointed_by
      ]);
      return callBack(null, insertResult.rows[0]);
    } catch (error) {
      return callBack(error, null);
    }
  },
  getAll: async (page, limit,  callBack) => {
    try {
      const offset = (page - 1) * limit;
      let countQuery = 'SELECT COUNT(*) FROM registrar_register WHERE 1=1';
      let selectQuery = 'SELECT * FROM registrar_register WHERE 1=1';

      const countResult = await runSql(pool, countQuery);
      const selectResult = await runSql(pool, selectQuery + ' ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);

      const data = {
        total_count: countResult.rows[0].count,
        page_number: page,
        page_size: limit,
        data: selectResult.rows,
      };

      return callBack(null, data);
    } catch (error) {
      return callBack(error);
    }
  },
  delete1: async (id, callBack) => {
    try {
      const deleteQuery = "DELETE FROM registrar_register WHERE id = $1";
      const deleteResult = await runSql(pool, deleteQuery, [id]);
      return callBack(deleteResult.rows[0]);
    } catch (error) {
      return callBack(error);
    }
  },


};