const pool = require("../../config/database");
const { runSql } = require("../../helper/helperfunctions");
const { isNullOrEmpty } = require("../../helper/helperfunctions");
const moment = require("moment");
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

  getAll: async (page, limit, email, callBack) => {
    try {
      const offset = (page - 1) * limit;
      let countQuery = "SELECT COUNT(*) FROM registrar_register";
      let selectQuery = "SELECT * FROM registrar_register  ";

      var whereClause = " WHERE 1=1 ";
      if (!isNullOrEmpty(email)) {
        whereClause += ` AND office_email LIKE '%${email}%'`;
      }
      selectQuery += whereClause + " ORDER BY user_id DESC LIMIT $1 OFFSET $2";
      countQuery += whereClause;
      const countResult = await runSql(pool, countQuery);
      const selectResult = await runSql(pool, selectQuery, [limit, offset]);
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


  delete_rr: async (id, callBack) => {
    try {
      const deleteQuery = "DELETE FROM appointment_registrar WHERE registrar_id = $1";
      await runSql(pool, deleteQuery, [id]);

      const deleteQuery_rr = "DELETE FROM registrar_register WHERE id = $1";
      const deleteResult = await runSql(pool, deleteQuery_rr, [id]);

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
      const insertQuery = "INSERT INTO appointment_registrar (location, appointment_date, appointment_time, appointed_by, registrar_id, appointment_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
      const insertResult = await pool.query(insertQuery, [
        data.location,
        data.appointment_date,
        data.appointment_time,
        data.appointed_by,
        data.registrar_id,
        data.appointment_status
      ]);

      return callBack(null, {
        appointment_registrar: insertResult.rows[0]
      });
    } catch (error) {
      return callBack(error.message, null);
    }
  },

  getAppointmentByRegistarId: async (page, limit, id, location, date, callBack) => {
    try {
      const offset = (page - 1) * limit;
      let query = "SELECT * FROM appointment_registrar WHERE registrar_id = $1";
      let totalCountQuery = "SELECT count(*) as total_count FROM appointment_registrar WHERE registrar_id = $1";

      if (!isNullOrEmpty(location)) {
        query += ` AND location LIKE '%${location}%'`;
        totalCountQuery += ` AND location LIKE '%${location}%'`;
      }

      if (!isNullOrEmpty(date)) {
        query += ` AND appointment_date = '${moment(date).format("YYYY-MM-DD")}'`;
        totalCountQuery += ` AND appointment_date = '${moment(date).format("YYYY-MM-DD")}'`;
      }

      query += " LIMIT $2 OFFSET $3";
      totalCountQuery += " LIMIT $2 OFFSET $3";

      let result = await runSql(pool, query, [id, limit, offset]);
      let totalCountResult = await runSql(pool, totalCountQuery, [id, limit, offset]);
      const totalCount = totalCountResult.rows[0].total_count;
      return callBack(null, result.rows, totalCount, limit);
    } catch (error) {
      return callBack(error.message, null);
    }
  },

  updateLastAppointment: async (data, callBack) => {
    try {
      let selectQuery = "SELECT id FROM appointment_registrar WHERE registrar_id = $1 ORDER BY id DESC LIMIT 1";
      let selectResult = await runSql(pool, selectQuery, [data.id]);
      console.log(selectQuery + " : " + data.id)
      if (selectResult.rows.length === 0) {
        return callBack("No appointment found for the given registrar ID", null);
      }

      let query = "UPDATE appointment_registrar SET";
      let queryParams = [];

      if (data.location) {
        query += " location = $1,";
        queryParams.push(data.location);
      }
      if (data.appointment_date) {
        query += " appointment_date = $2,";
        queryParams.push(data.appointment_date);
      }
      if (data.appointment_time) {
        query += " appointment_time = $3,";
        queryParams.push(data.appointment_time);
      }
      if (data.appointed_by) {
        query += " appointed_by = $4,";
        queryParams.push(data.appointed_by);
      }
      if (data.appointment_status) {
        query += " appointment_status = $5,";
        queryParams.push(data.appointment_status);
      }

      query = query.slice(0, -1); // Remove the last comma from the query string
      query += " WHERE id = $6";
      queryParams.push(selectResult.rows[0].id);
      let result = await runSql(pool, query, queryParams);
      return callBack(null, result.rows[0]);
    } catch (error) {
      return callBack(error.message, null);
    }
  }


};