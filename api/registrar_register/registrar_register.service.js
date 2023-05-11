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
const { convertDateToStringMoment } = require("../../helper/helperfunctions");
const { getCenterDateMoment } = require("../../helper/helperfunctions");
const moment = require("moment/moment");
const { CallTracker } = require("assert");
const { body } = require("express-validator");



module.exports = {

  create: async (data, callBack) => {
    try {
      const insertQuery = "INSERT INTO registrar_register(first_name, last_name, office_email, department_name, office_contact) VALUES ($1, $2, $3, $4, $5) RETURNING *";
      const insertResult = await pool.query(insertQuery, [
        data.first_name,
        data.last_name,
        data.office_email,
        data.department_name,
        data.office_contact
      ]);

      const appointedQuery = "INSERT INTO appointment_registrar(location, appointment_date, appointment_time, appointed_by, registrar_id) VALUES ($1, $2, $3, $4, $5) RETURNING *";
      const appointedResult = await pool.query(appointedQuery, [
        data.location,
        data.appointment_date,
        data.appointment_time,
        data.appointed_by,
        insertResult.rows[0].id
      ]);

      return callBack(null, {
        registrar_register: insertResult.rows[0],
        appointment_registrar: appointedResult.rows[0]
      });
    } catch (error) {
      return callBack(error, null);
    }
  },

  getAll: async (page, limit, callBack) => {
    try {
      const offset = (page - 1) * limit;
      let countQuery = 'SELECT COUNT(*) FROM registrar_register WHERE 1=1';
      let selectQuery = 'SELECT * from registrar_register';

      const countResult = await runSql(pool, countQuery);
      const selectResult = await runSql(pool, selectQuery + ' ORDER BY registrar_register.id DESC LIMIT $1 OFFSET $2', [limit, offset]);

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
      const deleteQuery = "DELETE FROM appointment_registrar WHERE registrar_id = $1";
      await runSql(pool, deleteQuery, [id]);

      const deleteQuery2 = "DELETE FROM registrar_register WHERE id = $1";
      const deleteResult = await runSql(pool, deleteQuery2, [id]);

      return callBack(null, deleteResult.rows[0]);
    } catch (error) {
      return callBack(error);
    }
  },

  updateRegistrar: async (id, data, callBack) => {
    try {
      let updateQuery = "UPDATE registrar_register SET";
      const values = [];

      if (data.first_name) {
        updateQuery += " first_name = $1,";
        values.push(data.first_name);
      }

      if (data.last_name) {
        updateQuery += " last_name = $2,";
        values.push(data.last_name);
      }

      if (data.office_email) {
        updateQuery += " office_email = $3,";
        values.push(data.office_email);
      }

      if (data.department_name) {
        updateQuery += " department_name = $4,";
        values.push(data.department_name);
      }

      if (data.office_contact) {
        updateQuery += " office_contact = $5,";
        values.push(data.office_contact);
      }

      updateQuery = updateQuery.slice(0, -1) + " WHERE id = $6";
      values.push(id);

      const updateResult = await runSql(pool, updateQuery, values);

      return callBack(null, updateResult.rows[0]);
    } catch (error) {
      return callBack(error.message, null);
    }
  },

  createAppointment: async (data, callBack) => {
    try {
      const insertQuery = "INSERT INTO appointment_registrar (location, appointment_date, appointment_time, appointed_by, registrar_id) VALUES ($1, $2, $3, $4, $5) RETURNING *";
      const insertResult = await pool.query(insertQuery, [
        data.location,
        data.appointment_date,
        data.appointment_time,
        data.appointed_by,
        data.registrar_id
      ]);

      return callBack(null, {
        appointment_registrar: insertResult.rows[0]
      });
    } catch (error) {
      return callBack(error.message, null);
    }
  },

  getAppointmentByRegistarId: async (page, limit, id, callBack) => {
    try {
      const offset = (page - 1) * limit;
      const query = "SELECT * FROM appointment_registrar WHERE registrar_id = $1 LIMIT $2 OFFSET $3";
      const result = await pool.query(query, [id, limit, offset]);
      const totalCountQuery = "SELECT count(*) as total_count FROM appointment_registrar WHERE registrar_id = $1";
      const totalCountResult = await pool.query(totalCountQuery, [id]);
      const totalCount = totalCountResult.rows[0].total_count;
      return callBack(null, result.rows, totalCount, limit);
    } catch (error) {
      return callBack(error, null);
    }
  }



};