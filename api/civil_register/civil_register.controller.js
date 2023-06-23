const {
  create,
  getAll,
  update,
  deleteById,
  saveFileToDatabase,
  getChildCount,
  getFokontany,
  Dashboard,
  getSevenDayGraph,
  login,
  GetLatLong,
  getSevenDayGraphQuery,
  signUp,
  updateUser,
  deleteUser,
  getAllUsers,
  updateUserStatus,
  fetchSaveToDatabase,
  getCommune,
  createUin,
  getAllUins,
  forgetpassword,


} = require("./civil_register.service");
const { ErrorCode } = require("../../helper/constants/Enums");
const { Messages } = require("../../helper/constants/Messages");
var common = require("../../helper/common.js");
const Paths = require('../../helper/constants/Paths');
const { isNullOrEmpty } = require('../../helper/helperfunctions');
const { measureMemory } = require("vm");

module.exports = {
  /* The above code is defining a function called "signUp" that takes in a request and response object
  as parameters. It then extracts the request body and passes it to a function called "signUp"
  (presumably defined elsewhere) along with a callback function. */
  signUp: (req, res) => {
    const body = req.body;
    signUp(body, (errors, results) => {
      if (errors && errors.length > 0) {
        const data = common.error(errors, ErrorCode.failed);
        return res.json({ data });
      } else if (results.length === 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      } else {
        const data = common.success(results, Messages.MSG_SUCCESS, ErrorCode.success);
        return res.json({ data });
      }
    });
  },
  /* The above code is defining an asynchronous function called `updateUser` that takes in a request
  and response object as parameters. It extracts the `user_id`, `email`, and `user_name` from the
  request body. */
  updateUser: async (req, res) => {
    const { user_id, email, user_name, status } = req.body;
  
    try {
      const updatedUser = await updateUser({ email, user_name, status }, user_id);
      const data = common.success(updatedUser, Messages.MSG_UPDATE_SUCCESS, ErrorCode.success);
      return res.json({ data });
    } catch (error) {
      if (error.message === 'User does not exist') {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      } else if (error.message === 'Email already exists') {
        const data = common.error('Email already exists', ErrorCode.invalid_data);
        return res.json({ data });
      } else if (error.message === 'Username already exists') {
        const data = common.error('Username already exists', ErrorCode.invalid_data);
        return res.json({ data });
      } else {
        const data = common.error(error.message, ErrorCode.failed);
        return res.json({ data });
      }
    }
  },
  
  /* The above code is defining an asynchronous function called `deleteUser` that handles a DELETE
  request to delete a user from a database. It first extracts the `user_id` from the request query
  parameters and checks if it exists. If it doesn't exist, it returns an error response. */
  deleteUser: async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
      const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(data);
    }

    try {
      deleteUser(user_id, (error, deleteResult) => {
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
  /* The above code is defining an asynchronous function called `updateUserStatus` that takes in a
  request and response object as parameters. It extracts the `user_id` and `status` from the request
  body. It then calls the `updateUserStatus` function with the `status` and `user_id` as arguments.
  If the result of the function call is 0, it returns an error message indicating that the record
  does not exist. Otherwise, it returns a success message with the updated user status. If an error
  occurs during the execution of the function, it returns an error message indicating that the */
  updateUserStatus: async (req, res) => {
    const { user_id, status } = req.body;

    try {
      const updateUserStatusResult = await updateUserStatus({ status }, user_id);
      if (updateUserStatusResult === 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json(data);
      } else {
        const data = common.success(updateUserStatusResult, Messages.MSG_UPDATE_SUCCESS, ErrorCode.success);
        return res.json(data);
      }
    } catch (error) {
      const data = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(data);
    }
  },
  /* The above code is defining an asynchronous function called `getAllUsers` that handles a GET
  request to retrieve a list of users. It sets default values for `page` and `limit`, and checks if
  these values are provided in the query parameters. It also checks if an `email` query parameter is
  provided. */
  getAllUsers: async (req, res) => {
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
      getAllUsers(page, limit, search, (error, result) => {
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
  /* The above code is defining a function called "login" that takes in a request and response object
  as parameters. It then extracts the user_name and password from the request body and passes them
  to a function called "login" along with a callback function. If there is an error, it returns a
  JSON response with an error message. If there are results, it returns a JSON response with the
  first row of results and a success message. If there are no results, it returns a JSON response
  with an error message. */
  login: (req, res) => {
    const body = req.body;
    login(body.email, body.password, (error, results) => {
      if (error) {
        const data = common.error(Messages.MSG_INVALID_REQUEST, ErrorCode.exception);
        return res.json({ data });
      } else {
        if (results.rows.length > 0) {
          const data = common.success(results.rows[0], Messages.MSG_DATA_FOUND, ErrorCode.success);
          return res.json({ data });

        } else {
          const data = common.error(Messages.MSG_INVALID_CRED, ErrorCode.exception);
          return res.json({ data });
        }
      }
    });
  },
  /* The above code is defining a function called "create" that takes in a request and response object
  as parameters. It then extracts the request body and passes it to a function called "create" along
  with a callback function. If an error occurs during the creation process, it returns an error
  message with a specific error code. If the creation is successful, it returns a success message
  with the created results and a success error code. */
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
  /* The above code is defining a function called "getById" that takes in a request and response object
  as parameters. It extracts an "id" parameter from the request query and passes it to a function
  called "getById". If there is an error, it returns a JSON response with an error message. If there
  are no results, it returns a JSON response with a message indicating that no record was found. If
  there are results, it returns a JSON response with the results and a success message. */
  getById: (req, res) => {
    const id = req.query.id;
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
  /* The above code is defining a function called `getAll` that handles a GET request. It retrieves
  data from a database based on various query parameters such as start and end dates, region, name,
  module type, district, commune, fokontany, niu status, and error ID. It also allows for pagination
  by specifying the page number and limit of records per page. If there is an error, it returns an
  error message. If there are no results, it returns a message indicating that no records were
  found. Otherwise, it returns the retrieved data with pagination information. */
  getAll: (req, res) => {
    let page = 1;
    let limit = 10;
    if (req.query.page) {
      page = req.query.page;
    }
    if (req.query.limit) {
      limit = req.query.limit;
    }
    const sDate = req.query.s_start_date;
    const sEndDate = req.query.s_end_date;
    const search = req.query.search;
    const niuStatus = req.query.niuStatus;
    const error_id = req.query.error_id;

    getAll(sDate, sEndDate, page, limit, search, niuStatus, error_id, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      } else if (results.results.length === 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      } else {
        const data = common.pagination(results.results, results.total_records, page, limit);
        return res.json({ data });
      }
    });
  },

  /* The above code is defining an asynchronous function called `updateController` that handles a POST
  request. It expects the request body to contain `cr_id` and `uin` properties. */
  updateController: async (req, res) => {
    const { cr_id, uin } = req.body;

    try {
      const { error_id, result } = await update({ uin }, cr_id);

      if (error_id === 0) {
        const data = common.success(result, Messages.MSG_UPDATE_SUCCESS, ErrorCode.success);
        data.error_id = error_id;
        return res.json(data);
      } else if (error_id === 1) {
        const data = common.error("Duplicate UIN number", ErrorCode.invalid_data);
        data.error_id = error_id;
        return res.json(data);
      } else {
        const data = common.error("Invalid UIN", ErrorCode.invalid_data);
        data.error_id = error_id;
        return res.json(data);
      }
    } catch (error) {
      const data = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(data);
    }
  },
  /* The above code is defining a function called `deleteById` that takes in a request and response
  object as parameters. It extracts an `id` parameter from the request query and passes it to a
  `deleteById` function. If the `deleteById` function returns an error, the function sends a JSON
  response with an error message. If the `deleteById` function successfully deletes a record, the
  function sends a JSON response with a success message and the number of affected rows. If the
  `deleteById` function does not delete any records, the function sends a JSON response with a
  message indicating that */
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
  /* The above code is a function called `convertFile` that receives a request and response object as
  parameters. It checks if the request object has a file parameter, and if not, it returns a 400
  status code with a message indicating that the file parameter is missing. If the file parameter is
  present, it constructs a file path using the filename from the request object and saves the file
  to a database using the `saveFileToDatabase` function. If the file is successfully saved, it
  returns a 200 status code with the result, otherwise it returns a 500 status code with an error
  message */
  convertFile: (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing file parameter' });
    }
    var path = require('path');
    let filePath = path.resolve(__dirname) + "/../../upload/" + Paths.Paths.CSV + "/" + req.file.filename;
    saveFileToDatabase(filePath)
      .then(result => {
        return res.status(200).json({ error_code: 0, result });
      })
      .catch(err => {
        return res.status(500).json({ message: err });
      });
  },
  /* The above code is defining a function called `fetchFile` that takes in a request (`req`) and a
  response (`res`) object as parameters. Inside the function, it calls another function called
  `fetchSaveToDatabase()` which is expected to return a promise. If the promise is resolved
  successfully, the function returns a JSON response with a status code of 200 and an object
  containing an `error_code` property set to 0 and the result of the promise. If the promise is
  rejected, the function returns a JSON response with a status code of 500 and an object containing
  a `message */
  fetchFile: (req, res) => {
    fetchSaveToDatabase()
      .then(result => {
        return res.status(200).json({ error_code: 0, result });
      })
      .catch(err => {
        return res.status(500).json({ message: err });
      });
  },
  /* The above code is defining a function called `getChildCount` that takes in a request and response
  object as parameters. It extracts some query parameters from the request object and passes them
  along with a callback function to another function called `getChildCount`. The callback function
  handles the response from `getChildCount` and returns a JSON response to the client with either an
  error message or a success message containing the count of children based on the provided query
  parameters. */
  getChildCount: (req, res) => {
    const today = req.query.date;
    const regionCode = req.query.regionCode;
    const districtCode = req.query.districtCode;
    const communeCode = req.query.communeCode;
    const fokontanyCode = req.query.fokontanyCode;
    getChildCount(today, regionCode, districtCode, communeCode, fokontanyCode, (err, result) => {
      if (err) {
        const data = common.error(isNullOrEmpty(err.message) ? err : err.message, ErrorCode.failed);
        return res.json(data);
      } else {
        const { count, lastWeekCount, lastMonthCount, lastYearCount } = result;
        const data = common.success(
          result,
          Messages.MSG_DATA_FOUND,
          ErrorCode.success
        );
        return res.json(data);
      }
    });
  },
  /* The above code is defining a function called `getAllFokontany` that handles a GET request to
  retrieve a list of fokontany (a type of administrative division) based on certain search
  parameters. The function first checks if the required search parameters are present and not
  undefined, and returns an error message if they are missing. It then calls a function called
  `getFokontany` with the search parameters and returns the results as a JSON response. If there is
  an error or no results are found, it returns an appropriate error message. */
  getAllFokontany: (req, res) => {
    const { libelle_district, libelle_region, libelle_commune, libelle_fokontany } = req.query;

    if (!libelle_region && libelle_region != undefined) {
      const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json({ data });
    }
    if (!libelle_district && libelle_district != undefined) {
      const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json({ data });
    }
    if (!libelle_commune && libelle_commune != undefined) {
      const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json({ data });
    }
    if (!libelle_fokontany && libelle_fokontany != undefined) {
      const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json({ data });
    }

    const searchParams = { libelle_district, libelle_region, libelle_commune, libelle_fokontany };

    getFokontany(searchParams, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      } else if (results.length === 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      } else {
        const data = common.success(results, Messages.MSG_DATA_FOUND, ErrorCode.success);
        return res.json({ data });
      }
    });
  },
  /* The above code is defining a function called "Dashboard" that takes in four parameters: region,
  district, commune, and fokontany. It then calls the "Dashboard" function with these parameters and
  returns a JSON response based on the results of the function call. If there is an error, it
  returns an error message with an error code. If there are no results, it returns a message
  indicating that no records were found. If there are results, it returns a success message with the
  results and a success code. */
  Dashboard: (req, res) => {
    const region = req.query.code_region;
    const district = req.query.code_district;
    const commune = req.query.code_commune;
    const fokontany = req.query.code_fokontany;

    Dashboard(region, district, commune, fokontany, (err, results) => {
      if (err) {
        const data = common.error(err, ErrorCode.exception);
        return res.json(data);
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
  /* The above code is defining a function called `getSevenDayGraph` that takes in a request and
  response object as parameters. It extracts some query parameters from the request object and
  passes them to the `getSevenDayGraph` function. If there is an error, it returns an error
  response, if there are results, it returns a success response with the results, and if there are
  no results, it returns a success response with a message indicating that there are no records. */
  getSevenDayGraph: (req, res) => {
    const sDate = req.query.s_start_date;
    const sEndDate = req.query.s_end_date;
    const iCandle = req.query.i_candle;
    const region = req.query.code_region;
    const district = req.query.code_district;
    const commune = req.query.code_commune;
    const fokontany = req.query.code_fokontany;

    getSevenDayGraph(sDate, sEndDate, iCandle, region, district, commune, fokontany, (err, results) => {
      if (err) {
        const data = common.error(err, ErrorCode.exception);
        return res.json(data);
      }
      else if (results.data_list.length > 0) {
        const data = common.success(results, Messages.MSG_DATA_FOUND, ErrorCode.success);
        return res.json(data);
      }
      else {
        const data = common.success(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json(data);
      }
    });
  },
  /* The above code is defining a function called `getLatLong` that takes in a request and response
  object as parameters. It extracts some query parameters from the request object and passes them to
  a function called `GetLatLong`. Depending on the result of the function call, it returns a JSON
  response with either an error message or a success message along with the data returned by the
  `GetLatLong` function. */
  getLatLong: (req, res) => {
    const sDate = req.query.s_start_date;
    const sEndDate = req.query.s_end_date;
    const region = req.query.code_region;
    const district = req.query.code_district;
    const commune = req.query.code_commune;
    const fokontany = req.query.code_fokontany;
    GetLatLong(sDate, sEndDate, region, district, commune, fokontany, (err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      } else if (results.length === 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      } else {
        const data = common.success(results, Messages.MSG_DATA_FOUND, ErrorCode.exist);
        return res.json({ data });
      }
    });
  },
  /* The above code is defining a function called `getSevenDayGraphQuery` that takes in a request and
  response object as parameters. Inside the function, it calls another function
  `getSevenDayGraphQuery` which is likely a database query function that retrieves data for a seven
  day graph. Once the data is retrieved, it returns a JSON response containing the result. */
  getSevenDayGraphQuery: (req, res) => {
    getSevenDayGraphQuery((err, result) => {
      return res.json(result);
    });
  },
  /* The above code is defining a function called `getCommune` that takes in a request and response
  object as parameters. Inside the function, it calls another function called `getCommune`
  (presumably defined elsewhere) and passes in a callback function that takes in an error and
  results parameter. If there is an error, it returns a JSON response with an error message and
  error code. If there are no results, it returns a JSON response with a message indicating that no
  records were found. Otherwise, it returns a JSON response with the results and a success message. */
  getCommune: (req, res) => {
    getCommune((err, results) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      } else if (results.length === 0) {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      } else {
        const data = common.success(results, Messages.MSG_DATA_FOUND, ErrorCode.success);
        return res.json({ data });
      }
    });
  },
  /* The above code is defining an asynchronous function called `createUinController` that handles a
  POST request. It checks if a file is present in the request and returns an error if it is missing.
  It then resolves the file path and passes it to a function called `createUin` along with a
  callback function. If `createUin` returns an error, the function returns a 500 error response. If
  it is successful, it returns a 200 response with the result. */
  createUinController: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error_code: 1, message: 'Missing file parameter' });
      }
  
      var path = require('path');
      let filePath = path.resolve(__dirname) + "/../../upload/" + Paths.Paths.CSV + "/" + req.file.filename;
      createUin(filePath, (error, result) => {
        if (error) {
          if (error.message.includes('duplicate key value violates unique constraint "uin_uin_unique"')) {
            return res.status(400).json({ error_code: 2, message: 'Duplicate file entry' });
          }
          return res.status(500).json({ error_code: 1, message: error.message });
        }
        return res.status(200).json(result);
      });
    } catch (error) {
      return res.status(500).json({ error_code: 1, message: error.message });
    }
  },  
  /* The above code is a controller function in a Node.js application that handles a GET request to
  retrieve a list of UINs (Unique Identification Numbers) based on certain query parameters such as
  page, limit, niu_status, and commune. The function calls the getAllUins function with the provided
  parameters and returns the results in a paginated format with a success or error message. */
  getAllUinController: async (req, res) => {
    let page = 1;
    let limit = 10;
    const search = req.query.search;

    if (req.query.page) {
      page = parseInt(req.query.page);
    }

    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }

    let niuStatus = null;

    if (req.query.niu_status) {
      niuStatus = req.query.niu_status;
    }

    let commune = null;

    if (req.query.commune) {
      commune = req.query.commune;
    }

    try {
      getAllUins(niuStatus, commune, page, limit, search, (error, results, totalRecords) => {
        if (error) {
          const data = common.error(error, Messages.MSG_INVALID_DATA, ErrorCode.failed);
          return res.json({ data });
        }

        if (results.length === 0) {
          const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
          return res.json({ data });
        }

        const data = common.pagination(results, totalRecords, page, limit, Messages.MSG_DATA_FOUND, ErrorCode.success);
        return res.json({ data });
      });
    } catch (error) {
      const data = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json({ data });
    }
  },


  forgetpasswordController: async (req, res) => {
    const { id } = req.query;

    try {
      forgetpassword(parseInt(id), (error, result) => {

        if (!error) {
          const data = common.success(result, Messages.MSG_FORGOT_PASSWORD_SUCCESS, ErrorCode.success);
          return res.json(data);
        } else {
          const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.invalid_data);
          return res.json(data);
        }
      });
    } catch (error) {
      const data = common.error(error.message, Messages.MSG_INVALID_DATA, ErrorCode.failed);
      return res.json(data);
    }
  }

};