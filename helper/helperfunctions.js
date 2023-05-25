const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const moment = require("moment/moment");

module.exports = {

  timeDifference: function diff_minutes(dt2, dt1) {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff)) - 300;
  },

  isNullOrEmpty: function (val) {
    return (val === undefined || val == null || val.length <= 0 || val == "") ? true : false;
  },

  getMinutesDifference: function (date1, date2) {
    if (typeof date1 === 'string') {
      date1 = this.parseDate(date1);
    }
    if (typeof date2 === 'string') {
      date2 = this.parseDate(date2);
    }
    const diffInMs = Math.abs(date2 - date1);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes;
  },
  addToEndDate: function (date, endDate, difference) {
    if (typeof date === 'string') {
      date = this.parseDate(date);
    }
    if (typeof endDate === 'string') {
      endDate = this.parseDate(endDate);
    }
    if (this.convertDateToString(date) == this.convertDateToString(endDate)) {
      return date.setMinutes(date.getMinutes() + difference);
    }
    date = date.setMinutes(date.getMinutes() + difference);
    if (date > endDate) {
      date = endDate;
    }
    var tempDate = this.parseDate(date);
    return this.parseDate(date);
  },
  addToDate: function (date, difference) {
    if (typeof date === 'string') {
      date = this.parseDate(date);
    }
    date = date.setMinutes(date.getMinutes() + difference);
    return this.parseDate(date);
  },
  convertToTime: function (dateString) {
    let dateTime = new Date(dateString);
    let hours = dateTime.getHours();
    let minutes = dateTime.getMinutes();
    let period = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // If hours is 0, set it to 12 instead

    let time = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + period;
    return time;
  },
  getCenterDate: function (date1, date2) {
    if (typeof date1 === 'string') {
      date1 = this.parseDate(date1);
    }
    if (typeof date2 === 'string') {
      date2 = this.parseDate(date2);
    }
    const timestamp1 = date1.getTime();
    const timestamp2 = date2.getTime();
    const centerTimestamp = (timestamp1 + timestamp2) / 2;
    const centerDate = new Date(centerTimestamp);
    return centerDate;
  },
  getCenterDateMoment: function (date1, date2) {
    let date1Moment = moment(date1);
    let date2Moment = moment(date2);
    let diff = date2Moment.diff(date1Moment, 'minutes');
    let midTime = date1Moment.add(diff / 2, 'minutes');
    return midTime;
  },
  convertDateToDDDD: function (date) {
    let dateTime = new Date(date);
    let options = { weekday: 'long', month: 'numeric', day: 'numeric', year: 'numeric' };
    let formattedDate = dateTime.toLocaleDateString('en-US', options);
    return formattedDate;
  },
  convertDateToDDD: function (date) {
    let dateTime = new Date(date);
    let options = { weekday: 'short' };
    return dateTime.toLocaleString('en-US', options);
  },
  convertDateToMMM: function (date) {
    let dateTime = new Date(date);
    let options = { month: 'short' };
    return dateTime.toLocaleString('en-US', options);
  },
  parseDate: function (date) {
    if (typeof date === 'string' || typeof date === 'number') {
      date = new Date(date);
    }
    var typeDate = typeof date;
    return date;
  },
  convertDateToString: function (date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const datetimeString = date.toLocaleString('en-US', options).replace(',', '');
    const [dateString, timeString] = datetimeString.split(' ');

    const [month, day, year] = dateString.split('/');
    const [hour, minute, second] = timeString.split(':');

    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
    return isoString;
  },
  convertDateToStringMoment: function (date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
  },
  runSql: async (pool, query, values) => {
    return await new Promise((resolve, reject) => {
      pool.query(query, values, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  },
  readFiles(filePath) {
    let result = [];
    let extension = filePath.split('.').pop();

    if (extension === 'xls' || extension === 'xlsx') {
      let workbook = xlsx.readFile(filePath);
      let sheetName = workbook.SheetNames[0];
      let worksheet = workbook.Sheets[sheetName];
      result = xlsx.utils.sheet_to_json(worksheet);
    } else if (extension === 'csv') {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => result.push(data))
        .on('end', () => {
          console.log('CSV file successfully processed');
        });
    }
    // Usage example
    console.log(readFiles('example.xlsx'));
    console.log(readFiles('example.csv'));
    return result;
  },
  removeCommaAtEnd(str) {
    var lastChar = str.slice(-1);
    if (lastChar == ',') {
      str = str.slice(0, -1);
    }
    return str;
  },
  getMonthStartEnd: function (dateString) {
    let [year, month] = dateString.split("-");
    if (month == 1) {
      month = 12;
      year = year - 1;
    }
    else {
      month = month - 1;
    }
    // Get the start of the month
    const start = `${year}-${month}-01 00:00:00`;

    // Get the end of the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const end = `${year}-${month}-${daysInMonth} 23:59:59`;

    return { start, end };
  },
  getLastYear: function (dateString) {
    let [year, month] = dateString.split("-");
    // Get the start of the month
    const start = `${year - 1}-01-01 00:00:00`;
    const end = `${year - 1}-12-01 23:59:59`;

    return { start, end };
  },
  getLastSevenDays: function (dateString) {
    let [year, month, day] = dateString.split("-");
    let newDateObject = new Date(dateString);
    newDateObject = newDateObject.setDate(newDateObject.getDate() - 7);
    newDateObject = new Date(newDateObject);

    const start = `${newDateObject.getFullYear()}-${convertToD2(newDateObject.getMonth() + 1)}-${convertToD2(newDateObject.getDate())} 00:00:00`;
    const end = `${year}-${month}-${day} 23:59:59`;
    return { start, end };
  },
  convertToD2,
  getMinuteDiff,
  addMinutesToDate,
  stringToDate,
  formatDate,
  getLastDates
}
function convertToD2(sN) {
  sN = `00${sN}`;
  return sN.substring(sN.length - 2, sN.length);
}

function getMinuteDiff(dateString1, dateString2) {
  let date1 = moment.utc(dateString1);
  let date2 = moment.utc(dateString2);
  return date2.diff(date1, 'minutes');
}

function addMinutesToDate(date, minutesToAdd) {
  return moment.utc(date).add({ minutes: minutesToAdd }).format("YYYY-MM-DD")
}

function stringToDate(dateString) {
  let finalDate = moment(dateString).format("YYYY-MM-DD");
  return finalDate;
}

function formatDate(inputDate) {
  try {

    let t = moment.utc(inputDate).format("YYYY-MM-DD");
    return t;
  } catch (error) {
    console.log(error);
  }
}

function getLastDates(dateString, days) {
  let [year, month, day] = dateString.split("-");

  let newDateObject = moment(dateString).subtract({ hours: new Date().getTimezoneOffset() / 60 });
  newDateObject = moment(dateString).subtract({ days: days });

  const start = `${newDateObject.year()}-${convertToD2(newDateObject.month() + 1)}-${convertToD2(newDateObject.date())} 00:00:00`;
  const end = `${year}-${month}-${day} 23:59:59`;
  return { start, end };
}
