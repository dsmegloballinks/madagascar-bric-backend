const {
  saveFileDetail,
  fileUpload,
  getAllLogs

} = require("./excel_upload_log.service");
const { ErrorCode } = require("../../helper/constants/Enums");
const { Messages } = require("../../helper/constants/Messages");
var common = require("../../helper/common.js");
const Paths = require('../../helper/constants/Paths');

module.exports = {

  convertFile: (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file parameter' });
    }
    var path = require('path');
    let filePath = path.resolve(__dirname) + "/../../upload/" + Paths.Paths.CSV + "/" + req.file.filename;
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