const fs = require('fs');
const csv = require('fast-csv');

const {

  saveFileToDatabase,
  saveFileDetail,
  fileUpload,
  getAllLogs

} = require("./excel_upload_log.service");
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

  convertFile: (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file parameter' });
    }
    var path = require('path');
    // let filePath = req.file;
    // filePath = "D:/node/worldbank/" + filePath.path;
    let filePath = path.resolve(__dirname) + "/../../upload/" + Paths.Paths.CSV + "/" + req.file.filename;
    // console.log("------------------- requestFileFileName", req.file.filename);
    // console.log("------------------- filepath :", filePath); 
    // return res.status(200).json({ message:  });
    saveFileDetail(filePath)
      .then(result => {
        return res.status(200).json({ error_code: 0, result });
      })
      .catch(err => {
        return res.status(500).json({ message: err });
      });
  },

  uploadFile: async (req, res) => {
    const { file } = req;
    const { number_records, input_type, module_type } = req.body;

    fileUpload(file.filename, { number_records, input_type, module_type }, (err, result) => {
      if (err) {
        const data = {
          message: "File upload failed",
          error: err
        };
        return res.status(500).json(data);
      }

      const data = {
        message: "File uploaded successfully",
        result
      };
      return res.json(data);
    });
  },
  getAllLogs: async (req, res) => {
    let page = 1;
    let limit = 10;
    let moduleType = '';

    if (req.query.page) {
      page = req.query.page;
    }

    if (req.query.limit) {
      limit = req.query.limit;
    }

    if (req.query.moduleType) {
      moduleType = req.query.moduleType;
    }

    try {
      getAllLogs(page, limit, moduleType, (error, result) => {
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
  }

};