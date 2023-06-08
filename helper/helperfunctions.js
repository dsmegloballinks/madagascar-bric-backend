const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const moment = require("moment/moment");
const nodemailer = require("nodemailer");

module.exports = {

  /* The `timeDifference` function is calculating the difference in minutes between two dates (`dt2`
  and `dt1`) and subtracting 300 from the result. The function first calculates the difference in
  seconds between the two dates, then divides by 60 to get the difference in minutes. The `Math.abs`
  function is used to ensure that the result is always positive, and `Math.round` is used to round
  the result to the nearest integer. Finally, 300 is subtracted from the result before it is
  returned. */
  timeDifference: function diff_minutes(dt2, dt1) {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff)) - 300;
  },
  sendEmail: async (to, subject, text) => {
    try {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: `dsmegloballinks@gmail.com`,
          pass: 'zzjhywxfvwypmeki'
        }
      });

      let mailOptions = {
        // from: `dsmegloballinks@gmail.com`,
        from: `"no reply" dsmegloballinks@gmail.com`,
        to: to,
        subject: subject,
        text: text
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      console.error(`Error occurred while sending email: ${error.message}`);
    }
  },
  /* The `isNullOrEmpty` function is checking if a given value is null, undefined, an empty string, or
  an array with length less than or equal to 0. If any of these conditions are true, the function
  returns `true`, otherwise it returns `false`. */
  isNullOrEmpty: function (val) {
    return (val === undefined || val == null || val.length <= 0 || val == "") ? true : false;
  },

  /* The `getMinutesDifference` function is calculating the difference in minutes between two dates
  (`date1` and `date2`). If either of the input dates is a string, the function first converts it to
  a date object using the `parseDate` function. The function then calculates the difference in
  milliseconds between the two dates using the `Math.abs` function to ensure that the result is
  always positive. The difference in milliseconds is then converted to minutes using the formula
  `(diffInMs / (1000 * 60))`. The result is rounded down to the nearest integer using the
  `Math.floor` function and returned. */
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
  /* The `addToEndDate` function takes in three parameters: `date`, `endDate`, and `difference`. It
  first checks if `date` and `endDate` are strings and if so, converts them to date objects using
  the `parseDate` function. */
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
  /* The `addToDate` function takes in two parameters: `date` and `difference`. If `date` is a string,
  it is converted to a date object using the `parseDate` function. The function then adds
  `difference` number of minutes to the `date` object using the `setMinutes` method. Finally, the
  updated `date` object is returned after being converted back to a date object using the
  `parseDate` function. */
  addToDate: function (date, difference) {
    if (typeof date === 'string') {
      date = this.parseDate(date);
    }
    date = date.setMinutes(date.getMinutes() + difference);
    return this.parseDate(date);
  },
  /* The `convertToTime` function takes a date string as input and converts it to a 12-hour time format
  with AM or PM. It first creates a new `Date` object from the input `dateString`, then extracts the
  hours and minutes from the date using the `getHours` and `getMinutes` methods. It then determines
  whether the time is in the AM or PM period by checking if the hours are greater than or equal to
  12. If the hours are greater than 12, it subtracts 12 from the hours to convert them to 12-hour
  format. If the hours are 0, it sets them to 12 instead. Finally, it concatenates the hours,
  minutes, and period into a string and returns it. */
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
  /* The `getCenterDate` function takes in two parameters `date1` and `date2`, which can be either date
  objects or date strings. If either of the input dates is a string, the function first converts it
  to a date object using the `parseDate` function. The function then calculates the average
  timestamp between the two dates by adding the timestamps of the two dates and dividing by 2. The
  resulting timestamp is then used to create a new `Date` object, which represents the center date
  between the two input dates. This center date is then returned by the function. */
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
  /* The `getCenterDateMoment` function is calculating the center date between two input dates (`date1`
  and `date2`) using the Moment.js library. The function first creates two Moment.js objects from
  the input dates (`date1` and `date2`). It then calculates the difference in minutes between the
  two dates using the `diff` method of the `date2Moment` object. The function then adds half of this
  difference to the `date1Moment` object using the `add` method with the `'minutes'` parameter.
  Finally, the resulting Moment.js object representing the center date is returned. */
  getCenterDateMoment: function (date1, date2) {
    let date1Moment = moment(date1);
    let date2Moment = moment(date2);
    let diff = date2Moment.diff(date1Moment, 'minutes');
    let midTime = date1Moment.add(diff / 2, 'minutes');
    return midTime;
  },
  /* The above code defines a function called `convertDateToDDDD` that takes a date as input and
  returns a formatted date string in the format "weekday, month day, year". It uses the `Date`
  object to create a new date object from the input date, and then uses the `toLocaleDateString`
  method to format the date according to the specified options. The formatted date string is then
  returned by the function. */
  convertDateToDDDD: function (date) {
    let dateTime = new Date(date);
    let options = { weekday: 'long', month: 'numeric', day: 'numeric', year: 'numeric' };
    let formattedDate = dateTime.toLocaleDateString('en-US', options);
    return formattedDate;
  },
  /* The above code defines a function called `convertDateToDDD` that takes a date as input and returns
  the abbreviated name of the day of the week for that date in the format of "DDD". It uses the
  `Date` object to create a new date object from the input date, and then uses the `toLocaleString`
  method to format the date object into a string with the specified options. The options object
  specifies that only the abbreviated name of the day of the week should be included in the output. */
  convertDateToDDD: function (date) {
    let dateTime = new Date(date);
    let options = { weekday: 'short' };
    return dateTime.toLocaleString('en-US', options);
  },
  /* The above code is defining a function called `convertDateToMMM` that takes in a date parameter.
  The function creates a new `Date` object from the input date and then uses the `toLocaleString`
  method to format the date into a string with the abbreviated month name (e.g. "Jan", "Feb", etc.).
  The function then returns this formatted string. */
  convertDateToMMM: function (date) {
    let dateTime = new Date(date);
    let options = { month: 'short' };
    return dateTime.toLocaleString('en-US', options);
  },
  /* The above code is defining a function called `parseDate` that takes in a parameter called `date`.
  The function checks if the `date` parameter is a string or a number, and if it is, it creates a
  new `Date` object using the `date` parameter. The function then returns the `date` parameter,
  which could be either the original `date` parameter or the new `Date` object. */
  parseDate: function (date) {
    if (typeof date === 'string' || typeof date === 'number') {
      date = new Date(date);
    }
    var typeDate = typeof date;
    return date;
  },
  /* The above code is a JavaScript function that takes a date object as input and converts it into a
  string in ISO format (YYYY-MM-DD HH:MM:SS). It does this by first formatting the date object into
  a string with the desired format using the toLocaleString() method. It then splits the resulting
  string into date and time components, and reorders them into the desired ISO format. Finally, it
  returns the ISO string. */
  convertDateToString: function (date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const datetimeString = date.toLocaleString('en-US', options).replace(',', '');
    const [dateString, timeString] = datetimeString.split(' ');

    const [month, day, year] = dateString.split('/');
    const [hour, minute, second] = timeString.split(':');

    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
    return isoString;
  },
  /* The above code is a function in JavaScript that takes a date as input and uses the Moment.js
  library to convert it into a string format with the format "YYYY-MM-DD HH:mm:ss". The resulting
  string represents the date and time in a standardized format that can be easily used and displayed
  in various applications. */
  convertDateToStringMoment: function (date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
  },
  /* The above code is defining an asynchronous function called `runSql` that takes in three
  parameters: `pool`, `query`, and `values`. The function returns a promise that resolves with the
  results of a SQL query executed using the `pool` object. The `query` parameter is the SQL query to
  be executed, and the `values` parameter is an array of values to be used as parameters in the
  query. If there is an error executing the query, the promise is rejected with the error. */
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
  /* The above code defines a function called `readFiles` that takes a file path as an argument. The
  function reads the file and returns its contents in an array format. If the file extension is
  `.xls` or `.xlsx`, the function uses the `xlsx` library to read the file and convert it to a JSON
  object. If the file extension is `.csv`, the function uses the `csv-parser` library to read the
  file and convert it to an array of objects. The function then logs the contents of the file to the
  console and returns the result. */
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
  /* The above code defines a function called `removeCommaAtEnd` that takes a string as an argument.
  The function checks if the last character of the string is a comma. If it is, the function removes
  the comma and returns the updated string. If the last character is not a comma, the function
  simply returns the original string. */
  removeCommaAtEnd(str) {
    var lastChar = str.slice(-1);
    if (lastChar == ',') {
      str = str.slice(0, -1);
    }
    return str;
  },
  /* The above code is a JavaScript function that takes a date string in the format "YYYY-MM" as input
  and returns an object containing the start and end dates of the previous month in the format
  "YYYY-MM-DD HH:MM:SS". */
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
  /* The above code is defining a method called `getLastYear` that takes a `dateString` parameter. The
  method splits the `dateString` into year and month components and calculates the start and end
  dates of the previous year. The start date is set to January 1st of the previous year at midnight,
  and the end date is set to December 1st of the previous year at 11:59:59 PM. The method returns an
  object containing the start and end dates. */
  getLastYear: function (dateString) {
    let [year, month] = dateString.split("-");
    // Get the start of the month
    const start = `${year - 1}-01-01 00:00:00`;
    const end = `${year - 1}-12-01 23:59:59`;

    return { start, end };
  },
  /* The above code defines a function called `getLastSevenDays` that takes a `dateString` parameter.
  The function splits the `dateString` into year, month, and day components and creates a new `Date`
  object from it. It then subtracts 7 days from the date using the `setDate` method and creates a
  new `Date` object from the result. The function then formats the start and end dates as strings in
  the format `YYYY-MM-DD HH:MM:SS` and returns them as an object with `start` and `end` properties.
  The `convert */
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
/**
 * The function converts a number to a two-digit string by adding leading zeros.
 * @param sN - sN is a variable representing a number that needs to be converted to a two-digit string.
 * @returns The function `convertToD2` takes a parameter `sN` and returns a string that represents the
 * last two digits of `sN`. If `sN` is less than 10, the returned string will have a leading zero.
 */
