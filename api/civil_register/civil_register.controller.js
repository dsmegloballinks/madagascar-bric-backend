const fs = require('fs');

const {
  create,
  getById,
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
  getAllUser,
  updateUserStatus,

} = require("./civil_register.service");
const { ErrorCode } = require("../../helper/constants/Enums");
const { Messages } = require("../../helper/constants/Messages");
var common = require("../../helper/common.js");
const Paths = require('../../helper/constants/Paths');
const { isNullOrEmpty } = require('../../helper/helperfunctions');

module.exports = {
  signUp: (req, res) => {
    const body = req.body;
    signUp(body, (err, results) => {
      if (err && err.message === 'Phone number already exists') {
        const data = common.error(err.message, ErrorCode.failed);
        return res.json({ data });
      }
      else if (err) {
        const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
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
  updateUser: async (req, res) => {
    const { user_id, email, user_name } = req.body;

    try {
      const updatedUser = await updateUser({ email, user_name }, user_id);
      const data = common.success(updatedUser, Messages.MSG_UPDATE_SUCCESS, ErrorCode.success);
      return res.json({ data });
    } catch (error) {
      if (error.message === 'User does not exist') {
        const data = common.error(Messages.MSG_NO_RECORD, ErrorCode.not_exist);
        return res.json({ data });
      } else {
        const data = common.error(Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      }
    }
  },
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
  getAllUser: async (req, res) => {
    let page = 1;
    let limit = 10;
    if (req.query.page) {
      page = req.query.page;
    }
    if (req.query.limit) {
      limit = req.query.limit;
    }

    try {
      getAllUser(page, limit, (error, result) => {
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
  login: (req, res) => {
    const body = req.body;
    login(body.user_name, body.password, (error, results) => {
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
    const sDate = req.query.s_start_date;
    const sEndDate = req.query.s_end_date;
    const region = req.query.code_region;
    const district = req.query.code_district;
    const commune = req.query.code_commune;
    const fokontany = req.query.code_fokontany;
    getAll(sDate, sEndDate, page, limit, region, district, commune, fokontany, (err, results) => {
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
  getChildCount: (req, res) => {
    const today = req.query.date;
    getChildCount(today, (err, result) => {
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
  getSevenDayGraphQuery: (req, res) => {
    getSevenDayGraphQuery((err, result) => {
      return res.json(result);
    });
  },
  getODKAPI: (req, res) => {
    // var request = require('request');
    const axios = require('axios');

    const baseUrl = 'https://odk.siecm.gov.mg//v1';
    const loginUrl = `${baseUrl}/sessions`;
    // const username = 'brasool@worldbank.org';
    // const password = 'burhan@042';
    const username = 'odkmgbirthstats@saadaan.com';
    const password = 'tues444day';

    axios.post(loginUrl, {
      email: username,
      password: password
    })
      .then(response => {
        const authToken = response.data.token;
        // use the authToken to make subsequent API requests
        const projectId = '1';
        let formsUrl = `${baseUrl}/projects/${projectId}/forms/fiche_declaration_mg_commune.svc/Submissions`

        axios.get(formsUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
          .then(response => {
            const forms = response.data;
            formsUrl = `${baseUrl}/projects/${projectId}/forms/fiche_declaration_mg_commune/submissions/${forms.value[0].meta.instanceID}/attachments/${forms.value[0].pic_certificate}`
            axios.get(formsUrl, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              responseType: 'stream',
            })
              .then(response => {
                new Promise((resolve, reject) => {
                  response.data
                    .pipe(fs.createWriteStream(forms.value[0].pic_certificate))
                    .on('finish', () => resolve())
                    .on('error', e => reject(e));
                });
                return res.json(forms);
              })
              .catch(error => {
                console.error(error);
              });
          })
          .catch(error => {
            console.error(error);
          });
      })
      .catch(error => {
        console.error(error);
      });

  }
};