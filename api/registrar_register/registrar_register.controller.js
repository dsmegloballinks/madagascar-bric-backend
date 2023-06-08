const {

  create,
  getAll,
  delete_rr,
  updateRegistrar,
  createAppointment,
  getAppointmentByRegistarId,
  updateLastAppointment

} = require("./registrar_register.service");
const { ErrorCode } = require("../../helper/constants/Enums");
const { Messages } = require("../../helper/constants/Messages");
var common = require("../../helper/common.js");

module.exports = {

  /*The create function handles the creation of a new record using the data provided in the request body.
   It returns a JSON response indicating the success or failure of the operation. If there is an error,
   it returns an error message along with the corresponding error code. If the creation is successful
   and results in a new record, it returns a success message along with the created record. */
  create: (req, res) => {
    const body = req.body;
    create(body, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      }
      else if (results == 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist,);
        return res.json({ data });
      }
      else {
        const data = common.success(results, Messages.MSG_SUCCESS, ErrorCode.success);
        return res.json({ data });
      }
    });
  },

  /* The getAll function retrieves a paginated list of records based on the provided parameters.
   It accepts the page and limit values to determine the page number and the number of records per page.
   Additionally, it takes an email parameter to filter the records based on the specified email. */
  getAll: async (req, res) => {
    let page = 1;
    let limit = 10;
    const search = req.query.search;
    if (req.query.page) {
      page = req.query.page;
    }

    if (req.query.limit) {
      limit = req.query.limit;
    }

    try {
      getAll(page, limit, search, (error, result) => {
        if (error) {
          const data = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
          return res.json(data);
        }
        const data = common.pagination(result.data, result.total_count, page, limit, Messages.MSG_SUCCESS, ErrorCode.success);
        return res.json(data);
      });
    } catch (error) {
      const data = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(data);
    }
  },

  /* The delete_rr function is responsible for deleting a record based on the provided id.
   It first checks if the id is provided in the request query. If not, it returns an error message indicating invalid data.*/
  delete_rr: async (req, res) => {
    const { id } = req.query;

    if (!id) {
      const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(data);
    }

    try {
      delete_rr(id, (error, deleteResult) => {
        if (error) {
          const data = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
          return res.json(data);
        }
        if (deleteResult === 0) {
          const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
          return res.json(data);
        }
        const data = common.success(deleteResult, Messages.MSG_DELETE_SUCCESS, ErrorCode.success);
        return res.json(data);
      });
    } catch (error) {
      const data = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(data);
    }
  },

  /* The update function updates a record based on the provided id and request body data.
   It calls the updateRegistrar function with the id and body as parameters. 
   The function returns either an error message or a success message with the updated result. */
  update: (req, res) => {
    const { id } = req.body;
    const body = req.body;

    updateRegistrar(id, body, (err, result) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      } else {
        const data = common.success(result, Messages.MSG_UPDATE_SUCCESS, ErrorCode.success);
        return res.json({ data });
      }
    });
  },

  /* The createAppointment function creates a new appointment using the data provided in the request body.
   It calls the createAppointment function with the body as a parameter. 
   The function returns either an error message or a success message with the created appointment result. */
  createAppointment: (req, res) => {
    const body = req.body;
    createAppointment(body, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      }
      else if (results == 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist,);
        return res.json({ data });
      }
      else {
        const data = common.success(results, Messages.MSG_SUCCESS, ErrorCode.success);
        return res.json({ data });
      }
    });
  },

  /* The getAppointmentByRegistrarId function retrieves a list of appointments based on the provided 
  parameters (id, location, and date). It uses pagination with the specified page and limit values.
   The function returns the result as a paginated response with success or error messages.*/
  getAppointmentByRegistrarId: (req, res) => {
    let page = 1;
    let limit = 10;

    if (req.query.page) {
      page = req.query.page;
    }

    if (req.query.limit) {
      limit = req.query.limit;
    }

    let id = req.query.id;
    let date = req.query.date;
    let search = req.query.search

    getAppointmentByRegistarId(page, limit, id, search, date, (err, result, totalCount, pageSize) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      } else {
        if (result.length === 0) {
          const data = common.success(Messages.MSG_NO_RECORD, ErrorCode.success);
          return res.json({ data });
        } else {
          const data = common.pagination(result, totalCount, page, pageSize, Messages.MSG_SUCCESS, ErrorCode.success);
          return res.json(data);
        }
      }
    });
  },

  /* The updateLastAppointment function is used to update the last appointment based on the provided data. 
  It takes the req.body object as input and attempts to update the appointment. If successful, it returns a success response
   with a success message. If there is an error, it returns an error response with an error message. */
  updateLastAppointment: async (req, res) => {
    const data = req.body;
    try {
      updateLastAppointment(data, (err, result) => {
        if (err) {
          const responseData = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
          return res.json(responseData);
        } else {
          const responseData = common.success(Messages.MSG_SUCCESS, ErrorCode.success);
          return res.json(responseData);
        }
      });
    } catch (error) {
      const responseData = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(responseData);
    }
  }
};