function convertToD2(sN) {
  sN = `00${sN}`;
  return sN.substring(sN.length - 2, sN.length);
}

/**
 * The function calculates the difference in minutes between two given dates using the moment.js
 * library.
 * @param dateString1 - The first date string in UTC format (e.g. "2021-05-20T12:00:00Z").
 * @param dateString2 - I'm sorry, it seems like the parameter for dateString2 is missing. Could you
 * please provide me with the value of dateString2?
 * @returns The function `getMinuteDiff` returns the difference in minutes between two given dates.
 */
function getMinuteDiff(dateString1, dateString2) {
  let date1 = moment.utc(dateString1);
  let date2 = moment.utc(dateString2);
  return date2.diff(date1, 'minutes');
}

/**
 * The function adds a specified number of minutes to a given date and returns the resulting date in a
 * specific format using the Moment.js library.
 * @param date - The date to which minutes need to be added in the format "YYYY-MM-DD".
 * @param minutesToAdd - The number of minutes that you want to add to the given date.
 * @returns a string in the format "YYYY-MM-DD" which represents the date after adding the specified
 * number of minutes to the input date.
 */
function addMinutesToDate(date, minutesToAdd) {
  return moment.utc(date).add({ minutes: minutesToAdd }).format("YYYY-MM-DD")
}

