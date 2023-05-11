const pool = require("../../config/database");
const Paths = require("../../helper/constants/Paths");
const fs = require("fs");
const fastcsv = require('fast-csv');
const { runSql } = require("../../helper/helperfunctions");
const { removeCommaAtEnd } = require("../../helper/helperfunctions");
const { isNullOrEmpty } = require("../../helper/helperfunctions");
const { stringToDate } = require("../../helper/helperfunctions");
const { formatDate } = require("../../helper/helperfunctions");
const { getLastDates } = require("../../helper/helperfunctions");
const { convertDateToStringMoment } = require("../../helper/helperfunctions");
const { getCenterDateMoment } = require("../../helper/helperfunctions");
const moment = require("moment/moment");

module.exports = {
  signUp: async (data, callBack) => {
    try {
      var checkEmailQuery = 'SELECT * FROM access_control WHERE email = $1';
      var
        checkEmailResult = await runSql(pool, checkEmailQuery, [data.email]);
      if (checkEmailResult.rows.length > 0) {
        return callBack(new Error('Email already exists'));
      }
      var insertQuery = `INSERT INTO access_control (user_name, password, email, date_created, status, is_user_admin) 
            VALUES($1, $2, $3, $4, $5, $6) RETURNING *`;
      var insertResult = await runSql(pool, insertQuery, [
        data.user_name,
        data.password,
        data.email,
        new Date().toISOString().substring(0, 19).replace('T', ' '),
        1,
        0
      ]);
      return callBack(null, insertResult.rows);
    } catch (error) {
      return callBack(error);
    }
  },
  updateUser: async (data, userId) => {
    try {
      const checkUserQuery = `SELECT * FROM access_control WHERE user_id = $1`;
      const checkUserResult = await runSql(pool, checkUserQuery, [userId]);
      if (checkUserResult.rowCount === 0) {
        throw new Error('User does not exist');
      }

      const updateQuery = `UPDATE access_control SET email = $1, user_name = $2 WHERE user_id = $3`;
      const body = [
        data.email,
        data.user_name,
        userId
      ];
      const updateResult = await runSql(pool, updateQuery, body);
      return updateResult.rows[0];
    } catch (error) {
      throw new Error(error.message);
    }
  },
  deleteUser: async (user_id, callBack) => {
    try {
      const deleteQuery = "DELETE FROM access_control WHERE user_id = $1";
      const deleteResult = await runSql(pool, deleteQuery, [user_id]);
      return callBack(deleteResult.rows[0]);
    } catch (error) {
      return callBack(error);
    }
  },
  getAllUser: async (page, limit, callBack) => {
    try {
      const offset = (page - 1) * limit;
      const countQuery = "SELECT COUNT(*) FROM access_control";
      const countResult = await runSql(pool, countQuery);

      const selectQuery = "SELECT * FROM access_control ORDER BY user_id DESC LIMIT $1 OFFSET $2";
      const selectResult = await runSql(pool, selectQuery, [limit, offset]);

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
  },
  updateUserStatus: async (data, userId) => {
    try {
      const checkUserQuery = `SELECT * FROM access_control WHERE user_id = $1`;
      const checkUserResult = await runSql(pool, checkUserQuery, [userId]);
      if (checkUserResult.rowCount === 0) {
        throw new Error('User does not exist');
      }

      const updateQuery = `UPDATE access_control SET status = $1 WHERE user_id = $2`;
      const body = [
        data.status,
        userId
      ];
      const updateResult = await runSql(pool, updateQuery, body);
      return updateResult.rows[0];
    } catch (error) {
      throw new Error(error.message);
    }
  },
  login: async (user_name, password, callBack) => {
    try {
      var loginQuery = 'SELECT * FROM access_control WHERE user_name = $1 AND  password = $2 ';
      let params = [
        user_name,
        password
      ]
      var loginResult = await runSql(pool, loginQuery, params)
      return callBack(null, loginResult);
    } catch (error) {
      return callBack(error, null);
    }
  },
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
  getAll: async (sDate, sEndDate, page, limit, region, district, commune, fokontany, callback) => {
    try {
      const offset = (page - 1) * limit;
      let query = `SELECT DISTINCT cr.*, cr.given_name AS first_name, rf.child_cr_id, rf.dec_date, rf.dec_relation, rf.transcription_date, rf.lattitude, rf. longitude, mother.id as mother_cr_id, father_cr_id, declarant_cr_id FROM civil_register cr JOIN registration_form rf ON cr.id = rf.child_cr_id JOIN civil_register mother ON mother.id = rf.mother_cr_id `;
      var countQuery = `SELECT COUNT(DISTINCT cr.id) AS total_records 
      FROM civil_register cr
      JOIN registration_form rf ON cr.id = rf.child_cr_id 
      JOIN civil_register mother ON mother.id = rf.mother_cr_id`;
      var whereClause = " where 1=1 ";
      if (!isNullOrEmpty(region)) {
        whereClause += ` AND cr.region_of_birth = '${region}'`;
      }
      if (!isNullOrEmpty(district)) {
        whereClause += ` AND cr.district_of_birth = '${district}'`;
      }
      if (!isNullOrEmpty(commune)) {
        whereClause += ` AND cr.commune_of_birth = '${commune}'`;
      }
      if (!isNullOrEmpty(fokontany)) {
        whereClause += ` AND cr.fokontany_of_birth = '${fokontany}'`;
      }
      if (!isNullOrEmpty(sDate))
        whereClause += ` AND DATE(rf.dec_date) >= '${sDate}'`;
      if (!isNullOrEmpty(sEndDate))
        whereClause += ` AND DATE(rf.dec_date) <= '${sEndDate}'`;
      query += whereClause;
      query += ` ORDER BY cr.id LIMIT ${limit} OFFSET ${offset}`;
      countQuery += whereClause;
      var results = await runSql(pool, query, []);
      const allResult = [];

      var resultCount = results.rows.length;
      if (resultCount == 0) {
        return callback(null, {
          results: [],
          total_records: 0
        });
      }
      for (let x = 0; x < resultCount; x++) {
        const motherQuery = `SELECT * FROM civil_register where id = ${results.rows[x].mother_cr_id}`;
        var motherResults = await runSql(pool, motherQuery, []);
        const fatherQuery = `SELECT * FROM civil_register where id = ${results.rows[x].father_cr_id}`;
        var fatherResults = await runSql(pool, fatherQuery, []);
        const DecQuery = `SELECT * FROM civil_register where id = ${results.rows[x].declarant_cr_id}`;
        var DecResults = await runSql(pool, DecQuery, []);
        var SQuery = `SELECT libelle_fokontany AS Fokontonay_Name, libelle_region AS Region_name, libelle_district AS District_name, libelle_commune AS Commune_name from fokontany where id = ${results.rows[x].id} `;
        var resultQuery = await runSql(pool, SQuery, []);
        //-- mother--//
        var motherSQuery = `SELECT libelle_fokontany AS Fokontonay_Name, libelle_region AS Region_name, libelle_district AS District_name, libelle_commune AS Commune_name from fokontany where code_region = '${motherResults.rows[0].region_of_birth}' AND code_district = '${motherResults.rows[0].district_of_birth}' AND code_commune = '${motherResults.rows[0].commune_of_birth}' AND code_fokontany = '${motherResults.rows[0].fokontany_of_birth}'`;
        var motherSresultQuery = await runSql(pool, motherSQuery, []);
        motherResults.rows[0].region_name = motherSresultQuery.rows[0].region_name;
        motherResults.rows[0].fokontonay_name = motherSresultQuery.rows[0].fokontonay_name;
        motherResults.rows[0].district_name = motherSresultQuery.rows[0].district_name;
        motherResults.rows[0].commune_name = motherSresultQuery.rows[0].commune_name;
        //--child--//
        results.rows[x].region_name = motherSresultQuery.rows[0].region_name;
        results.rows[x].fokontonay_name = motherSresultQuery.rows[0].fokontonay_name;
        results.rows[x].district_name = motherSresultQuery.rows[0].district_name;
        results.rows[x].commune_name = motherSresultQuery.rows[0].commune_name;
        //--father--//
        var fatherSQuery = `SELECT libelle_fokontany AS Fokontonay_Name, libelle_region AS Region_name, libelle_district AS District_name, libelle_commune AS Commune_name from fokontany where code_region = '${fatherResults.rows[0].region_of_birth}' AND code_district = '${fatherResults.rows[0].district_of_birth}' AND code_commune = '${fatherResults.rows[0].commune_of_birth}' AND code_fokontany = '${fatherResults.rows[0].fokontany_of_birth}'`;
        var fatherSresultQuery = await runSql(pool, fatherSQuery, []);
        fatherResults.rows[0].region_name = fatherSresultQuery.rows[0].region_name;
        fatherResults.rows[0].fokontonay_name = fatherSresultQuery.rows[0].fokontonay_name;
        fatherResults.rows[0].district_name = fatherSresultQuery.rows[0].district_name;
        fatherResults.rows[0].commune_name = fatherSresultQuery.rows[0].commune_name;

        const record = {
          cr: results.rows[x],
          mother: motherResults.rows[0],
          father: fatherResults.rows[0],
          declarant: DecResults.rows[0],
          foko: resultQuery.rows[0],
        };
        allResult.push(record);
        if (allResult.length === results.rows.length) {
          countQueryResult = await runSql(pool, countQuery, []);
          const data = {
            results: allResult,
            total_records: countQueryResult.rows[0].total_records,
          };
          return callback(null, data);
        }
      }
    } catch (error) {
      return callback(error, null);
    }
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


          var queryCivilRegisterInsert = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, time_of_birth, place_of_birth, gender, is_parents_married, is_residence_same, is_birth_in_hc, is_assisted_by_how, hc_name, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth) VALUES";
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


          var queryCivilRegisterInsertFather = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession, is_residence_same) VALUES";
          // ######## FOR FATHER ######## \\
          for (let i = 1; i < result.length; i++) {
            if (isNullOrEmpty(result[i][32])) { result[i][32] = null; } //info_pere-niu_pere
            if (isNullOrEmpty(result[i][34])) { result[i][34] = null; } //info_pere-prenom_pere
            if (isNullOrEmpty(result[i][33])) { result[i][33] = null; } //info_pere-nom_pere 
            if (isNullOrEmpty(result[i][35])) { result[i][35] = null; } result[i][35] = formatDate(result[i][35]); //info_pere-date_naissance_pere
            if (isNullOrEmpty(result[i][38])) { result[i][38] = null; } //info_pere-info_pere_2-region_pere
            if (isNullOrEmpty(result[i][39])) { result[i][39] = null; } //info_pere-info_pere_2-district_pere
            if (isNullOrEmpty(result[i][40])) { result[i][40] = null; } //info_pere-info_pere_2-commune_pere
            if (isNullOrEmpty(result[i][41])) { result[i][41] = null; } //info_pere-info_pere_2-fokontany_pere
            if (isNullOrEmpty(result[i][42])) { result[i][42] = null; } //info_pere-profession_pere
            if (isNullOrEmpty(result[i][36])) { result[i][36] = null; } //info_pere-mother_father_same_address


            queryCivilRegisterInsertFather += `(${result[i][32]},'${result[i][34]}','${result[i][33]}','${result[i][35]}','${result[i][38]}','${result[i][39]}','${result[i][40]}','${result[i][41]}','${result[i][42]}','${result[i][36]}'),`;
          }
          queryCivilRegisterInsertFather = removeCommaAtEnd(queryCivilRegisterInsertFather);
          queryCivilRegisterInsertFather += " RETURNING id, uin";
          resultCivilRegisterInsertFather = await runSql(pool, queryCivilRegisterInsertFather, []);
          // ######## FOR FATHER ######## \\

          // ######## FOR MOTHER ######## \\
          var queryCivilRegisterInsertMother = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES";
          for (let i = 1; i < result.length; i++) {
            if (isNullOrEmpty(result[i][20])) { result[i][20] = null; } // info_mere-niu_mere
            if (isNullOrEmpty(result[i][22])) { result[i][22] = null; } //info_mere-prenom_mere
            if (isNullOrEmpty(result[i][21])) { result[i][21] = null; } //info_mere-nom_mere
            if (isNullOrEmpty(result[i][23])) { result[i][23] = null; } result[i][23] = formatDate(result[i][23]); //info_mere-date_naissance_mere
            if (isNullOrEmpty(result[i][31])) { result[i][31] = null; } //info_mere-nationalite_mere
            if (isNullOrEmpty(result[i][25])) { result[i][25] = null; } //info_mere-region_mere
            if (isNullOrEmpty(result[i][26])) { result[i][26] = null; } //info_mere-district_mere
            if (isNullOrEmpty(result[i][27])) { result[i][27] = null; } //info_mere-commune_mere
            if (isNullOrEmpty(result[i][28])) { result[i][28] = null; } //info_mere-fokontany_mere
            if (isNullOrEmpty(result[i][29])) { result[i][29] = null; } //info_mere-profession_mere

            queryCivilRegisterInsertMother += `('${result[i][20]}', '${result[i][22]}', '${result[i][21]}', '${result[i][23]}', '${result[i][31]}', '${result[i][25]}', '${result[i][26]}', '${result[i][27]}',  '${result[i][28]}', '${result[i][29]}'),`;
          }
          queryCivilRegisterInsertMother = removeCommaAtEnd(queryCivilRegisterInsertMother);
          queryCivilRegisterInsertMother += " RETURNING id, uin";
          resultCivilRegisterInsertMother = await runSql(pool, queryCivilRegisterInsertMother, []);
          // ######## FOR MOTHER ######## \\


          // ######## FOR DECLARANT ######## \\
          var queryCivilRegisterInsertDeclarant = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, region_of_birth) VALUES";
          for (let i = 1; i < result.length; i++) {
            if (isNullOrEmpty(result[i][44])) { result[i][44] = null; } // info_declarant-info_declarant_2-niu_declarant
            if (isNullOrEmpty(result[i][46])) { result[i][46] = null; } // info_declarant-info_declarant_2-prenom_declarant
            if (isNullOrEmpty(result[i][45])) { result[i][45] = null; } // info_declarant-info_declarant_2-nom_declarant
            if (isNullOrEmpty(result[i][47])) { result[i][47] = null; } result[i][47] = formatDate(result[i][47]); //info_declarant-info_declarant_2-date_naissance_declarant
            if (isNullOrEmpty(result[i][48])) { result[i][48] = null; } // info_declarant-info_declarant_2-address_declarant

            queryCivilRegisterInsertDeclarant += `('${result[i][44]}', '${result[i][46]}', '${result[i][45]}', '${result[i][47]}', '${result[i][48]}'),`;
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
          var queryRegistrationFormInsert = "INSERT INTO registration_form (child_cr_id, father_cr_id, mother_cr_id, declarant_cr_id, dec_relation, dec_date, transcription_date, in_charge_sign, lattitude, longitude ) VALUES";
          for (let i = 0; i < childsInfo.length; i++) {
            const childInfo = childsInfo[i];
            let indexChildFileData = resultCopy.findIndex(element => element[6] == childInfo.uin);
            if (indexChildFileData > -1) {
              var indexFather = fathersInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][32]);
              var indexMother = mothersInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][20]);
              var indexDeclarant = delarantsInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][44]);
              var fatherId = fathersInfo[indexFather].id;
              var motherId = mothersInfo[indexMother].id;
              var lattitude = resultCopy[indexChildFileData][54];
              var longitude = resultCopy[indexChildFileData][55];
              var declarantId = delarantsInfo[indexDeclarant].id;


              //43 = info_declarant-lien_declarant
              //7 = gr_info-date_declaration
              //8 = gr_info-date_transcription

              //53 = lieu_signature
              queryRegistrationFormInsert += `(${childInfo.id},${fatherId},${motherId},${declarantId},'${resultCopy[indexChildFileData][43]}','${formatDate(resultCopy[indexChildFileData][7])}','${formatDate(resultCopy[indexChildFileData][8])}','${resultCopy[indexChildFileData][50]}','${lattitude}','${longitude}'),`
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
      // var monthDates = getMonthStartEnd(sDate);
      var monthDates = getLastDates(sDate, 30);
      var queryMonthDataQuery = `SELECT count(child_cr_id) FROM registration_form where dec_date >= '${monthDates.start}' and dec_date <= '${monthDates.end}'`;
      var resultMonthDataQuery = await runSql(pool, queryMonthDataQuery, []);
      response.month_count = resultMonthDataQuery.rows[0].count;
      //#region LastMonth

      //#region LastYear
      // var yearDates = getLastYear(sDate);
      var yearDates = getLastDates(sDate, 365);
      var queryYearData = `SELECT count(child_cr_id) FROM registration_form where dec_date >= '${yearDates.start}' and dec_date <= '${yearDates.end}'`;
      var resultYearData = await runSql(pool, queryYearData, []);
      response.year_count = resultYearData.rows[0].count;
      //#region LastYear

      //#region LastSevenDays
      // var lastSevenDates = getLastSevenDays(sDate);
      var lastSevenDates = getLastDates(sDate, 7);
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
      filterConditions.push(`region_of_birth = $${filterValues.length + 1}`);
      filterValues.push(region);
    }
    if (!isNullOrEmpty(district)) {
      filterConditions.push(`district_of_birth = $${filterValues.length + 1}`);
      filterValues.push(district);
    }
    if (!isNullOrEmpty(commune)) {
      filterConditions.push(`commune_of_birth = $${filterValues.length + 1}`);
      filterValues.push(commune);
    }
    if (!isNullOrEmpty(fokontany)) {
      filterConditions.push(`fokontany_of_birth = $${filterValues.length + 1}`);
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
      // var lastSevenDates = getLastSevenDays(sDate);
      var queryLastSevenData = `SELECT rf.*, cr.gender FROM registration_form rf INNER JOIN civil_register cr ON rf.mother_cr_id = cr.id
      WHERE DATE(rf.dec_date) >= '${sDate}' AND DATE(rf.dec_date) <= '${sEndDate}'`;
      if (!isNullOrEmpty(region)) {
        queryLastSevenData += ` AND cr.region_of_birth = '${region}'`;
      }
      if (!isNullOrEmpty(district)) {
        queryLastSevenData += ` AND cr.district_of_birth = '${district}'`;
      }
      if (!isNullOrEmpty(commune)) {
        queryLastSevenData += ` AND cr.commune_of_birth = '${commune}'`;
      }
      if (!isNullOrEmpty(fokontany)) {
        queryLastSevenData += ` AND cr.fokontany_of_birth = '${fokontany}'`;
      }

      var resultLastSevenData = await runSql(pool, queryLastSevenData, []);
      var data = resultLastSevenData.rows.map((d) => {
        return { ...d, dec_date: stringToDate(d.dec_date) };
      });
      data = data.sort(function (a, b) { return moment(a.dec_date) - moment(b.dec_date) });
      // var minuteDifference = parseInt((getMinuteDiff(sDate, sEndDate)) / candle);

      var endDate = stringToDate(sEndDate);
      var conditionStartDate = stringToDate(sDate);
      // var conditionEndDate = addMinutesToDate(stringToDate(sDate), minuteDifference);
      var conditionEndDate = moment(stringToDate(sDate)).add({ days: 1 }).format("YYYY-MM-DD");
      if (candle == 7)
        conditionEndDate = moment(stringToDate(sDate)).add({ days: 1 }).format("YYYY-MM-DD");
      else if (candle == 12)
        conditionEndDate = moment(stringToDate(sDate)).add({ months: 1 }).format("YYYY-MM-DD");
      var response = [];
      var counter = 1;
      while (conditionEndDate <= endDate) {
        // var candleData = data.filter(item => item.dec_date >= conditionStartDate && item.dec_date < conditionEndDate);
        var candleData = data.filter(item => {
          if (item.dec_date >= conditionStartDate && item.dec_date < conditionEndDate)
            return item
        });
        const centerDate = convertDateToStringMoment(getCenterDateMoment(conditionStartDate, conditionEndDate));
        response.push({
          count: candleData.length,
          date: moment(centerDate).format("ddd, MM/DD/YYYY"),
          quarterly: `Q${counter}`,
          time: moment(centerDate).format("HH:mm a"),
          day: moment(centerDate).format("ddd"),
          month: moment(centerDate).format("MMM"),
        });
        conditionStartDate = conditionEndDate;
        // conditionEndDate = addMinutesToDate(conditionEndDate, minuteDifference);
        if (candle == 7)
          conditionEndDate = moment(conditionStartDate).add({ days: 1 }).format("YYYY-MM-DD");
        else if (candle == 12)
          conditionEndDate = moment(conditionStartDate).add({ months: 1 }).format("YYYY-MM-DD");

        counter = counter + 1;
      }
      return callBack(null, {
        total_count: response.reduce((acc, obj) => acc + obj.count, 0),
        data_list: response
      });
    } catch (error) {
      return callBack(!isNullOrEmpty(error.message) ? error.message : error, null);
    }
  },
  GetLatLong: async (sDate, sEndDate, region, district, commune, fokontany, callBack) => {
    try {
      var mapQuery = `SELECT r.lattitude, r.longitude, r.id, c.given_name FROM registration_form r JOIN civil_register c ON r.child_cr_id = c.id WHERE 1=1 `;
      if (!isNullOrEmpty(region)) {
        mapQuery += ` AND c.region_of_birth = '${region}'`;
      }
      if (!isNullOrEmpty(district)) {
        mapQuery += ` AND c.district_of_birth = '${district}'`;
      }
      if (!isNullOrEmpty(commune)) {
        mapQuery += ` AND c.commune_of_birth = '${commune}'`;
      }
      if (!isNullOrEmpty(fokontany)) {
        mapQuery += ` AND c.fokontany_of_birth = '${fokontany}'`;
      }
      if (!isNullOrEmpty(sDate)) {
        mapQuery += ` AND DATE(r.dec_date) >= '${sDate}'`;
      } if (!isNullOrEmpty(sEndDate)) {
        mapQuery += ` AND DATE(r.dec_date) <= '${sEndDate}'`;
      }
      var mapQueryResult = await runSql(pool, mapQuery, [])
      return callBack(null, mapQueryResult.rows);
    } catch (error) {
      return callBack(error, null);
    }
  },
  getSevenDayGraphQuery: (callBack) => {
    var lastSevenDates = getLastDates("2023-05-04", 7);
    var queryLastSevenData = `SELECT count(child_cr_id) FROM registration_form where dec_date >= '${lastSevenDates.start}' and dec_date <= '${lastSevenDates.end}'`;
    return callBack(null, queryLastSevenData);
  },
};