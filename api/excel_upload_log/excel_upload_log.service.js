const pool = require("../../config/database");
const Paths = require("../../helper/constants/Paths");
const fs = require("fs");
const fastcsv = require('fast-csv');
const { runSql } = require("../../helper/helperfunctions");
const { removeCommaAtEnd } = require("../../helper/helperfunctions");
const { isNullOrEmpty } = require("../../helper/helperfunctions");

module.exports = {

  /* `saveFileDetail` is a function that takes in a file path and a callback function as parameters. It
  reads the file and extracts data from it based on the file extension (xlsx, xls, or csv). It then
  processes the data and inserts it into a database table called `upload_excel_log`. The function
  returns a Promise that resolves with a message indicating that the data has been entered into the
  database. If there is an error, the Promise is rejected with an error message. */
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
            } //info_enfant-name_health_center query to ber change to save yes or no
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
  /* `fileUpload` is a function that takes in a file path, data, and a callback function as parameters.
  It inserts data into a database table called `excel_upload_log` with the details of the uploaded
  file, including the date and time of upload, the number of records, the input type, the file path,
  and the module type. It then returns a Promise that resolves with the inserted data if successful,
  or rejects with an error message if there is an error. */
  fileUpload: async (filePath, data, callBack) => {
    try {
      const currentDate = new Date();
      var insertQuery = `INSERT INTO excel_upload_log (date_created, number_record, input_type, file, time_created, module_type) VALUES ($1, $2, $3, $4, $5, $6)`;
      console.log(insertQuery)
      var insertResult = await runSql(pool, insertQuery, [
        currentDate.toISOString().split('T')[0],
        data.number_records,
        data.input_type,
        "/" + Paths.Paths.FILE + "/" + filePath,
        currentDate.toISOString().substring(0, 19).replace('T', ' '),
        data.module_type
      ]);
      return callBack(null, insertResult.rows[0]);
    } catch (error) {
      return callBack(isNullOrEmpty(error.message) ? error : error.message, null);
    }
  },
  /* `getAllLogs` is a function that retrieves data from the `excel_upload_log` table in the database.
  It takes in four parameters: `page`, `limit`, `moduleType`, and `file`. */
  getAllLogs: async (page, limit, moduleType, file, callBack) => {
    try {
      const offset = (page - 1) * limit;
      let countQuery = 'SELECT COUNT(*) FROM excel_upload_log WHERE 1=1';
      let selectQuery = 'SELECT * FROM excel_upload_log WHERE 1=1';

      if (moduleType) {
        countQuery += ` AND module_type LIKE '%${moduleType}%'`;
        selectQuery += ` AND module_type LIKE '%${moduleType}%'`;
      }

      if (file) {
        const fileName = file.substring(file.lastIndexOf('/') + 1);
        countQuery += ` AND file LIKE '%${fileName}%'`;
        selectQuery += ` AND file LIKE '%${fileName}%'`;
      }

      const countResult = await runSql(pool, countQuery);
      const selectResult = await runSql(pool, selectQuery + ' ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);

      const data = {
        total_count: countResult.rows[0].count -1,
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