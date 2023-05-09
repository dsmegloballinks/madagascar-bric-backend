const pool = require("../../config/database");
const Enums = require("../../helper/constants/Enums");
const Paths = require("../../helper/constants/Paths");
const helperfunctions = require("../../helper/helperfunctions");
const fs = require("fs");
const fastcsv = require('fast-csv');
const { error } = require("console");
const { runSql } = require("../../helper/helperfunctions");
const { removeCommaAtEnd } = require("../../helper/helperfunctions");
const { isNullOrEmpty } = require("../../helper/helperfunctions");
const { constrainedMemory } = require("process");
const { query } = require("express");
const { getMonthStartEnd } = require("../../helper/helperfunctions");
const { getLastYear } = require("../../helper/helperfunctions");
const { getLastSevenDays } = require("../../helper/helperfunctions");
const { isNull } = require("util");
const { getMinuteDiff } = require("../../helper/helperfunctions");
const { addMinutesToDate } = require("../../helper/helperfunctions");
const { stringToDate } = require("../../helper/helperfunctions");
const { convertDateToString } = require("../../helper/helperfunctions");
const { getCenterDate } = require("../../helper/helperfunctions");
const { convertDateToDDDD } = require("../../helper/helperfunctions");
const { convertToTime } = require("../../helper/helperfunctions");
const { convertDateToDDD } = require("../../helper/helperfunctions");
const { convertDateToMMM } = require("../../helper/helperfunctions");
const { formatDate } = require("../../helper/helperfunctions");
const { getLastDates } = require("../../helper/helperfunctions");
const { where } = require("sequelize");
const { convertDateToStringMoment } = require("../../helper/helperfunctions");
const { getCenterDateMoment } = require("../../helper/helperfunctions");
const moment = require("moment/moment");
const { callbackPromise } = require("nodemailer/lib/shared");
const { CallTracker } = require("assert");


let fatherId;
let valueToSearch;
let decId;

