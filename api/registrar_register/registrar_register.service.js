const pool = require("../../config/database");
const { runSql } = require("../../helper/helperfunctions");
const { isNullOrEmpty } = require("../../helper/helperfunctions");
const moment = require("moment");
module.exports = {

  /* This is a function that creates a new entry in the `registrar_register` table and a corresponding
  entry in the `appointment_registrar` table. It takes in `data` as an object containing the
  necessary information for both tables, and a `callBack` function to handle the result. The
  function first executes an `INSERT` query on the `registrar_register` table using the provided
  data, and then uses the resulting `id` to execute another `INSERT` query on the
  `appointment_registrar` table. Finally, it returns the newly created entries in both tables as an
  object in the callback function. If there is an error during the execution of the queries, it
  returns the error in the callback function. */
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

      const appointedQuery = "INSERT INTO appointment_registrar(location, appointment_date, appointment_time, appointed_by, registrar_id, appointment_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
      const appointedResult = await pool.query(appointedQuery, [
        data.location,
        data.appointment_date,
        data.appointment_time,
        data.appointed_by,
        insertResult.rows[0].id,
        data.appointment_status
      ]);

      return callBack(null, {
        registrar_register: insertResult.rows[0],
        appointment_registrar: appointedResult.rows[0]
      });
    } catch (error) {
      return callBack(error, null);
    }
  },

  /* `getAll` is a function that retrieves a paginated list of all entries in the `registrar_register`
  table. It takes in `page`, `limit`, and `email` as parameters, where `page` is the page number to
  retrieve, `limit` is the number of entries to retrieve per page, and `email` is an optional
  parameter to filter the results by the email address of the registrar. */
  getAll: async (page, limit, search, callBack) => {
    try {
      const offset = (page - 1) * limit;
      let countQuery = "SELECT COUNT(*) FROM registrar_register";
      let selectQuery = "SELECT * FROM registrar_register  ";

      var whereClause = " WHERE 1=1 ";
      if (!isNullOrEmpty(search)) {
        whereClause += ` AND (office_email LIKE '%${search}%' OR department_name LIKE '%${search}%' OR office_contact LIKE '%${search}%' OR first_name LIKE '%${search}%' OR last_name LIKE '%${search}%')`;
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


  /* This function is deleting a record from the `registrar_register` table and its corresponding
  record from the `appointment_registrar` table. It takes in an `id` parameter to identify the
  record to be deleted, and a `callBack` function to handle the result. The function first executes
  a `DELETE` query on the `appointment_registrar` table to delete the record with the matching
  `registrar_id`, and then executes another `DELETE` query on the `registrar_register` table to
  delete the record with the matching `id`. Finally, it returns the deleted record from the
  `registrar_register` table in the callback function. If there is an error during the execution of
  the queries, it returns the error in the callback function. */
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

  /* `updateRegistrar` is a function that updates a record in the `registrar_register` table. It takes
  in an `id` parameter to identify the record to be updated, a `data` parameter containing the new
  values to be updated, and a `callBack` function to handle the result. The function first
  constructs an `UPDATE` query using the new values provided in the `data` parameter, and then
  executes the query using the `id` parameter to identify the record to be updated. Finally, it
  returns the updated record in the callback function. If there is an error during the execution of
  the query, it returns the error in the callback function. */
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

  /* `createAppointment` is a function that creates a new entry in the `appointment_registrar` table.
  It takes in `data` as an object containing the necessary information for the new entry, and a
  `callBack` function to handle the result. The function first constructs an `INSERT` query using
  the provided data, and then executes the query using the `pool` object. Finally, it returns the
  newly created entry in the `appointment_registrar` table as an object in the callback function. If
  there is an error during the execution of the query, it returns the error in the callback
  function. */
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

  /* `getAppointmentByRegistarId` is a function that retrieves a paginated list of appointments for a
  given registrar ID. It takes in `page`, `limit`, `id`, `location`, `date`, and `callBack` as
  parameters. `page` is the page number to retrieve, `limit` is the number of entries to retrieve
  per page, `id` is the registrar ID to filter the results by, `location` is an optional parameter
  to filter the results by the location of the appointment, and `date` is an optional parameter to
  filter the results by the date of the appointment. */
  getAppointmentByRegistarId: async (page, limit, id, search, date, callBack) => {
    try {
      const offset = (page - 1) * limit;
      let query = "SELECT * FROM appointment_registrar ";
      let totalCountQuery = "SELECT COUNT(*) AS total_count FROM appointment_registrar";

      let whereClause = ` WHERE registrar_id = ${id}`;
      if (!isNullOrEmpty(search)) {
        whereClause += ` AND location LIKE '%${search}%' OR appointed_by LIKE '%${search}%' OR appointment_status LIKE '%${search}%'`;
      }

      if (!isNullOrEmpty(date)) {
        whereClause += ` AND appointment_date = '${moment(date).format("YYYY-MM-DD")}'`;
      }

      query += whereClause + ` LIMIT ${limit} OFFSET ${offset}`;
      totalCountQuery += whereClause;

      let result = await runSql(pool, query, []);
      let totalCountResult = await runSql(pool, totalCountQuery, []);
      const totalCount = totalCountResult.rows[0].total_count;
      return callBack(null, result.rows, totalCount, limit);
    } catch (error) {
      return callBack(error.message, null);
    }
  },


  /*The updateLastAppointment function updates the last appointment record for a given registrar ID 
  with the provided data, including fields such as location, appointment date, appointment time,
  appointed by, and appointment status. */
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