/**
 * The function converts a string date to a formatted date using the moment.js library.
 * @param dateString - The input string representing a date in any valid format.
 * @returns a string in the format "YYYY-MM-DD", which represents the date parsed from the input string
 * using the Moment.js library.
 */
function stringToDate(dateString) {
  let finalDate = moment(dateString).format("YYYY-MM-DD");
  return finalDate;
}

/**
 * The function formats a given date input into a UTC date string in the format "YYYY-MM-DD" using the
 * moment.js library.
 * @param inputDate - The inputDate parameter is a date string that needs to be formatted.
 * @returns a formatted date string in the format "YYYY-MM-DD".
 */
function formatDate(inputDate) {
  try {

    let t = moment.utc(inputDate).format("YYYY-MM-DD");
    return t;
  } catch (error) {
    console.log(error);
  }
}

/**
 * The function takes a date string and a number of days, and returns an object with the start and end
 * dates for the specified range.
 * @param dateString - A string representing a date in the format "YYYY-MM-DD".
 * @param days - The number of days to subtract from the given dateString.
 * @returns an object with two properties: "start" and "end". These properties contain strings
 * representing the start and end dates for a given number of days before a given date. The start date
 * is set to 00:00:00 and the end date is set to 23:59:59.
 */
function getLastDates(dateString, days) {
  let [year, month, day] = dateString.split("-");

  let newDateObject = moment(dateString).subtract({ hours: new Date().getTimezoneOffset() / 60 });
  newDateObject = moment(dateString).subtract({ days: days });

  const start = `${newDateObject.year()}-${convertToD2(newDateObject.month() + 1)}-${convertToD2(newDateObject.date())} 00:00:00`;
  const end = `${year}-${month}-${day} 23:59:59`;
  return { start, end };
}