module.exports = {

  saveFileDetail: (filePath, callBack) => {
    try {
      let extension = filePath.split('.').pop();
      let result = [];
      return new Promise(async (resolve, reject) => {
        try {
          let resultCivilRegisterInsert;

          try {
            if (extension === 'xls' || extension === 'xlsx') {
              let workbook = xlsx.readFile(filePath);
              let sheetName = workbook.SheetNames[0];
              let worksheet = workbook.Sheets[sheetName];
              result = xlsx.utils.sheet_to_json(worksheet);
            } else if (extension === 'csv') {
              await new Promise((resolve, reject) => {
                console.log("filePath", filePath);
                fs.createReadStream(filePath)
                  .pipe(fastcsv.parse())
                  .on('data', (data) => {
                    result.push(data);
                  })
                  .on('end', async () => {
                    resolve();
                  });
              });
            }
            else { reject('Invalid file type'); }
          } catch (error) {
            reject("error file reading file for data gathering ")
          }


          var queryCivilRegisterInsert = "INSERT INTO upload_excel_log (date_created, number_record, input_type, file) VALUES";
          for (let i = 1; i < result.length; i++) {
            if (isNullOrEmpty(result[i][6])) { result[i][6] = null; }
            if (isNullOrEmpty(result[i][10])) { result[i][10] = null; } //info_enfant-prenom_enfant
            if (isNullOrEmpty(result[i][9])) { result[i][9] = null; } //info_enfant-nom_enfant
            if (isNullOrEmpty(result[i][11])) { result[i][11] = null; } result[i][11] = formatDate(result[i][11]);//info_enfant-date_naissance
            if (isNullOrEmpty(result[i][12])) { result[i][12] = null; } //info_enfant-heure_naissance
            if (isNullOrEmpty(result[i][16])) { result[i][16] = null; } //info_enfant-b_location
            if (isNullOrEmpty(result[i][13])) { result[i][13] = null; } //info_enfant-sexe_enfant
            if (isNullOrEmpty(result[i][14])) { result[i][14] = null; } //info_enfant-parent_marie
            if (isNullOrEmpty(result[i][15])) { result[i][15] = null; } //info_enfant-meme_residence
            if (result[i][17] === null || result[i][17].length === 0) {
              result[i][17] = 0;
            } else {
              result[i][17] = 1;
            } //info_enfant-name_health_center queery to ber change to save yes or no
            if (isNullOrEmpty(result[i][21])) { result[i][21] = null; } //info_enfant_name_toooooooooooo beeeeeeeeeeeeeee filledddddddddddddddddddddddddd
            if (isNullOrEmpty(result[i][17])) { result[i][17] = null; } //info_enfant-name_health_center
            if (isNullOrEmpty(result[i][18])) { result[i][18] = null; } //info_enfant-name_domicile
            if (isNullOrEmpty(result[i][25])) { result[i][25] = null; } //info_enfant-region_naissance mothers
            if (isNullOrEmpty(result[i][26])) { result[i][26] = null; } //info_enfant-district_naissance mothers
            if (isNullOrEmpty(result[i][27])) { result[i][27] = null; } //info_enfant-commune_naissance mothers
            if (isNullOrEmpty(result[i][28])) { result[i][28] = null; } //info_enfant-fokontany mothers

            queryCivilRegisterInsert += `('${result[i][6]}', '${result[i][10]}', '${result[i][9]}', '${result[i][11]}', '${result[i][12]}', '${result[i][16]}', '${result[i][13]}', '${result[i][14]}', '${result[i][15]}', '${result[i][17]}', '${result[i][21]}', '${result[i][17]}', '${result[i][18]}', '${result[i][25]}', '${result[i][26]}', '${result[i][27]}', '${result[i][28]}'),`;
          }
          queryCivilRegisterInsert = removeCommaAtEnd(queryCivilRegisterInsert);
          queryCivilRegisterInsert += " RETURNING id, uin";
          resultCivilRegisterInsert = await runSql(pool, queryCivilRegisterInsert, []);


          queryRegistrationFormInsert = removeCommaAtEnd(queryRegistrationFormInsert);
          queryRegistrationFormInsert += " RETURNING id";
          var resultRegistrationFormInsertDeclarant = await runSql(pool, queryRegistrationFormInsert, []);
          resolve("Data entered");
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      return callBack(isNullOrEmpty(error.message) ? error : error.message, null);
    }
  },
  fileUpload: async (filePath, data, callBack) => {
    try {
      const currentDate = new Date();
      const formattedTime = currentDate.toLocaleString('en-US', { hour12: false });

      var insertQuery = 'INSERT INTO excel_upload_log (date_created, number_record, input_type, file, time_created, module_type) VALUES ($1, $2, $3, $4, $5, $6)';
      var insertResult = await runSql(pool, insertQuery, [
        currentDate.toISOString().substring(0, 19).replace('T', ' '),
        data.number_records,
        data.input_type,
        "/" + Paths.Paths.FILE + "/" + filePath,
        formattedTime,
        data.module_type
      ]);
      return callBack(null, insertResult.rows[0]);
    } catch (error) {
      return callBack(isNullOrEmpty(error.message) ? error : error.message, null);
    }
  },
  getAllLogs: async (page, limit, moduleType, callBack) => {
    try {
      const offset = (page - 1) * limit;
      let countQuery = 'SELECT COUNT(*) FROM excel_upload_log WHERE 1=1';
      let selectQuery = 'SELECT * FROM excel_upload_log WHERE 1=1';

      if (moduleType) {
        countQuery += ` AND module_type LIKE '%${moduleType}%'`;
        selectQuery += ` AND module_type LIKE '%${moduleType}%'`;
      }

      const countResult = await runSql(pool, countQuery);
      const selectResult = await runSql(pool, selectQuery + ' ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);

      const data = {
        total_count: countResult.rows[0].count,
        page_number: page,
        page_size: limit,
        data: selectResult.rows,
      };

      return callBack(null, data);
    } catch (error) {
      return callBack(error);
    }
  }

};