
const Enums = require("../helper/constants/Enums");
const { HttpStatus } = require("../helper/constants/Enums");
const Messages = require("./constants/Messages");
module.exports = {

  /* This is a function that returns a success response object with the provided data, message, and
  error code. The object contains the following properties:
  - `error_code`: the error code associated with the response
  - `success`: a boolean value indicating whether the operation was successful or not
  - `status`: the HTTP status code associated with the response
  - `message`: a message describing the response
  - `result`: the data associated with the response. */
  success: function (data, message, error_code) {
    return ({
      error_code: error_code,
      success: true,
      status: HttpStatus.ok,
      message: message,
      result: data,
    });
  },

  /* This function is creating a response object for pagination data. It takes in the data to be
  paginated, the total number of records, the current page number, and the limit of records per
  page. It then returns an object with properties such as `error_code`, `success`, `status`,
  `message`, `total_records`, `page_number`, `total_pages`, and `result`. These properties provide
  information about the pagination data and can be used to display the data in a user-friendly way. */
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

  /* `successList` is a function that returns a success response object with a list of results, a
  message, and an error code. The function takes in three parameters: `list`, `message`, and
  `error_code`. `list` is an array of results, `message` is a message describing the response, and
  `error_code` is the error code associated with the response. The function returns an object with
  properties such as `error_code`, `success`, `status`, `message`, and `results`. These properties
  provide information about the response and can be used to display the data in a user-friendly way. */
  successList: function (list = [], message, error_code) {
    return ({
      error_code: error_code,
      success: true,
      status: HttpStatus.ok,
      message: message,
      results: list,
    });
  },

  /* The `error` function is creating an error response object with the provided error message and
  error code. The object contains the following properties:
  - `error_code`: the error code associated with the response
  - `success`: a boolean value indicating whether the operation was successful or not (in this case,
  it is false)
  - `message`: a message describing the error. */
  error: function (message, error_code) {
    return ({
      error_code: error_code,
      success: false,
      message: message,
    });
  },

}
