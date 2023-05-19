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
const axios = require('axios');

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
  getAll: async (sDate, sEndDate, page, limit, region, moduleType, district, commune, fokontany, niuStatus, error_id, callback) => {
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

      if (!isNullOrEmpty(moduleType)) {
        whereClause += ` AND upload_excel_log.input_type = '${moduleType}'`;
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

      if (!isNullOrEmpty(niuStatus)) {
        if (niuStatus == 0)
          whereClause += ` AND cr.error_id = 0`;
        else
          whereClause += ` AND cr.error_id > 0`;
      }
      if (!isNullOrEmpty(error_id)) {
        whereClause += ` AND cr.error_id = '${error_id}'`;
      }
      query += whereClause;
      query += ` ORDER BY cr.id DESC LIMIT ${limit} OFFSET ${offset} `;
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
        // if (motherResults.rows[0].error_id > 0)
        //   continue;
        const fatherQuery = `SELECT * FROM civil_register where id = ${results.rows[x].father_cr_id}`;
        var fatherResults = await runSql(pool, fatherQuery, []);
        // if (fatherResults.rows[0].error_id > 0)
        //   continue;
        const DecQuery = `SELECT * FROM civil_register where id = ${results.rows[x].declarant_cr_id}`;
        var DecResults = await runSql(pool, DecQuery, []);
        // if (DecResults.rows[0].error_id > 0)
        //   continue;
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
        var documentQuery = `SELECT * from attached_document where cr_id = ${results.rows[x].id} `;
        var resultDocument = await runSql(pool, documentQuery, []);
        if (resultDocument.rows.length > 1) {
          results.rows[x].pic_certificate = resultDocument.rows[0].document_path;
          results.rows[x].picture_register = resultDocument.rows[1].document_path;
        }
        else {
          results.rows[x].pic_certificate = null;
          results.rows[x].picture_register = null;
        }
        //--father--//

        if (fatherResults.rows[0].region_of_birth && fatherResults.rows[0].district_of_birth && fatherResults.rows[0].commune_of_birth && fatherResults.rows[0].fokontany_of_birth) {
          var fatherSQuery = `SELECT libelle_fokontany AS Fokontonay_Name, libelle_region AS Region_name, libelle_district AS District_name, libelle_commune AS Commune_name from fokontany where code_region = '${fatherResults.rows[0].region_of_birth}' AND code_district = '${fatherResults.rows[0].district_of_birth}' AND code_commune = '${fatherResults.rows[0].commune_of_birth}' AND code_fokontany = '${fatherResults.rows[0].fokontany_of_birth}'`;
          var fatherSresultQuery = await runSql(pool, fatherSQuery, []);
          fatherResults.rows[0].region_name = fatherSresultQuery.rows[0].region_name;
          fatherResults.rows[0].fokontonay_name = fatherSresultQuery.rows[0].fokontonay_name;
          fatherResults.rows[0].district_name = fatherSresultQuery.rows[0].district_name;
          fatherResults.rows[0].commune_name = fatherSresultQuery.rows[0].commune_name;
        }
        const record = {
          cr: results.rows[x],
          mother: motherResults.rows[0],
          father: fatherResults.rows[0],
          declarant: DecResults.rows[0],
          foko: resultQuery.rows[0],
        };
        allResult.push(record);

      }
      if (allResult.length === results.rows.length) {
        countQueryResult = await runSql(pool, countQuery, []);
        const data = {
          results: allResult,
          total_records: countQueryResult.rows[0].total_records,
        };
        return callback(null, data);
      }
    } catch (error) {
      return callback(error.message, null);
    }
  },
  update: async (data, cr_id, callBack) => {
    try {
      console.log("crResult :", cr_id);
      let crQuery = `SELECT * FROM civil_register WHERE id = ${cr_id}`;
      let crresult = await runSql(pool, crQuery, []);
      if (crresult.rows.length === 0) {
        throw new Error('User does not exist');
      }

      // Check if the commune is valid for the given UIN
      let error_id = 0;

      var uinQuery = "SELECT * FROM uin where code_commune = " + crresult.rows[0].commune_of_birth;
      var uinResult = await runSql(pool, uinQuery, []);
      if (uinResult.rows.length > 0) {
        for (let j = 0; j < uinResult.rows.length; j++) {
          if (BigInt(uinResult.rows[j].start_index) <= BigInt(data.uin) && BigInt(uinResult.rows[j].end_index) >= BigInt(data.uin)) {
            var duplicateCheckQuery = "SELECT * FROM civil_register where uin = '" + data.uin + "'";
            var duplicateCheckResult = await runSql(pool, duplicateCheckQuery, []);
            if (duplicateCheckResult.rows.length > 0)
              error_id = 1;// Duplicate NIU Number
            else
              error_id = 0;// VALID

          }
          else
            error_id = 2; //Wrong NIU Number
        }
      } else {
        error_id = 3; //Wrong NIU Location Allocation
      }
      if (error_id == 0) {
        let updateIdQuery = `UPDATE civil_register SET error_id = 0 WHERE id = ${cr_id}`;
        let updateIdResult = await runSql(pool, updateIdQuery, []);
        return {
          result: duplicateCheckResult.rows[0],
          error_id: error_id
        };
      }
      else {

        return {
          error_id: error_id
        };
      }
    } catch (error) {
      throw new Error(error.message);
    }
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
          let resultCivilRegisterInsertFather = [];
          let resultCivilRegisterInsertMother = [];
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

          // let x = [];
          // for (let i = 1; i < result.length; i++) {
          //   // x.push(result[i][20]);
          //   var uinQuery = "SELECT * FROM uin where code_commune = " + result[i][27]; //+ " OR (start_index <= " + result[i][20] + " AND end_index >= " + result[i][20] + ")";
          //   var uinResult = await runSql(pool, uinQuery, []);
          //   // resolve(uinResult);

          //   // x.push(uinResult.rows);
          //   if (uinResult.rows.length > 0) {
          //     for (let j = 0; j < uinResult.rows.length; j++) {
          //       if (BigInt(uinResult.rows[j].start_index) <= BigInt(result[i][20]) && BigInt(uinResult.rows[j].end_index) >= BigInt(result[i][20])) {
          //         var duplicateCheckQuery = "SELECT * FROM civil_register where uin = '" + result[i][20] + "'";
          //         var duplicateCheckResult = await runSql(pool, duplicateCheckQuery, []);
          //         if (duplicateCheckResult.rows.length > 0)
          //           x.push(result[i][20] + " => " + uinResult.rows[j].code_commune + " => Duplicate NIU Number")
          //         else
          //           x.push(result[i][20] + " => " + uinResult.rows[j].code_commune + " => VALID")

          //       }
          //       else //if (uinResult.rows[j].start_index <= result[i][20] && uinResult.rows[j].end_index >= result[i][20])
          //         x.push(result[i][20] + " => " + uinResult.rows[j].code_commune + " => Wrong NIU Number")
          //       // else
          //       //   x.push(result[i][20] + " => " + uinResult.rows[j].code_commune + " => Wrong NIU Number/Duplicate NIU Number")
          //     }
          //   } else {
          //     x.push(result[i][20] + " => " + uinResult.rows[j].code_commune + " => Wrong NIU Location Allocation")
          //   }
          // }
          // resolve(x);

          var queryCivilRegisterInsert = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, time_of_birth, place_of_birth, gender, is_parents_married, is_residence_same, is_birth_in_hc, is_assisted_by_how, hc_name, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, error_id, error_date) VALUES";
          for (let i = 1; i < result.length; i++) {
            if (isNullOrEmpty(result[i][69])) { result[i][69] = null; } //info_enfant-niu
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

            let error_id = 0;
            if (result[i][32].length == 10) {
              // var uinQuery = "SELECT * FROM uin where code_commune = " + result[i][40];
              var uinQuery = "SELECT * FROM uin where uin = " + result[i][69];
              var uinResult = await runSql(pool, uinQuery, []);
              if (uinResult.rows.length > 0) {
                if (uinResult.rows[0].code_commune == result[i][27]) {
                  if (uinResult.rows[0].niu_status == 0) {
                    const currentDate = new Date();
                    const formattedTime = currentDate.toLocaleString('en-US', { hour12: false });
                    var updateQuery = `UPDATE uin SET allocation_date='${moment().format("YYYY-MM-DD")}', allocation_time='${moment().format("YYYY-MM-DD HH:mm:ss")}', niu_status=${1} WHERE uin = ${uinResult.rows[0].uin}`;
                    var updateResult = await runSql(pool, updateQuery, []);
                    error_id = 0;
                  }
                  else {
                    error_id = 1;// Duplicate NIU Number
                    // duplicateFatherResult.push(duplicateCheckResult)
                  }
                }
                else {
                  error_id = 3; //Wrong NIU Location Allocation
                }
                // for (let j = 0; j < uinResult.rows.length; j++) {
                //   if (BigInt(uinResult.rows[j].start_index) <= BigInt(result[i][32]) && BigInt(uinResult.rows[j].end_index) >= BigInt(result[i][32])) {
                //     var duplicateCheckQuery = "SELECT * FROM civil_register where uin = '" + result[i][32] + "'";
                //     var duplicateCheckResult = await runSql(pool, duplicateCheckQuery, []);
                //     if (duplicateCheckResult.rows.length > 0) {
                //       error_id = 1;// Duplicate NIU Number
                //       duplicateFatherResult.push(duplicateCheckResult)
                //     }
                //     else
                //       error_id = 0;// VALID

                //   }
                //   else
                //   error_id = 3; //Wrong NIU Location Allocation
                // }
              } else {
                error_id = 2; //Wrong NIU Number
              }
            }
            else
              error_id = 4; //Lenght not equal 10.


            let error_date = formatDate(new Date());

            queryCivilRegisterInsert += `('${result[i][69]}', '${result[i][10]}', '${result[i][9]}', '${result[i][11]}', '${result[i][12]}', '${result[i][16]}', '${result[i][13]}', '${result[i][14]}', '${result[i][15]}', '${result[i][17]}', '${result[i][21]}', '${result[i][17]}', '${result[i][18]}', '${result[i][25]}', '${result[i][26]}', '${result[i][27]}', '${result[i][28]}','${error_id}','${error_date}'),`;
          }
          queryCivilRegisterInsert = removeCommaAtEnd(queryCivilRegisterInsert);
          queryCivilRegisterInsert += " RETURNING id, uin";
          resultCivilRegisterInsert = await runSql(pool, queryCivilRegisterInsert, []);


          var queryCivilRegisterInsertFather = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession, is_residence_same, error_id, error_date) VALUES";
          // ######## FOR FATHER ######## \\
          let duplicateFatherResult = [];
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


            let error_id = 0;
            if (result[i][32].length == 10) {
              var uinQuery = "SELECT * FROM uin where uin = " + result[i][32];
              var uinResult = await runSql(pool, uinQuery, []);
              if (uinResult.rows.length > 0) {
                if (uinResult.rows[0].code_commune == result[i][40]) {
                  if (uinResult.rows[0].niu_status == 0)
                    error_id = 0;
                  else {
                    error_id = 1;// Duplicate NIU Number
                    var duplicateCheckQuery = "SELECT * FROM civil_register where uin = " + uinResult.rows[0].uin;
                    var duplicateCheckResult = await runSql(pool, duplicateCheckQuery, []);
                    duplicateFatherResult.push(duplicateCheckResult)
                  }
                }
                else {
                  error_id = 3; //Wrong NIU Location Allocation
                }
              } else {
                error_id = 2; //Wrong NIU Number
              }
            }
            else
              error_id = 4; //Lenght not equal 10.

            let error_date = formatDate(new Date());
            if (error_id != 1)
              queryCivilRegisterInsertFather += `(${result[i][32]},'${result[i][34]}','${result[i][33]}','${result[i][35]}','${result[i][38]}','${result[i][39]}','${result[i][40]}','${result[i][41]}','${result[i][42]}','${result[i][36]}','${error_id}','${error_date}'),`;
          }
          queryCivilRegisterInsertFather = removeCommaAtEnd(queryCivilRegisterInsertFather);
          queryCivilRegisterInsertFather += " RETURNING id, uin";
          resultCivilRegisterInsertFather = await runSql(pool, queryCivilRegisterInsertFather, []);
          resultCivilRegisterInsertFather = resultCivilRegisterInsertFather.rows.concat(duplicateFatherResult);
          // ######## FOR FATHER ######## \\

          // ######## FOR MOTHER ######## \\
          let duplicateMotherResult = [];

          var queryCivilRegisterInsertMother = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession, error_id, error_date) VALUES";
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

            // let error_id = 0;
            // var uinQuery = "SELECT * FROM uin where code_commune = " + result[i][20];
            // var uinResult = await runSql(pool, uinQuery, []);
            // if (uinResult.rows.length > 0) {
            //   for (let j = 0; j < uinResult.rows.length; j++) {
            //     if (BigInt(uinResult.rows[j].start_index) <= BigInt(result[i][27]) && BigInt(uinResult.rows[j].end_index) >= BigInt(result[i][27])) {
            //       var duplicateCheckQuery = "SELECT * FROM civil_register where uin = '" + result[i][27] + "'";
            //       var duplicateCheckResult = await runSql(pool, duplicateCheckQuery, []);
            //       if (duplicateCheckResult.rows.length > 0) {
            //         error_id = 1;// Duplicate NIU Number
            //         duplicateFatherResult.push(duplicateCheckResult)
            //       }
            //       else
            //         error_id = 0;// VALID

            //     }
            //     else
            //       error_id = 2; //Wrong NIU Number
            //   }
            // } else {
            //   error_id = 3; //Wrong NIU Location Allocation
            // }

            let error_id = 0;
            if (result[i][32].length == 10) {
              var uinQuery = "SELECT * FROM uin where uin = " + result[i][27];
              var uinResult = await runSql(pool, uinQuery, []);
              if (uinResult.rows.length > 0) {
                if (uinResult.rows[0].code_commune == result[i][20]) {
                  if (uinResult.rows[0].niu_status == 0)
                    error_id = 0;
                  else {
                    error_id = 1;// Duplicate NIU Number
                    var duplicateCheckQuery = "SELECT * FROM civil_register where uin = " + uinResult.rows[0].uin;
                    var duplicateCheckResult = await runSql(pool, duplicateCheckQuery, []);
                    duplicateMotherResult.push(duplicateCheckResult)
                    // duplicateFatherResult.push(duplicateCheckResult)
                  }
                }
                else {
                  error_id = 3; //Wrong NIU Location Allocation
                }
              } else {
                error_id = 2; //Wrong NIU Number
              }
            }
            else
              error_id = 4; //Lenght not equal 10.

            let error_date = formatDate(new Date());
            if (error_id != 1)

              queryCivilRegisterInsertMother += `('${result[i][20]}', '${result[i][22]}', '${result[i][21]}', '${result[i][23]}', '${result[i][31]}', '${result[i][25]}', '${result[i][26]}', '${result[i][27]}',  '${result[i][28]}', '${result[i][29]}','${error_id}','${error_date}'),`;
          }
          queryCivilRegisterInsertMother = removeCommaAtEnd(queryCivilRegisterInsertMother);
          queryCivilRegisterInsertMother += " RETURNING id, uin";
          resultCivilRegisterInsertMother = await runSql(pool, queryCivilRegisterInsertMother, []);
          resultCivilRegisterInsertMother = resultCivilRegisterInsertMother.rows.concat(duplicateMotherResult);

          // ######## FOR MOTHER ######## \\


          // ######## FOR DECLARANT ######## \\
          var queryCivilRegisterInsertDeclarant = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, region_of_birth, commune_of_birth) VALUES";
          for (let i = 1; i < result.length; i++) {
            if (isNullOrEmpty(result[i][44])) { result[i][44] = null; } // info_declarant-info_declarant_2-niu_declarant
            if (isNullOrEmpty(result[i][46])) { result[i][46] = null; } // info_declarant-info_declarant_2-prenom_declarant
            if (isNullOrEmpty(result[i][45])) { result[i][45] = null; } // info_declarant-info_declarant_2-nom_declarant
            if (isNullOrEmpty(result[i][47])) { result[i][47] = null; } result[i][47] = formatDate(result[i][47]); //info_declarant-info_declarant_2-date_naissance_declarant
            if (isNullOrEmpty(result[i][48])) { result[i][48] = null; } // info_declarant-info_declarant_2-address_declarant
            // if (isNullOrEmpty(result[i][70])) { result[i][70] = null; } // info_declarant-commume

            // let error_id = 0;
            // var uinQuery = "SELECT * FROM uin where code_commune = " + result[i][70];
            // var uinResult = await runSql(pool, uinQuery, []);
            // if (uinResult.rows.length > 0) {
            //   for (let j = 0; j < uinResult.rows.length; j++) {
            //     if (BigInt(uinResult.rows[j].start_index) <= BigInt(result[i][44]) && BigInt(uinResult.rows[j].end_index) >= BigInt(result[i][44])) {
            //       var duplicateCheckQuery = "SELECT * FROM civil_register where uin = '" + result[i][44] + "'";
            //       var duplicateCheckResult = await runSql(pool, duplicateCheckQuery, []);
            //       if (duplicateCheckResult.rows.length > 0) {
            //         error_id = 1;// Duplicate NIU Number
            //         duplicateFatherResult.push(duplicateCheckResult)
            //       }
            //       else
            //         error_id = 0;// VALID

            //     }
            //     else
            //       error_id = 2; //Wrong NIU Number
            //   }
            // } else {
            //   error_id = 3; //Wrong NIU Location Allocation
            // }

            // let error_date = formatDate(new Date());
            // if (error_id != 1)

            queryCivilRegisterInsertDeclarant += `('${result[i][44]}', '${result[i][46]}', '${result[i][45]}', '${result[i][47]}', '${result[i][48]}','${result[i][70]}'),`;
          }
          queryCivilRegisterInsertDeclarant = removeCommaAtEnd(queryCivilRegisterInsertDeclarant);
          queryCivilRegisterInsertDeclarant += " RETURNING id, uin";
          resultCivilRegisterInsertDeclarant = await runSql(pool, queryCivilRegisterInsertDeclarant, []);
          // ######## FOR DECLARANT ######## \\

          var childsInfo = resultCivilRegisterInsert.rows;
          var fathersInfo = resultCivilRegisterInsertFather;
          var mothersInfo = resultCivilRegisterInsertMother;
          var delarantsInfo = resultCivilRegisterInsertDeclarant.rows;

          var resultCopy = result.splice(1, result.length - 1);
          var queryRegistrationFormInsert = "INSERT INTO registration_form (child_cr_id, father_cr_id, mother_cr_id, declarant_cr_id, dec_relation, dec_date, transcription_date, in_charge_sign, lattitude, longitude ) VALUES";
          for (let i = 0; i < childsInfo.length; i++) {
            const childInfo = childsInfo[i];
            let indexChildFileData = resultCopy.findIndex(element => element[69] == childInfo.uin);
            if (indexChildFileData > -1) {
              var indexFather = fathersInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][32]);
              var indexMother = mothersInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][20]);
              var indexDeclarant = delarantsInfo.findIndex(element => element.uin == resultCopy[indexChildFileData][44]);
              if (indexFather > -1)
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
          // queryRegistrationFormInsert += " RETURNING id";
          var resultRegistrationFormInsertDeclarant = await runSql(pool, queryRegistrationFormInsert, []);
          const currentDate = new Date();
          const formattedTime = currentDate.toLocaleString('en-US', { hour12: false });
          let filename = filePath.split("/");
          var insertQuery = 'INSERT INTO excel_upload_log (date_created, number_record, input_type, file, time_created, module_type) VALUES ($1, $2, $3, $4, $5, $6)';
          var insertResult = await runSql(pool, insertQuery, [
            moment().format("YYYY-MM-DD"),
            childsInfo.length,
            "FILE",
            "/" + Paths.Paths.FILE + "/" + filename[filename.length - 1],
            moment().format("YYYY-MM-DD HH:mm:ss"),
            "FILE"
          ]);
          resolve("Data entered");
        } catch (error) {
          reject(error.message);
        }
      });
    } catch (error) {
      return callBack(isNullOrEmpty(error.message) ? error : error.message, null);
    }
  },
  fetchSaveToDatabase: (callBack) => {
    try {
      return new Promise(async (resolve, reject) => {
        try {
          const baseUrl = 'https://odk.siecm.gov.mg//v1';
          const loginUrl = `${baseUrl}/sessions`;
          const username = 'odkmgbirthstats@saadaan.com';
          const password = 'tues444day';
          let forms;

          forms = new Promise((resolve, reject) => {
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
                  .then(async response => {
                    forms = response.data.value;
                    resolve(forms)
                    let resultCivilRegisterInsert;
                    let resultCivilRegisterInsertFather;
                    let resultCivilRegisterInsertMother;
                    let resultCivilRegisterInsertDeclarant;

                    var queryCivilRegisterInsert = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, time_of_birth, place_of_birth, gender, is_parents_married, is_residence_same, is_birth_in_hc, is_assisted_by_how, hc_name, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth) VALUES";
                    for (let i = 0; i < forms.length; i++) {
                      // if (isNullOrEmpty(result[i][6])) { result[i][6] = null; }
                      // if (isNullOrEmpty(result[i][10])) { result[i][10] = null; } //info_enfant-prenom_enfant
                      // if (isNullOrEmpty(result[i][9])) { result[i][9] = null; } //info_enfant-nom_enfant
                      // if (isNullOrEmpty(result[i][11])) { result[i][11] = null; } result[i][11] = formatDate(result[i][11]);//info_enfant-date_naissance
                      // if (isNullOrEmpty(result[i][12])) { result[i][12] = null; } //info_enfant-heure_naissance
                      // if (isNullOrEmpty(result[i][16])) { result[i][16] = null; } //info_enfant-b_location
                      // if (isNullOrEmpty(result[i][13])) { result[i][13] = null; } //info_enfant-sexe_enfant
                      // if (isNullOrEmpty(result[i][14])) { result[i][14] = null; } //info_enfant-parent_marie
                      // if (isNullOrEmpty(result[i][15])) { result[i][15] = null; } //info_enfant-meme_residence
                      // if (result[i][17] === null || result[i][17].length === 0) {
                      //   result[i][17] = 0;
                      // } else {
                      //   result[i][17] = 1;
                      // } //info_enfant-name_health_center queery to ber change to save yes or no
                      // if (isNullOrEmpty(result[i][21])) { result[i][21] = null; } //info_enfant_name_toooooooooooo beeeeeeeeeeeeeee filledddddddddddddddddddddddddd
                      // if (isNullOrEmpty(result[i][17])) { result[i][17] = null; } //info_enfant-name_health_center
                      // if (isNullOrEmpty(result[i][18])) { result[i][18] = null; } //info_enfant-name_domicile
                      // if (isNullOrEmpty(result[i][25])) { result[i][25] = null; } //info_enfant-region_naissance mothers
                      // if (isNullOrEmpty(result[i][26])) { result[i][26] = null; } //info_enfant-district_naissance mothers
                      // if (isNullOrEmpty(result[i][27])) { result[i][27] = null; } //info_enfant-commune_naissance mothers
                      // if (isNullOrEmpty(result[i][28])) { result[i][28] = null; } //info_enfant-fokontany mothers


                      let error_id = 0;
                      if (result[i][32].length == 10) {
                        var uinQuery = "SELECT * FROM uin where uin = " + result[i][69];
                        var uinResult = await runSql(pool, uinQuery, []);
                        if (uinResult.rows.length > 0) {
                          if (uinResult.rows[0].code_commune == result[i][27]) {
                            if (uinResult.rows[0].niu_status == 0) {
                              const currentDate = new Date();
                              const formattedTime = currentDate.toLocaleString('en-US', { hour12: false });
                              var updateQuery = `UPDATE uin SET allocation_date='${moment().format("YYYY-MM-DD")}', allocation_time='${moment().format("YYYY-MM-DD HH:mm:ss")}', niu_status=${1} WHERE uin = ${uinResult.rows[0].uin}`;
                              var updateResult = await runSql(pool, updateQuery, []);
                              error_id = 0;
                            }
                            else {
                              error_id = 1;// Duplicate NIU Number
                            }
                          }
                          else {
                            error_id = 3; //Wrong NIU Location Allocation
                          }
                        } else {
                          error_id = 2; //Wrong NIU Number
                        }
                      }
                      else
                        error_id = 4; //Lenght not equal 10.


                      let error_date = formatDate(new Date());

                      queryCivilRegisterInsert += `('${forms[i].gr_info.numero_declaration}', '${forms[i].info_enfant.prenom_enfant}', '${forms[i].info_enfant.nom_enfant}', '${formatDate(forms[i].info_enfant.date_naissance)}', '${forms[i].info_enfant.heure_naissance}', '${forms[i].info_enfant.b_location}', '${forms[i].info_enfant.sexe_enfant}', '${forms[i].info_enfant.parent_marie}', '${forms[i].info_enfant.meme_residence}', '${forms[i].info_enfant.name_health_center == null || forms[i].info_enfant.name_health_center == 0 ? 0 : 1}', '${forms[i].info_mere.prenom_mere}', '${forms[i].info_enfant.name_health_center}', '${forms[i].info_enfant.name_domicile}', '${forms[i].info_mere.region_mere}', '${forms[i].info_mere.district_mere}', '${forms[i].info_mere.commune_mere}', '${forms[i].info_mere.fokontany_mere}'),`;
                    }
                    queryCivilRegisterInsert = removeCommaAtEnd(queryCivilRegisterInsert);
                    queryCivilRegisterInsert += " RETURNING id, uin";
                    resultCivilRegisterInsert = await runSql(pool, queryCivilRegisterInsert, []);


                    var queryCivilRegisterInsertFather = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession, is_residence_same) VALUES";
                    // // ######## FOR FATHER ######## \\
                    for (let i = 0; i < forms.length; i++) {
                      //   if (isNullOrEmpty(result[i][32])) { result[i][32] = null; } //info_pere-niu_pere
                      //   if (isNullOrEmpty(result[i][34])) { result[i][34] = null; } //info_pere-prenom_pere
                      //   if (isNullOrEmpty(result[i][33])) { result[i][33] = null; } //info_pere-nom_pere 
                      //   if (isNullOrEmpty(result[i][35])) { result[i][35] = null; } result[i][35] = formatDate(result[i][35]); //info_pere-date_naissance_pere
                      //   if (isNullOrEmpty(result[i][38])) { result[i][38] = null; } //info_pere-info_pere_2-region_pere
                      //   if (isNullOrEmpty(result[i][39])) { result[i][39] = null; } //info_pere-info_pere_2-district_pere
                      //   if (isNullOrEmpty(result[i][40])) { result[i][40] = null; } //info_pere-info_pere_2-commune_pere
                      //   if (isNullOrEmpty(result[i][41])) { result[i][41] = null; } //info_pere-info_pere_2-fokontany_pere
                      //   if (isNullOrEmpty(result[i][42])) { result[i][42] = null; } //info_pere-profession_pere
                      //   if (isNullOrEmpty(result[i][36])) { result[i][36] = null; } //info_pere-mother_father_same_address

                      if (forms[i].info_pere.niu_pere && forms[i].info_pere.prenom_pere && forms[i].info_pere.nom_pere && forms[i].info_pere.date_naissance_pere && forms[i].info_pere.info_pere_2.region_pere && forms[i].info_pere.info_pere_2.district_pere && forms[i].info_pere.info_pere_2.commune_pere && forms[i].info_pere.info_pere_2.fokontany_pere && forms[i].info_pere.profession_pere && forms[i].info_pere.mother_father_same_address)
                        queryCivilRegisterInsertFather += `(${forms[i].info_pere.niu_pere},'${forms[i].info_pere.prenom_pere}','${forms[i].info_pere.nom_pere}','${formatDate(forms[i].info_pere.date_naissance_pere)}','${forms[i].info_pere.info_pere_2.region_pere}','${forms[i].info_pere.info_pere_2.district_pere}','${forms[i].info_pere.info_pere_2.commune_pere}','${forms[i].info_pere.info_pere_2.fokontany_pere}','${forms[i].info_pere.profession_pere}','${forms[i].info_pere.mother_father_same_address}'),`;
                    }
                    queryCivilRegisterInsertFather = removeCommaAtEnd(queryCivilRegisterInsertFather);
                    queryCivilRegisterInsertFather += " RETURNING id, uin";
                    resultCivilRegisterInsertFather = await runSql(pool, queryCivilRegisterInsertFather, []);
                    // // ######## FOR FATHER ######## \\

                    // // ######## FOR MOTHER ######## \\
                    var queryCivilRegisterInsertMother = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, nationality_name, region_of_birth, district_of_birth, commune_of_birth, fokontany_of_birth, cr_profession) VALUES";
                    for (let i = 0; i < forms.length; i++) {
                      //   if (isNullOrEmpty(result[i][20])) { result[i][20] = null; } // info_mere-niu_mere
                      //   if (isNullOrEmpty(result[i][22])) { result[i][22] = null; } //info_mere-prenom_mere
                      //   if (isNullOrEmpty(result[i][21])) { result[i][21] = null; } //info_mere-nom_mere
                      //   if (isNullOrEmpty(result[i][23])) { result[i][23] = null; } result[i][23] = formatDate(result[i][23]); //info_mere-date_naissance_mere
                      //   if (isNullOrEmpty(result[i][31])) { result[i][31] = null; } //info_mere-nationalite_mere
                      //   if (isNullOrEmpty(result[i][25])) { result[i][25] = null; } //info_mere-region_mere
                      //   if (isNullOrEmpty(result[i][26])) { result[i][26] = null; } //info_mere-district_mere
                      //   if (isNullOrEmpty(result[i][27])) { result[i][27] = null; } //info_mere-commune_mere
                      //   if (isNullOrEmpty(result[i][28])) { result[i][28] = null; } //info_mere-fokontany_mere
                      //   if (isNullOrEmpty(result[i][29])) { result[i][29] = null; } //info_mere-profession_mere
                      if (forms[i].info_mere.niu_mere)
                        queryCivilRegisterInsertMother += `('${forms[i].info_mere.niu_mere}', '${forms[i].info_mere.prenom_mere}', '${forms[i].info_mere.nom_mere}', '${formatDate(forms[i].info_mere.date_naissance_mere)}', '${forms[i].info_mere.nationalite_mere}', '${forms[i].info_mere.region_mere}', '${forms[i].info_mere.district_mere}', '${forms[i].info_mere.commune_mere}',  '${forms[i].info_mere.fokontany_mere}', '${forms[i].info_mere.profession_mere}'),`;
                    }
                    queryCivilRegisterInsertMother = removeCommaAtEnd(queryCivilRegisterInsertMother);
                    queryCivilRegisterInsertMother += " RETURNING id, uin";
                    resultCivilRegisterInsertMother = await runSql(pool, queryCivilRegisterInsertMother, []);
                    // // ######## FOR MOTHER ######## \\


                    // // ######## FOR DECLARANT ######## \\
                    var queryCivilRegisterInsertDeclarant = "INSERT INTO civil_register (uin, given_name, last_name, date_of_birth, region_of_birth) VALUES";
                    for (let i = 0; i < forms.length; i++) {
                      //   if (isNullOrEmpty(result[i][44])) { result[i][44] = null; } // info_declarant-info_declarant_2-niu_declarant
                      //   if (isNullOrEmpty(result[i][46])) { result[i][46] = null; } // info_declarant-info_declarant_2-prenom_declarant
                      //   if (isNullOrEmpty(result[i][45])) { result[i][45] = null; } // info_declarant-info_declarant_2-nom_declarant
                      //   if (isNullOrEmpty(result[i][47])) { result[i][47] = null; } result[i][47] = formatDate(result[i][47]); //info_declarant-info_declarant_2-date_naissance_declarant
                      //   if (isNullOrEmpty(result[i][48])) { result[i][48] = null; } // info_declarant-info_declarant_2-address_declarant

                      if (forms[i].info_declarant.info_declarant_2.date_naissance_declarant != null && forms[i].info_declarant.info_declarant_2.niu_declarant)
                        queryCivilRegisterInsertDeclarant += `('${forms[i].info_declarant.info_declarant_2.niu_declarant}', '${forms[i].info_declarant.info_declarant_2.prenom_declarant}', '${forms[i].info_declarant.info_declarant_2.nom_declarant}', '${formatDate(forms[i].info_declarant.info_declarant_2.date_naissance_declarant)}', '${forms[i].info_declarant.info_declarant_2.address_declarant}'),`;
                    }
                    queryCivilRegisterInsertDeclarant = removeCommaAtEnd(queryCivilRegisterInsertDeclarant);
                    queryCivilRegisterInsertDeclarant += " RETURNING id, uin";
                    resultCivilRegisterInsertDeclarant = await runSql(pool, queryCivilRegisterInsertDeclarant, []);
                    // // ######## FOR DECLARANT ######## \\

                    var childsInfo = resultCivilRegisterInsert.rows;
                    var fathersInfo = resultCivilRegisterInsertFather.rows;
                    var mothersInfo = resultCivilRegisterInsertMother.rows;
                    var delarantsInfo = resultCivilRegisterInsertDeclarant.rows;
                    var resultCopy = forms;//result.splice(1, forms.length - 1);
                    var queryRegistrationFormInsert = "INSERT INTO registration_form (child_cr_id, father_cr_id, mother_cr_id, declarant_cr_id, dec_relation, dec_date, transcription_date, in_charge_sign, lattitude, longitude ) VALUES";
                    for (let i = 0; i < childsInfo.length; i++) {
                      const childInfo = childsInfo[i];
                      let indexChildFileData = resultCopy.findIndex(element => element.gr_info.numero_declaration == childInfo.uin);
                      if (indexChildFileData > -1 && forms[i].location != null) {
                        // var indexFather = fathersInfo.findIndex(element => element.info_pere.niu_pere == forms[i].info_pere.niu_pere);
                        // var indexMother = mothersInfo.findIndex(element => element.info_mere.niu_mere == forms[i].info_mere.niu_mere);
                        // var indexDeclarant = delarantsInfo.findIndex(element => element.info_declarant.info_declarant_2.niu_declarant == forms[i].info_declarant.info_declarant_2.niu_declarant);
                        var fatherId = fathersInfo[i].id;
                        var motherId = mothersInfo[i].id;
                        var declarantId = delarantsInfo[i] ? delarantsInfo[i].id : null;
                        var lattitude = forms[i].location.coordinates[0];
                        var longitude = forms[i].location.coordinates[1];

                        //43 = info_declarant-lien_declarant
                        //7 = gr_info-date_declaration
                        //8 = gr_info-date_transcription

                        //53 = lieu_signature
                        queryRegistrationFormInsert += `(${childInfo.id},${fatherId},${motherId},${declarantId},'${forms[i].info_declarant.lien_declarant}','${formatDate(forms[i].gr_info.date_declaration)}','${formatDate(forms[i].gr_info.date_transcription)}','${forms[i].lieu_signature}','${lattitude}','${longitude}'),`


                      }
                    }
                    queryRegistrationFormInsert = removeCommaAtEnd(queryRegistrationFormInsert);
                    queryRegistrationFormInsert += " RETURNING id";
                    var resultRegistrationFormInsertDeclarant = await runSql(pool, queryRegistrationFormInsert, []);

                    /////////////// Attachment Downloading Code ////////////////
                    for (let i = 0; i < forms.length; i++) {
                      formsUrl = `${baseUrl}/projects/${projectId}/forms/fiche_declaration_mg_commune/submissions/${forms[i].meta.instanceID}/attachments/${forms[i].pic_certificate}`
                      let fileSavePathCertificate = "./upload/formsImages/pic_certificate_" + forms[i].pic_certificate;
                      let DBFileSavePathCertificate = "formsImages/pic_certificate_" + forms[i].pic_certificate;

                      axios.get(formsUrl, {
                        headers: {
                          'Authorization': `Bearer ${authToken}`
                        },
                        responseType: 'stream',
                      })
                        .then(response => {
                          new Promise((resolve, reject) => {
                            response.data
                              .pipe(fs.createWriteStream(fileSavePathCertificate))
                              .on('finish', () => resolve())
                              .on('error', e => reject(e));
                          });
                          // return res.json(null, forms);
                        })
                        .catch(error => {
                          reject(isNullOrEmpty(error.message) ? error : error.message, null);
                        });
                      var queryPicCertificateInsert = "INSERT INTO attached_document (cr_id, document_name, document_type, date_created, time_created, document_path) VALUES";
                      queryPicCertificateInsert += `(${childsInfo[i].id},'pic_certificate','jpg','${moment().format("YYYY-MM-DD")}','${moment().format("HH:mm:ss")}','${DBFileSavePathCertificate}')`;
                      queryPicCertificateInsert += " RETURNING id";
                      var resultPicCertificateInsert = await runSql(pool, queryPicCertificateInsert, []);

                      formsUrl = `${baseUrl}/projects/${projectId}/forms/fiche_declaration_mg_commune/submissions/${forms[i].meta.instanceID}/attachments/${forms[i].picture_register}`
                      let fileSavePathRegister = "./upload/formsImages/picture_register_" + forms[i].picture_register;
                      let DBFileSavePathRegister = "formsImages/picture_register_" + forms[i].picture_register;
                      axios.get(formsUrl, {
                        headers: {
                          'Authorization': `Bearer ${authToken}`
                        },
                        responseType: 'stream',
                      })
                        .then(response => {
                          new Promise((resolve, reject) => {
                            response.data
                              .pipe(fs.createWriteStream(fileSavePathRegister))
                              .on('finish', () => resolve())
                              .on('error', e => reject(e));
                          });
                          // return res.json(null, forms);
                        })
                        .catch(error => {
                          reject(isNullOrEmpty(error.message) ? error : error.message, null);
                        });

                      var queryPicRegisterInsert = "INSERT INTO attached_document (cr_id, document_name, document_type, date_created, time_created, document_path) VALUES";
                      queryPicRegisterInsert += `(${childsInfo[i].id},'picture_register','jpg','${moment().format("YYYY-MM-DD")}','${moment().format("HH:mm:ss")}','${DBFileSavePathRegister}')`;
                      queryPicRegisterInsert += " RETURNING id";
                      var resultPicRegisterInsert = await runSql(pool, queryPicRegisterInsert, []);
                    }

                    var insertQuery = 'INSERT INTO excel_upload_log (date_created, number_record, input_type, file, time_created, module_type) VALUES ($1, $2, $3, $4, $5, $6)';
                    var insertResult = await runSql(pool, insertQuery, [
                      moment().format("YYYY-MM-DD"),
                      childsInfo.length,
                      "ODK",
                      "//fiche_declaration_mg_commune",
                      moment().format("YYYY-MM-DD HH:mm:ss"),
                      "ODK"
                    ]);
                    resolve("Data entered");
                  })
                  .catch(error => {
                    reject(isNullOrEmpty(error.message) ? error : error.message, null);
                  });
              })
              .catch(error => {
                reject(isNullOrEmpty(error.message) ? error : error.message, null);
              });
          });

          resolve(forms);
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
  getCommune: async (callBack) => {
    try {
      const query = `SELECT DISTINCT libelle_commune FROM fokontany`;
      const result = await runSql(pool, query, []);
      const communes = result.rows.map(row => row.libelle_commune);
      return callBack(null, communes);
    } catch (error) {
      return callBack(error, null);
    }
  },
  createUin: async (data, callBack) => {
    try {
      if (!data) {
        throw new Error('File path is missing');
      }

      const extension = data.split('.').pop();
      let result = [];

      try {
        if (extension === 'xls' || extension === 'xlsx') {
          const workbook = xlsx.readFile(data);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          result = xlsx.utils.sheet_to_json(worksheet);
        } else if (extension === 'csv') {
          await new Promise((resolve, reject) => {
            const stream = fs.createReadStream(data);
            const csvData = [];

            stream
              .pipe(fastcsv.parse())
              .on('data', (rowData) => {
                csvData.push(rowData);
              })
              .on('end', () => {
                resolve(csvData);
              })
              .on('error', (error) => {
                reject(error);
              });
          })
            .then((parsedData) => {
              result = parsedData;
            })
            .catch((error) => {
              throw new Error('Error parsing CSV file');
            });
        } else {
          throw new Error('Invalid file type');
        }
      } catch (error) {
        throw new Error('Error reading file for data gathering');
      }

      const currentDate = new Date();
      const formattedTime = currentDate.toLocaleString('en-US', { hour12: false });
      const uinInsertValues = [];

      try {
        for (let i = 1; i < result.length; i++) {
          if (isNullOrEmpty(result[i][0])) {
            result[i][0] = null;
          }
          if (isNullOrEmpty(result[i][1])) {
            result[i][1] = null;
          }

          uinInsertValues.push(`(
          '${result[i][0]}',
          '${result[i][1]}',
          0
        )`);
        }
      } catch (error) {
        return callBack({ error_code: 1, message: isNullOrEmpty(error.message) ? error : error.message }, null);
      }

      const queryUinInsert = `INSERT INTO uin (uin, code_commune, niu_status) VALUES ${uinInsertValues.join(',')}`;

      // Execute the query and handle the result
      try {
        const resultUinInsert = await runSql(pool, queryUinInsert, []);
        return callBack(null, { error_code: 0, message: 'Data inserted successfully' });
      } catch (error) {
        return callBack({ error_code: 1, message: isNullOrEmpty(error.message) ? error : error.message }, null);
      }
    } catch (error) {
      return callBack({ error_code: 1, message: isNullOrEmpty(error.message) ? error : error.message }, null);
    }
  },
  getAllUin: async (niuStatus, commune, page, limit, callBack) => {
    try {
      const offset = (page - 1) * limit;
      let getQuery = "SELECT * FROM uin";
      let countQuery = "SELECT COUNT(*) AS total_count FROM uin";

      if (niuStatus || commune) {
        getQuery += " WHERE";
        countQuery += " WHERE";

        if (niuStatus) {
          getQuery += ` niu_status = '${niuStatus}'`;
          countQuery += ` niu_status = '${niuStatus}'`;
        }

        if (commune) {
          if (niuStatus) {
            getQuery += " AND";
            countQuery += " AND";
          }
          getQuery += ` code_commune = '${commune}'`;
          countQuery += ` code_commune = '${commune}'`;
        }
      }

      getQuery += ` LIMIT ${limit} OFFSET ${offset}`;

      console.log(getQuery)
      console.log(countQuery)
      let [getResult, countResult] = await Promise.all([
        runSql(pool, getQuery, []),
        runSql(pool, countQuery, [])
      ]);

      const totalRecords = countResult.rows[0].total_count;

      return callBack(null, getResult.rows, totalRecords);
    } catch (error) {
      return callBack(error.message, null);
    }
  }
};