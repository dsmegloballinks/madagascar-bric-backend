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

  /* `convertFile` is a function that handles the request to convert a CSV file to an Excel file. It
  checks if the request contains a file parameter, and if not, it returns a 400 status code with a
  message indicating that the file parameter is missing. If the file parameter is present, it
  constructs the file path and calls the `saveFileDetail` function with the file path as a
  parameter. If the conversion is successful, it returns a 200 status code with the result. If there
  is an error during the conversion, it returns a 500 status code with an error message. */
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

  /* `uploadFile` is a function that handles the request to upload a file. It takes in the request and
  response objects as parameters. It extracts the file and other parameters from the request body.
  It then calls the `fileUpload` function with the file name and other parameters. If the file
  upload fails, it returns an error message with a status code of 500. If the file upload is
  successful, it returns a success message with the result. */
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

  /* `getAllLogs` is a function that handles the request to retrieve logs from a database. It takes in
  the request and response objects as parameters. It sets default values for `page`, `limit`, and
  `moduleType`, and then checks if these values are provided in the query parameters of the request.
  If they are, it updates the corresponding variables. */
  getAllLogs: async (req, res) => {
    let page = 1;
    let limit = 10;
    let moduleType = '';
    let file = req.query.file;
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
      getAllLogs(page, limit, moduleType, file, (error, result) => {
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