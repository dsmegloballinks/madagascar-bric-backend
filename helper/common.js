
const Enums = require("../helper/constants/Enums");
const { HttpStatus } = require("../helper/constants/Enums");
const Messages = require("./constants/Messages");
module.exports = {

  success: function (data, message, error_code) {
    return ({
      error_code: error_code,
      success: true,
      status: HttpStatus.ok,
      message: message,
      result: data,
    });
  },

  pagination: function (data, total_records, page, limit) {
    return ({
      error_code: Enums.ErrorCode.success,
      success: true,
      status: HttpStatus.ok,
      message: Messages.MSG_DATA_FOUND,
      total_records: total_records,
      page_number: parseInt(page),
      total_pages: Math.ceil(total_records / limit),
      result: data,

    });
  },
  successList: function (list = [], message, error_code) {
    return ({
      error_code: error_code,
      success: true,
      status: HttpStatus.ok,
      message: message,
      results: list,
    });
  },

  error: function (message, error_code) {
    return ({
      error_code: error_code,
      success: false,
      message: message,
    });
  },
}
