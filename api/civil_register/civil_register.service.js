const pool = require("../../config/database");
const Enums = require("../../helper/constants/Enums");
const Paths = require("../../helper/constants/Paths");
const helperfunctions = require("../../helper/helperfunctions");
const fs = require("fs");
const fastcsv = require('fast-csv');

module.exports = {
  create: (data, callBack) => {
    pool.query(
      `INSERT INTO civil_register(given_name, date_of_birth, time_of_birth, place_of_birth, gender, is_parents_married, is_residence_same, is_birth_in_hc, is_assisted_by_how, hc_name, cr_profession, is_other_nationality, nationality_name, is_other_residence, date_created, status, uin) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        data.given_name,
        data.date_of_birth,
        data.time_of_birth,
        data.place_of_birth,
        data.gender,
        data.is_parents_married,
        data.is_residence_same,
        data.is_birth_in_hc,
        data.is_assisted_by_how,
        data.hc_name,
        data.cr_profession,
        data.is_other_nationality,
        data.nationality_name,
        data.is_other_residence,
        new Date().toISOString().substring(0, 19).replace('T', ' '),
        data.status,
        data.uin
      ],
      (error, results, fields) => {
        if (error) {
          return callBack(error);
        }
        return callBack(null, results);
      }
    );
  },
  //working
  getAll: (page, limit, callback) => {
    const offset = (page - 1) * limit;
    const query = `
      SELECT *
      FROM civil_register
      ORDER BY id
      LIMIT ${limit}
      OFFSET ${offset};
      SELECT COUNT(*) AS total_records FROM civil_register;
    `;
    pool.query(query, (error, results) => {
      if (error) {
        return callback(error);
      }
      const data = {
        results: results[0].rows,
        total_records: results[1].rows[0].total_records,
      };
      return callback(null, data);
    });
  },
  //working
  update: (data, file, callBack) => {
    var query = "UPDATE tbl_career_application SET ";
    var whereClause = "";

    if (data.name !== null && data.name != "" && data.name != undefined) {
      query += `name = '${data.name}', `;
    }
    if (data.email !== null && data.email != "" && data.email != undefined) {
      query += `email = '${data.email}', `;
    }
    if (data.phone !== null && data.phone != "" && data.phone != undefined) {
      query += `phone = '${data.phone}', `;
    }
    if (data.position !== null && data.position != "" && data.position != undefined) {
      query += `position = '${data.position}', `;
    }
    if (data.department !== null && data.department != "" && data.department != undefined) {
      query += `department = '${data.department}', `;
    }
    if (file) {
      query += `cv = '${"/" + Paths.Paths.CV + "/" + file.filename}', `;
    }

    // Remove the last comma and space from the query string
    query = query.slice(0, -2);

    whereClause += `WHERE id = ${data.id}`;

    // Combine the query and the where clause
    query += " " + whereClause;

    pool.query(query, (error, results) => {
      if (error) {
        return callBack(error);
      }
      return callBack(null, results);
    });
  },
  //working
  deleteById: (id, callBack) => {
    pool.query(
      `DELETE FROM tbl_career_application WHERE id = ${id}`,
      [],
      (error, results) => {
        if (error) {
          //pool.endPool();
          return callBack(error);
        }
        //pool.endPool();
        return callBack(null, results);
      }
    );
  },
  readFiles: (filePath) => {
    let result = [];
    let extension = filePath.split('.').pop();

    return new Promise((resolve, reject) => {
      if (extension === 'xls' || extension === 'xlsx') {
        let workbook = xlsx.readFile(filePath);
        let sheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[sheetName];
        result = xlsx.utils.sheet_to_json(worksheet);
        resolve(result);
      } else if (extension === 'csv') {
        fs.createReadStream(filePath)
          .pipe(fastcsv.parse())
          .on('data', (data) => result.push(data))
          .on('end', () => {
            resolve(result);
          });

      } else {
        reject('Invalid file type');
      }
    });
  }
};