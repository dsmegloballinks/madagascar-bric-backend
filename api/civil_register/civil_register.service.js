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
  saveFileToDatabase: (filePath, callBack) => {
    try {
      let extension = filePath.split('.').pop();
      let result = [];
      let childId;
      let motherId;
      return new Promise(async (resolve, reject) => {
        try {
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
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      return callBack(isNullOrEmpty(error.message) ? error : error.message, null);
    }
  },
  getChildCount: async (sDate, callBack) => {
    try {
      // VALID_DATE_FORMAT yyyy-mm-dd //

      var response = {};
      var year = sDate.split("-")[0];
      var month = sDate.split("-")[1];
      //#region OverAll
      var queryOverAllCount = "SELECT count(child_cr_id) FROM registration_form";
      var resultOverAllCount = await runSql(pool, queryOverAllCount, []);
      response.over_all_count = resultOverAllCount.rows[0].count;
      //#endregion

      //#region LastMonth
      var monthDates = getMonthStartEnd(sDate);
      var queryMonthDataQuery = `SELECT count(child_cr_id) FROM registration_form where dec_date >= '${monthDates.start}' and dec_date <= '${monthDates.end}'`;
      var resultMonthDataQuery = await runSql(pool, queryMonthDataQuery, []);
      response.month_count = resultMonthDataQuery.rows[0].count;
      //#region LastMonth

      //#region LastYear
      var yearDates = getLastYear(sDate);
      var queryYearData = `SELECT count(child_cr_id) FROM registration_form where dec_date >= '${yearDates.start}' and dec_date <= '${yearDates.end}'`;
      var resultYearData = await runSql(pool, queryYearData, []);
      response.year_count = resultYearData.rows[0].count;
      //#region LastYear

      //#region LastSevenDays
      var lastSevenDates = getLastSevenDays(sDate);
      var queryLastSevenData = `SELECT count(child_cr_id) FROM registration_form where dec_date >= '${lastSevenDates.start}' and dec_date <= '${lastSevenDates.end}'`;
      var resultLastSevenData = await runSql(pool, queryLastSevenData, []);
      response.last_seven_days_count = resultLastSevenData.rows[0].count;
      //#region LastSevenDays

      return callBack(null, response);
    } catch (error) {
      return callBack(error, null);
    }
  },
  getFokontany: async (searchParams, callBack) => {
    try {
      const { libelle_region, libelle_district, libelle_commune } = searchParams || {};
      const params = [];
      let ids = [];
      let resultQuery = "";
      if (libelle_region != null) {
        let query = `select distinct on (code_district) code_district, id From fokontany where code_region = ${libelle_region}`;
        resultQuery = await runSql(pool, query, []);
      }
      else if (libelle_district != null) {
        let query = `select distinct on (code_commune) code_commune, id From fokontany where code_district = ${libelle_district}`;
        resultQuery = await runSql(pool, query, []);
      }
      else if (libelle_commune != null) {
        let query = `select distinct on (code_fokontany) code_fokontany, id From fokontany where code_commune = ${libelle_commune}`;
        resultQuery = await runSql(pool, query, []);
      }
      else {
        let query = "select distinct on (code_region) id, code_region from fokontany;";
        resultQuery = await runSql(pool, query, []);
      }
      ids = resultQuery.rows.map(x => x.id);
      var queryFinalResult = `select * from fokontany where id in (${ids})`;
      var resultFinalResult = await runSql(pool, queryFinalResult, []);
      return callBack(null, resultFinalResult.rows);
    } catch (error) {
      return callBack(error, null);
    }
  },
  Dashboard: (region, district, commune, fokontany, callBack) => {
    const filterConditions = [];
    const filterValues = [];

    if (!isNullOrEmpty(region)) {
      filterConditions.push(`code_region = $${filterValues.length + 1}`);
      filterValues.push(region);
    }
    if (!isNullOrEmpty(district)) {
      filterConditions.push(`code_district = $${filterValues.length + 1}`);
      filterValues.push(district);
    }
    if (!isNullOrEmpty(commune)) {
      filterConditions.push(`code_commune = $${filterValues.length + 1}`);
      filterValues.push(commune);
    }
    if (!isNullOrEmpty(fokontany)) {
      filterConditions.push(`code_fokontany = $${filterValues.length + 1}`);
      filterValues.push(fokontany);
    }

    let sqlQuery = `
      SELECT child_cr_id
      FROM registration_form
    `;

    if (filterConditions.length > 0) {
      sqlQuery += `
        INNER JOIN civil_register ON registration_form.mother_cr_id = civil_register.id
        WHERE ${filterConditions.join(' AND ')}
      `;
    }

    pool.query(sqlQuery, filterValues, (error, results) => {
      if (error) {
        callBack(error);
      } else {
        const childCrIds = results.rows.map((result) => result.child_cr_id);

        let childCountQuery = `
          SELECT gender, COUNT(*) AS child_count
          FROM civil_register
          WHERE id IN (${childCrIds})
        `;

        if (filterConditions.length > 0) {
          childCountQuery += `
            AND ${filterConditions.join(' AND ')}
          `;
        }

        childCountQuery += `
          GROUP BY gender
        `;

        pool.query(childCountQuery, filterValues, (error, result) => {
          if (error) {
            callBack(error);
          } else {
            let total = 0;
            result.rows.forEach((element) => {
              total += parseInt(element.child_count);
            });
            result.rows.forEach((element) => {
              element.avg = 0;
              element.avg = ((parseInt(element.child_count) / total) * 100).toFixed(2);
            });
            callBack(null, result.rows);
          }
        });
      }
    });
  },
  getSevenDayGraph: async (sDate, sEndDate, candle, region, district, commune, fokontany, callBack) => {
    try {
      // VALID_DATE_FORMAT yyyy-mm-dd //
      var lastSevenDates = getLastSevenDays(sDate);
      var queryLastSevenData = `SELECT rf.*, cr.gender FROM registration_form rf INNER JOIN civil_register cr ON rf.mother_cr_id = cr.id
      WHERE rf.dec_date >= '${sDate}' AND rf.dec_date <= '${sEndDate}'`;
      if (!isNullOrEmpty(region)) {
        queryLastSevenData += ` AND cr.code_region = '${region}'`;
      }
      if (!isNullOrEmpty(district)) {
        queryLastSevenData += ` AND cr.code_district = '${district}'`;
      }
      if (!isNullOrEmpty(commune)) {
        queryLastSevenData += ` AND cr.code_commune = '${commune}'`;
      }
      if (!isNullOrEmpty(fokontany)) {
        queryLastSevenData += ` AND cr.code_fokontany = '${fokontany}'`;
      }

      var resultLastSevenData = await runSql(pool, queryLastSevenData, []);
      var data = resultLastSevenData.rows.map((d) => {
        return { ...d, dec_date: new Date(d.dec_date) };
      });
      var minuteDifference = parseInt((getMinuteDiff(sDate, sEndDate)) / candle);
      var endDate = stringToDate(sEndDate);
      var conditionStartDate = stringToDate(sDate);
      var conditionEndDate = addMinutesToDate(stringToDate(sDate), minuteDifference);
      var response = [];
      var counter = 1;
      while (conditionEndDate < endDate) {
        var candleData = data.filter(item => item.dec_date >= conditionStartDate && item.dec_date <= conditionEndDate);
        const centerDate = convertDateToString(getCenterDate(conditionStartDate, conditionEndDate));
        response.push({
          count: candleData.length,
          date: convertDateToDDDD(centerDate),
          quarterly: `Q${counter}`,
          time: convertToTime(centerDate),
          day: convertDateToDDD(centerDate),
          month: convertDateToMMM(centerDate),
        });
        conditionStartDate = conditionEndDate;
        conditionEndDate = addMinutesToDate(stringToDate(convertDateToString(conditionEndDate)), minuteDifference);
        counter = counter + 1;
      }
      return callBack(null, {
        total_count: response.reduce((acc, obj) => acc + obj.count, 0),
        data_list: response
      });
    } catch (error) {
      return callBack(!isNullOrEmpty(error.message) ? error.message : error, null);
    }
  }
};