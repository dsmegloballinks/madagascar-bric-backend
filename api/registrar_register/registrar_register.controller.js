const fs = require('fs');
const csv = require('fast-csv');

const {

  create,
  getAll,
  delete1,
  updateRegistrar,
  createAppointment,
  getAppointmentByRegistarId

} = require("./registrar_register.service");
const { hashSync, genSaltSync, compareSync, validationResult } = require("express-validator");
const { sign } = require("express-validator");
// const { successList } = require("../../helper/common");
const { ErrorCode, ActivityFlag, ResponseType } = require("../../helper/constants/Enums");
const { Messages } = require("../../helper/constants/Messages");
var common = require("../../helper/common.js");
const Paths = require('../../helper/constants/Paths');
const { dirname } = require('path');
const { rejects } = require('assert');
const { isNullOrEmpty } = require('../../helper/helperfunctions');
const appDir = dirname(require.main.filename);

module.exports = {

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
  getAll: async (req, res) => {
    let page = 1;
    let limit = 10;

    if (req.query.page) {
      page = req.query.page;
    }

    if (req.query.limit) {
      limit = req.query.limit;
    }

    try {
      getAll(page, limit, (error, result) => {
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
  delete2: async (req, res) => {
    const { id } = req.query;

    if (!id) {
      const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(data);
    }

    try {
      delete1(id, (error, deleteResult) => {
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
  getAppointmentByRegistrarId: (req, res) => {
    let page = 1;
    let limit = 10;

    if (req.query.page) {
      page = req.query.page;
    }

    if (req.query.limit) {
      limit = req.query.limit;
    }

    const id = req.query.id;
    getAppointmentByRegistarId(page, limit, id, (err, result, totalCount, pageSize) => {
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
  }


};