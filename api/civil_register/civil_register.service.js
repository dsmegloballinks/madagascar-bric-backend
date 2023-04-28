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


let fatherId;
let valueToSearch;
let decId;

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
      SELECT DISTINCT cr.*, rf.child_cr_id, mother.id as mother_cr_id, father_cr_id, declarant_cr_id
      FROM civil_register cr
      JOIN registration_form rf ON cr.id = rf.child_cr_id
      JOIN civil_register mother ON mother.id = rf.mother_cr_id
      ORDER BY cr.id
      LIMIT ${limit}
      OFFSET ${offset};
      SELECT COUNT(DISTINCT cr.id) AS total_records 
      FROM civil_register cr
      JOIN registration_form rf ON cr.id = rf.child_cr_id 
      JOIN civil_register mother ON mother.id = rf.mother_cr_id        
    `;
    pool.query(query, (error, results) => {
      if (error) {
        return callback(error, null);
      }
      const allResult = [];
      for (let x = 0; x < results[0].rows.length; x++) {
        const motherQuery = `SELECT * FROM civil_register where id = ${results[0].rows[x].mother_cr_id}`;
        pool.query(motherQuery, (motherError, motherResults) => {
          if (motherError) {
            return callback(motherError, null);
          } else {
            const fatherQuery = `SELECT * FROM civil_register where id = ${results[0].rows[x].father_cr_id}`;
            pool.query(fatherQuery, (fatherError, fatherResults) => {
              if (fatherError) {
                return callback(fatherError, null);
              } else {
                const DecQuery = `SELECT * FROM civil_register where id = ${results[0].rows[x].declarant_cr_id}`;
                pool.query(DecQuery, (decError, DecResults) => {
                  if (decError) {
                    return callback(decError, null);
                  } else {
                    const record = {
                      cr: results[0].rows[x],
                      mother: motherResults.rows[0],
                      father: fatherResults.rows[0],
                      declarant: DecResults.rows[0],
                    };
                    allResult.push(record);
                    if (allResult.length === results[0].rows.length) {
                      const data = {
                        results: allResult,
                        total_records: results[1].rows[0].total_records,
                      };
                      return callback(null, data);
                    }
                  }
                });
              }
            });
          }
        });
      }
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
      `DELETE FROM civil_register WHERE id = ${id}`,
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
  saveFileToDatabase: (filePath) => {
    try {
      let extension = filePath.split('.').pop();
      let result = [];
      let childId;
      let motherId;
      return new Promise(async (resolve, reject) => {

        let resultCivilRegisterInsert;
        let resultCivilRegisterInsertFather;
        let resultCivilRegisterInsertMother;
        let resultCivilRegisterInsertDeclarant;

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
        var queryCivilRegisterInsert = "INSERT INTO civil_register (uin, given_name, date_of_birth, time_of_birth, place_of_birth, gender, is_parents_married, is_residence_same, is_birth_in_hc, is_assisted_by_how, hc_name, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth) VALUES";
        for (let i = 1; i < result.length; i++) {
          if (isNullOrEmpty(result[i][6])) { result[i][6] = null; }
          if (isNullOrEmpty(result[i][10])) { result[i][10] = null; }
          if (isNullOrEmpty(result[i][11])) { result[i][11] = null; }
          if (isNullOrEmpty(result[i][12])) { result[i][12] = null; }
          if (isNullOrEmpty(result[i][13])) { result[i][13] = null; }
          if (isNullOrEmpty(result[i][17])) { result[i][17] = null; }
          if (isNullOrEmpty(result[i][18])) { result[i][18] = null; }
          if (isNullOrEmpty(result[i][19])) { result[i][19] = null; }
          if (isNullOrEmpty(result[i][21])) { result[i][21] = null; }
          if (isNullOrEmpty(result[i][21])) { result[i][21] = null; }
          if (isNullOrEmpty(result[i][21])) { result[i][21] = null; }
          if (isNullOrEmpty(result[i][22])) { result[i][22] = null; }
          if (isNullOrEmpty(result[i][13])) { result[i][13] = null; }
          if (isNullOrEmpty(result[i][14])) { result[i][14] = null; }
          if (isNullOrEmpty(result[i][15])) { result[i][15] = null; }
          if (isNullOrEmpty(result[i][16])) { result[i][16] = null; }
          queryCivilRegisterInsert += `('${result[i][6]}', '${result[i][10]}', '${result[i][11]}', '${result[i][12]}', '${result[i][13]}', '${result[i][17]}', '${result[i][18]}', '${result[i][19]}', '${result[i][21]}', '${result[i][21]}', '${result[i][21]}', '${result[i][22]}', '${result[i][13]}', '${result[i][14]}', '${result[i][15]}', '${result[i][16]}'),`;
        }
        queryCivilRegisterInsert = removeCommaAtEnd(queryCivilRegisterInsert);
        queryCivilRegisterInsert += " RETURNING id, uin";
        resultCivilRegisterInsert = await runSql(pool, queryCivilRegisterInsert, []);


        var queryCivilRegisterInsertFather = "INSERT INTO civil_register (uin, given_name, date_of_birth, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES";
        // ######## FOR FATHER ######## \\
        for (let i = 1; i < result.length; i++) {
          if (isNullOrEmpty(result[i][36])) { result[i][36] = null; }
          if (isNullOrEmpty(result[i][38])) { result[i][38] = null; }
          if (isNullOrEmpty(result[i][39])) { result[i][39] = null; }
          if (isNullOrEmpty(result[i][42])) { result[i][42] = null; }
          if (isNullOrEmpty(result[i][43])) { result[i][43] = null; }
          if (isNullOrEmpty(result[i][44])) { result[i][44] = null; }
          if (isNullOrEmpty(result[i][45])) { result[i][45] = null; }
          if (isNullOrEmpty(result[i][46])) { result[i][46] = null; }

          queryCivilRegisterInsertFather += `(${result[i][36]},'${result[i][38]}','${result[i][39]}','${result[i][42]}','${result[i][43]}','${result[i][44]}','${result[i][45]}','${result[i][46]}'),`;
        }
        queryCivilRegisterInsertFather = removeCommaAtEnd(queryCivilRegisterInsertFather);
        queryCivilRegisterInsertFather += " RETURNING id, uin";
        resultCivilRegisterInsertFather = await runSql(pool, queryCivilRegisterInsertFather, []);
        // ######## FOR FATHER ######## \\

        // ######## FOR MOTHER ######## \\
        var queryCivilRegisterInsertMother = "INSERT INTO civil_register (uin, given_name, date_of_birth, place_of_birth, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES";
        for (let i = 1; i < result.length; i++) {
          if (isNullOrEmpty(result[i][24])) { result[i][24] = null; }
          if (isNullOrEmpty(result[i][26])) { result[i][26] = null; }
          if (isNullOrEmpty(result[i][27])) { result[i][27] = null; }
          if (isNullOrEmpty(result[i][29])) { result[i][29] = null; }
          if (isNullOrEmpty(result[i][34])) { result[i][34] = null; }
          if (isNullOrEmpty(result[i][29])) { result[i][29] = null; }
          if (isNullOrEmpty(result[i][30])) { result[i][30] = null; }
          if (isNullOrEmpty(result[i][31])) { result[i][31] = null; }
          if (isNullOrEmpty(result[i][32])) { result[i][32] = null; }
          if (isNullOrEmpty(result[i][33])) { result[i][33] = null; }

          queryCivilRegisterInsertMother += `('${result[i][24]}', '${result[i][26]}', '${result[i][27]}', '${result[i][29]}', '${result[i][34]}', '${result[i][29]}', '${result[i][30]}', '${result[i][31]}',  '${result[i][32]}', '${result[i][33]}'),`;
        }
        queryCivilRegisterInsertMother = removeCommaAtEnd(queryCivilRegisterInsertMother);
        queryCivilRegisterInsertMother += " RETURNING id, uin";
        resultCivilRegisterInsertMother = await runSql(pool, queryCivilRegisterInsertMother, []);
        // ######## FOR MOTHER ######## \\


        // ######## FOR DECLARANT ######## \\
        var queryCivilRegisterInsertDeclarant = "INSERT INTO civil_register (uin, given_name, date_of_birth, region_of_birth) VALUES";
        for (let i = 1; i < result.length; i++) {
          if (isNullOrEmpty(result[i][48])) { result[i][48] = null; }
          if (isNullOrEmpty(result[i][50])) { result[i][50] = null; }
          if (isNullOrEmpty(result[i][51])) { result[i][51] = null; }
          if (isNullOrEmpty(result[i][52])) { result[i][52] = null; }

          queryCivilRegisterInsertDeclarant += `('${result[i][48]}', '${result[i][50]}', '${result[i][51]}', '${result[i][52]}'),`;
        }
        queryCivilRegisterInsertDeclarant = removeCommaAtEnd(queryCivilRegisterInsertDeclarant);
        queryCivilRegisterInsertDeclarant += " RETURNING id, uin";
        resultCivilRegisterInsertDeclarant = await runSql(pool, queryCivilRegisterInsertDeclarant, []);
        // ######## FOR DECLARANT ######## \\

        var childsInfo = resultCivilRegisterInsert.rows;
        var fathersInfo = resultCivilRegisterInsertFather.rows;
        var mothersInfo = resultCivilRegisterInsertMother.rows;
        var delarantsInfo = resultCivilRegisterInsertDeclarant.rows;

        var resultCopy = result.splice(1, result.length - 1);
        var queryRegistrationFormInsert = "INSERT INTO registration_form (child_cr_id, father_cr_id, mother_cr_id, declarant_cr_id, dec_relation, dec_date, transcription_date, dec_sign, in_charge_sign) VALUES";
        for (let i = 0; i < childsInfo.length; i++) {
          const childInfo = childsInfo[i];
          let indexChildFileData = resultCopy.findIndex(element => element[6] == childInfo.uin);
          if (indexChildFileData > -1) {
            var indexFather = fathersInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][36]);
            var indexMother = mothersInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][24]);
            var indexDeclarant = delarantsInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][48]);
            var fatherId = fathersInfo[indexFather].id;
            var motherId = mothersInfo[indexMother].id;
            var declarantId = delarantsInfo[indexDeclarant].id;
            queryRegistrationFormInsert += `(${childInfo.id},${fatherId},${motherId},${declarantId},'${resultCopy[indexChildFileData][47]}','${resultCopy[indexChildFileData][7]}','${resultCopy[indexChildFileData][8]}','${resultCopy[indexChildFileData][53]}','${resultCopy[indexChildFileData][53]}'),`
          }
        }
        queryRegistrationFormInsert = removeCommaAtEnd(queryRegistrationFormInsert);
        queryRegistrationFormInsert += " RETURNING id";
        var resultRegistrationFormInsertDeclarant = await runSql(pool, queryRegistrationFormInsert, []);
        resolve("Data entered");

      });
    } catch (error) {
      resolve("Some Error Occurred");
    }
  },
  //sample fucntion only\\
  saveFileToDatabase2: (filePath) => {
    let extension = filePath.split('.').pop();
    let result = [];
    let childId;
    let motherId;

    return new Promise(async (resolve, reject) => {
      if (extension === 'xls' || extension === 'xlsx') {
        let workbook = xlsx.readFile(filePath);
        let sheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[sheetName];
        result = xlsx.utils.sheet_to_json(worksheet);
        //--for child--//
        let values = [];
        for (let i = 1; i < result.length; i++) {
          values.push([result[i][6], result[i][10], result[i][11], result[i][11], result[i][13], result[i][17], result[i][18], result[i][19], result[i][21], result[i][21], result[i][21], result[i][22], result[i][13], result[i][14], result[i][15], result[i][16]]);
        }

        let query = "INSERT INTO civil_register (uin, given_name, date_of_birth, time_of_birth, place_of_birth, gender, is_parents_married, is_residence_same, is_birth_in_hc, is_assisted_by_how, hc_name, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)";
        for (let i = 1; i < result.length; i++) {
          values.push([result[i][6], result[i][10], result[i][11], result[i][11], result[i][13], result[i][17], result[i][18], result[i][19], result[i][21], result[i][21], result[i][21], result[i][22], result[i][13], result[i][14], result[i][15], result[i][16]]);
        }
        // pool.query(query, [values], (err, res) => {
        //   if (err) {
        //     reject(err);
        //   }
        //   resolve(res);
        // });
      } else if (extension === 'csv') {

        fs.createReadStream(filePath)
          .pipe(fastcsv.parse())
          .on('data', (data) => {
            result.push(data);
          })
          .on('end', async () => {
            let values = [];
            for (let i = 1; i < result.length; i++) {
              values.push([result[i][6], result[i][10], result[i][11], result[i][12], result[i][13], result[i][17], result[i][18], result[i][19], result[i][21], result[i][21], result[i][21], result[i][22], result[i][13], result[i][14], result[i][15], result[i][16]]);
            }
            let query = "INSERT INTO civil_register (uin, given_name, date_of_birth, time_of_birth, place_of_birth, gender, is_parents_married, is_residence_same, is_birth_in_hc, is_assisted_by_how, hc_name, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id";
            var queryCivilRegisterInsert = "INSERT INTO civil_register (uin, given_name, date_of_birth, time_of_birth, place_of_birth, gender, is_parents_married, is_residence_same, is_birth_in_hc, is_assisted_by_how, hc_name, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth) VALUES";
            for (let i = 1; i < result.length; i++) {
              if (isNullOrEmpty(result[i][6])) { result[i][6] = null; }
              if (isNullOrEmpty(result[i][10])) { result[i][10] = null; }
              if (isNullOrEmpty(result[i][11])) { result[i][11] = null; }
              if (isNullOrEmpty(result[i][12])) { result[i][12] = null; }
              if (isNullOrEmpty(result[i][13])) { result[i][13] = null; }
              if (isNullOrEmpty(result[i][17])) { result[i][17] = null; }
              if (isNullOrEmpty(result[i][18])) { result[i][18] = null; }
              if (isNullOrEmpty(result[i][19])) { result[i][19] = null; }
              if (isNullOrEmpty(result[i][21])) { result[i][21] = null; }
              if (isNullOrEmpty(result[i][21])) { result[i][21] = null; }
              if (isNullOrEmpty(result[i][21])) { result[i][21] = null; }
              if (isNullOrEmpty(result[i][22])) { result[i][22] = null; }
              if (isNullOrEmpty(result[i][13])) { result[i][13] = null; }
              if (isNullOrEmpty(result[i][14])) { result[i][14] = null; }
              if (isNullOrEmpty(result[i][15])) { result[i][15] = null; }
              if (isNullOrEmpty(result[i][16])) { result[i][16] = null; }
              queryCivilRegisterInsert += `('${result[i][6]}', '${result[i][10]}', '${result[i][11]}', '${result[i][12]}', '${result[i][13]}', '${result[i][17]}', '${result[i][18]}', '${result[i][19]}', '${result[i][21]}', '${result[i][21]}', '${result[i][21]}', '${result[i][22]}', '${result[i][13]}', '${result[i][14]}', '${result[i][15]}', '${result[i][16]}'),`;
              queryCivilRegisterInsert += `(${result[i][36]},${result[i][38]},${result[i][39]},${result[i][42]},${result[i][43]},${result[i][44]},${result[i][45]},${result[i][46]}),`;
            }
            queryCivilRegisterInsert = removeCommaAtEnd(queryCivilRegisterInsert);
            queryCivilRegisterInsert += " RETURNING id, uin";
            try {
              var dataResult = await runSql(pool, queryCivilRegisterInsert, []);
            }
            catch (exceptionError) {
              console.log(exceptionError.message);
            }

            pool.query(query, values[0], (err, res) => {
              //console.log("err:", err)
              if (err) {
                reject(err);
              }
              //console.log("cId:", res.rows[0].id)
              childId = res.rows[0].id;

              //--for  mother--//

              for (let i = 1; i < result.length; i++) {
                valueToSearch = result[i][24];

                pool.query(`SELECT * FROM civil_register WHERE uin = '${valueToSearch}'`, (err, dbResult) => {
                  if (err) {
                    console.error(err);
                  } else {
                    if (dbResult.rows.length > 0) {
                      // console.log("mId:", dbResult.rows[0].id)
                      motherId = dbResult.rows[0].id;
                      valueToSearch = result[i][36];
                      insertFather(valueToSearch, i);
                      //console.log(`Value '${valueToSearch}' exists in the database`);
                    } else {
                      const valuesToInsert = [result[i][24],
                      result[i][26],
                      result[i][27],
                      result[i][29],
                      result[i][34],
                      result[i][29],
                      result[i][30],
                      result[i][31],
                      result[i][32],
                      result[i][33]
                      ];

                      let query2 = "INSERT INTO civil_register (uin, given_name, date_of_birth, place_of_birth, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id";

                      pool.query(query2, valuesToInsert, (err, res) => {
                        if (err) {
                          console.error(err);
                        } else {
                          //console.log("mId:", res.rows[0].id)
                          motherId = res.rows[0].id;
                          valueToSearch = result[i][36];
                          insertFather(valueToSearch, i);
                          //console.log(`Value '${valueToSearch}' does not exist in the database and has been inserted`);
                        }
                      });
                    }
                  }
                });
                // }
                //for father//
                // for (let i = 1; i < result.length; i++) {
                // pool.query(`SELECT * FROM civil_register WHERE uin = '${valueToSearch}'`, (err, dbResult) => {
                //   if (err) {
                //     console.error(err);
                //   } else {
                //     if (dbResult.rows.length > 0) {
                //       //console.log("fId:", dbResult.rows[0].id)
                //       fatherId = dbResult.rows[0].id;
                //       //console.log(`Value '${valueToSearch}' exists in the database`);
                //     } else {
                //       if (result[i][40] == "non") {
                //         const valuesToInsert = [result[i][36],
                //         result[i][38],
                //         result[i][39],
                //         result[i][42],
                //         result[i][43],
                //         result[i][44],
                //         result[i][45],
                //         result[i][46]
                //         ];

                //         let query2 = "INSERT INTO civil_register (uin, given_name, date_of_birth, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id";

                //         pool.query(query2, valuesToInsert, (err, res) => {
                //           if (err) {
                //             console.error(err);
                //           } else {
                //             //console.log("fId:", res.rows[0].id)
                //             fatherId = res.rows[0].id;
                //             //console.log(`Value '${valueToSearch}' does not exist in the database and has been inserted`);
                //           }
                //         });
                //       } else {
                //         const valuesToInsert = [result[i][36],
                //         result[i][38],
                //         result[i][39],
                //         result[i][29],
                //         result[i][30],
                //         result[i][31],
                //         result[i][32],
                //         result[i][46]
                //         ];

                //         let query2 = "INSERT INTO civil_register (uin, given_name, date_of_birth, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id";

                //         pool.query(query2, valuesToInsert, (err, res) => {
                //           if (err) {
                //             console.error(err);
                //           } else {
                //             //console.log("fId:", res.rows[0].id)
                //             fatherId = res.rows[0].id;
                //             //console.log(`Value '${valueToSearch}' does not exist in the database and has been inserted`);
                //           }
                //         });
                //       }

                //     }
                //   }
                // });
                // }
                //--for declarent--//
                // for (let i = 1; i < result.length; i++) {

                // pool.query(`SELECT * FROM civil_register WHERE uin = '${valueToSearch}'`, (err, dbResult) => {
                //   if (err) {
                //     console.error(err);
                //   } else {
                //     if (dbResult.rows.length > 0) {
                //       //console.log("fId:", dbResult.rows[0].id)
                //       decId = res.rows[0].id;
                //       //console.log(`Value '${valueToSearch}' exists in the database`);
                //     } else {
                //       const valuesToInsert = [result[i][48],
                //       result[i][50],
                //       result[i][51],
                //       result[i][52]
                //       ];

                //       let query2 = "INSERT INTO civil_register (uin, given_name, date_of_birth, region_of_birth) VALUES ($1, $2, $3, $4) RETURNING id";

                //       pool.query(query2, valuesToInsert, (err, res) => {
                //         //console.log("error :", err);
                //         //console.log("res :", res);
                //         if (err) {
                //           console.error(err);
                //         } else {
                //           //console.log("DId:", res.rows[0].id);
                //           decId = res.rows[0].id;
                //           //console.log("dic id :", decId);
                //           //console.log(`Value '${valueToSearch}' does not exist in the database and has been inserted`);
                //         }
                //       });
                //     }
                //   }
                // });
                // }
                // for (let i = 1; i < result.length; i++) {
                let selectQuery = "SELECT id FROM civil_register LIMIT 1 OFFSET $1";
                let selectValues = [i - 1];

                pool.query(selectQuery, selectValues, (err, res) => {
                  if (err) {
                    console.error(err);
                  } else {
                    let childId = res.rows[0].id;

                    const valuesToInsert = [childId, fatherId, motherId, decId, result[i][47],
                      result[i][7],
                      result[i][8],
                      result[i][53],
                      result[i][53]
                    ];

                    let insertQuery = "INSERT INTO registration_form (child_cr_id, father_cr_id, mother_cr_id, declarant_cr_id, dec_relation, dec_date, transcription_date, dec_sign, in_charge_sign) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)";
                    //console.log("insertQuery :", insertQuery);
                    //console.log("valuesToInsert :", valuesToInsert);

                    pool.query(insertQuery, valuesToInsert, (err, res) => {
                      if (err) {
                        console.error(err);
                      } else {
                        //console.log(`Values '${valuesToInsert}' have been inserted`);
                      }
                    });
                  }
                });
                // }

                // for (let i = 1; i < result.length; i++) {
                const valuesToInsert = [
                  childId,
                  result[i][55],
                  result[i][56],
                  new Date().toISOString().substring(0, 19).replace('T', ' '),
                ];

                let query2 = "INSERT INTO attached_document (cr_id, document_name, document_type, date_created) VALUES ($1, $2, $3, $4)";

                pool.query(query2, valuesToInsert, (err, res) => {
                  if (err) {
                    console.error(err);
                  } else {
                    resolve(res);
                    //console.log(`Value '${valuesToInsert}' does not exist in the database and has been inserted`);
                  }

                });

              }

              return 0;
            });

          });
      } else {
        reject('Invalid file type');
      }
    });

    function insertDec(valueToSearch, i) {
      pool.query(`SELECT * FROM civil_register WHERE uin = '${valueToSearch}'`, (err, dbResult) => {
        if (err) {
          console.error(err);
        } else {
          if (dbResult.rows.length > 0) {
            //console.log("fId:", dbResult.rows[0].id)
            decId = res.rows[0].id;
            //console.log(`Value '${valueToSearch}' exists in the database`);
          } else {
            const valuesToInsert = [result[i][48],
            result[i][50],
            result[i][51],
            result[i][52]
            ];

            let query2 = "INSERT INTO civil_register (uin, given_name, date_of_birth, region_of_birth) VALUES ($1, $2, $3, $4) RETURNING id";

            pool.query(query2, valuesToInsert, (err, res) => {
              //console.log("error :", err);
              //console.log("res :", res);
              if (err) {
                console.error(err);
              } else {
                //console.log("DId:", res.rows[0].id);
                decId = res.rows[0].id;
                //console.log("dic id :", decId);
                //console.log(`Value '${valueToSearch}' does not exist in the database and has been inserted`);
              }
            });
          }
        }
      });
    }

    function insertFather(valueToSearch, i) {
      pool.query(`SELECT * FROM civil_register WHERE uin = '${valueToSearch}'`, (err, dbResult) => {
        if (err) {
          console.error(err);
        } else {
          if (dbResult.rows.length > 0) {
            //console.log("fId:", dbResult.rows[0].id)
            fatherId = dbResult.rows[0].id;
            valueToSearch = result[i][48];
            insertDec(valueToSearch, i);
            //console.log(`Value '${valueToSearch}' exists in the database`);
          } else {
            if (result[i][40] == "non") {
              const valuesToInsert = [result[i][36],
              result[i][38],
              result[i][39],
              result[i][42],
              result[i][43],
              result[i][44],
              result[i][45],
              result[i][46]
              ];

              let query2 = "INSERT INTO civil_register (uin, given_name, date_of_birth, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id";

              pool.query(query2, valuesToInsert, (err, res) => {
                if (err) {
                  console.error(err);
                } else {
                  //console.log("fId:", res.rows[0].id)
                  fatherId = res.rows[0].id;
                  valueToSearch = result[i][48];
                  insertDec(valueToSearch, i);
                  //console.log(`Value '${valueToSearch}' does not exist in the database and has been inserted`);
                }
              });
            } else {
              const valuesToInsert = [result[i][36],
              result[i][38],
              result[i][39],
              result[i][29],
              result[i][30],
              result[i][31],
              result[i][32],
              result[i][46]
              ];

              let query2 = "INSERT INTO civil_register (uin, given_name, date_of_birth, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id";

              pool.query(query2, valuesToInsert, (err, res) => {
                if (err) {
                  console.error(err);
                } else {
                  //console.log("fId:", res.rows[0].id)
                  fatherId = res.rows[0].id;
                  //console.log(`Value '${valueToSearch}' does not exist in the database and has been inserted`);
                }
              });
            }

          }
        }
      });
    }

  }
};