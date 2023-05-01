const fs = require('fs');
const csv = require('fast-csv');

const {
  create,
  getById,
  getAll,
  update,
  deleteById,
  readFiles,
  saveFileToDatabase,
  getChildCount,
  getFokontany,
  Dashboard
} = require("./civil_register.service");
const { hashSync, genSaltSync, compareSync, validationResult } = require("express-validator");
const { sign } = require("express-validator");
// const { successList } = require("../../helper/common");
const { ErrorCode, ActivityFlag, ResponseType } = require("../../helper/constants/Enums");
const { Messages } = require("../../helper/constants/Messages");
var common = require("../../helper/common.js");
const Paths = require('../../helper/constants/Paths');
const { dirname } = require('path');
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
    // let filePath = req.file;
    // filePath = "D:/node/worldbank/" + filePath.path;
    let filePath = path.resolve(__dirname) + "/../../upload/" + Paths.Paths.CSV + "/" + req.file.filename;
    // console.log("------------------- requestFileFileName", req.file.filename);
    // console.log("------------------- filepath :", filePath); 
    // return res.status(200).json({ message:  });
    try {
      saveFileToDatabase(filePath)
        .then(result => {
          return res.status(200).json({ error_code: 0, result });
        })
        .catch(err => {
          console.error(err);
          return res.status(500).json({ message: 'Error saving file to database' });
        });
    } catch (err) {
      return res.status(500).json({ message: 'Error saving file to database' });
    }
  },
  getChildCount: (req, res) => {
    const today = req.query.date;
    getChildCount(today, (err, result) => {
      if (err) {
        const data = common.error(err, Messages.MSG_INVALID_DATA, ErrorCode.failed);
        return res.json({ data });
      } else {
        const { count, lastWeekCount, lastMonthCount, lastYearCount } = result;
        const data = common.success(
          {
            count,
            lastWeekCount,
            lastMonthCount,
            lastYearCount
          },
          Messages.MSG_DATA_FOUND,
          ErrorCode.success
        );
        return res.json({ data });
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
    
    Dashboard( (err, results) => {
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



};