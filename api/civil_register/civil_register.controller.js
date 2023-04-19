const fs = require('fs');
const csv = require('fast-csv');

const {
  create,
  getById,
  getAll,
  update,
  deleteById,
  readFiles
} = require("./civil_register.service");
const { hashSync, genSaltSync, compareSync, validationResult } = require("express-validator");
const { sign } = require("express-validator");
// const { successList } = require("../../helper/common");
const { ErrorCode, ActivityFlag, ResponseType } = require("../../helper/constants/Enums");
const { Messages } = require("../../helper/constants/Messages");
var common = require("../../helper/common.js");

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
  //------------end------------!
  getById: (req, res) => {
    const id = req.query.id;
    console.log("req", req);
    getById(id, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      }
      else if (!results) {
        const data = common.success(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      }
      else {
        const data = common.success(results, Messages.MSG_DATA_FOUND, ErrorCode.success);
        return res.json({ data });
      }
    });

  },
  getAll: (req, res) => {
    let page = 1;
    let limit = 10;
    if (req.query.page) {
      page = req.query.page
    }
    if (req.query.limit) {
      limit = req.query.limit
    }
    getAll(page, limit, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      } else if (results.results.length == 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      } else {
        const data = common.pagination(results.results, results.total_records, page, limit);
        return res.json({ data });
      }
    });
  },
  update: (req, res) => {
    const body = req.body;
    const file = req.file;
    update(body, file, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      }
      else {
        const data = common.success(results, Messages.MSG_DATA_FOUND, ErrorCode.success);
        return res.json({ data });
      }
    });
  },
  deleteById: (req, res) => {
    const id = req.query.id;
    deleteById(id, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      }
      else if (results.affectedRows == 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      }
      else if (results.affectedRows > 0) {
        const data = common.success(results, Messages.MSG_DELETE_SUCCESS, ErrorCode.success);
        return res.json({ data });
      }
    });
  },
  convertFile: (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file parameter' });
    }

    let filePath = req.file;

    filePath = "D:/node/worldbank/"+filePath.path;
    
    readFiles(filePath)
      .then(data => {
        return res.status(200).json({ data });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ message: 'Error converting file' });
      });
  }
};