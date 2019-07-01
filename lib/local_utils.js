// Use these constants
//const {CONSTANTS} = require('./Constants');
const {CONFIG} = require('./Constants');

var fs = require('fs');

/**
 * Array of CLF month names.
 * @private
 */
var CLF_MONTH = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];


/**
 * Format a MM/dd/yyyy string into a ISO Date string compatible with the CRM.
 *
 * @public
 * @param {string} formatted as MM/dd/yyyy (ie. 01/04/2017).
 * @return {string} should return format as 2017-01-04T08:00:00Z
 */
var getISODateTimezoneString = function (dateString) {

  // Create the ISO date string
  var date = new Date(dateString);
  var isoStringWithMilliseconds = date.toISOString();

  // Remove the milliseconds specifier.
  return(isoStringWithMilliseconds.substring(0,19)+'Z');
};
/**
 * Pad number to two digits.
 *
 * @private
 * @param {number} num
 * @return {string}
 */
function pad2 (num) {
  var str = String(num);

  return (str.length === 1 ? '0' : '') + str
}
/**
 * Format a Date in the common log format.
 *
 * @public
 * @param {Date} dateTime
 * @return {string}
 */
var clfdate = function (dateTime) {
  var date = dateTime.getUTCDate();
  var hour = dateTime.getUTCHours();
  var mins = dateTime.getUTCMinutes();
  var secs = dateTime.getUTCSeconds();
  var year = dateTime.getUTCFullYear();

  var month = CLF_MONTH[dateTime.getUTCMonth()];

  return pad2(date) + '/' + month + '/' + year +
    ':' + pad2(hour) + ':' + pad2(mins) + ':' + pad2(secs) +
    ' +0000'
};
/*
 *  Logging methods
 */
var logFileDescriptor = null;
function getLogFileDescriptor() {

  if (null === logFileDescriptor) {
    logFileDescriptor = fs.openSync(CONFIG.SERVER_LOG_FILE, 'a+');
  }

  return(logFileDescriptor);
}
var multiLog = function (stuff) {
  // We still need to iron out how to ensure we have the remote IP address in our logs.
  //console.log(req.ip + " " + req._remoteAddress + " " + req.connection.remoteAddress);
  //console.log(req.connection);

  // Use a Common Log Format date to match the access logs.
  var timeString = clfdate(new Date());
  stuff = "[" + timeString + "] " + stuff;
  console.log(stuff);
  fs.appendFile(
    getLogFileDescriptor(),
    stuff + '\r\n',
    {flags: 'a+', encoding: 'utf8'},
    function(err) {
      if (!err) {return;}
      setTimeout(function() {console.log(err);});
    }
  );
};


module.exports = {
  getISODateTimezoneString : getISODateTimezoneString,
  clfdate : clfdate,
  multiLog : multiLog,
  getIntegerFromString: function (stringData) {
    var integer = sNaN;

    if ( (undefined !== stringData) && (null !== stringData) ) {
      integer = parseInt(stringData);
    }

    return(integer);
  },

  getDaysInMonth : function (futureMonth, futureYear) {
    // To fix error returned when month does not have an extra day...
    var futureDay = 31;

    switch (futureMonth) {
      case 4: case 6: case 9: case 11:
        futureDay = 30;
        break;
      case 2:
        if (0 === (futureYear % 4)) {
          futureDay = 29;
        } else {
          futureDay = 28;
        }
        break;
    }

    return(futureDay);
  },


  /*
   * Data processing Methods
   */
  safelyParseJSON : function (json) {
    var parsed;

    try {
      parsed = JSON.parse(json)
    } catch (e) {
      multiLog("Could not parse json data: ");
      console.log(json);
      console.log(e);
    }

    return parsed; // Could be undefined!
  },

  /*
   *  Methods to retrieve/store the file data
   */
  readFileData : function (fileName) {
    var fileData = '';

    try {
      fs.accessSync(fileName, fs.F_OK);
      fileData = fs.readFileSync(fileName, 'utf8');
      multiLog("We have a read file: " + fileName ); //+ " Cookie?: " + session);
    } catch (e) {

      // It isn't accessible
      multiLog("No pre-existing '" + fileName + "' file is available.");
    }

    return(fileData);
  },
  saveFileData : function (fileData, fileName) {

    if ( (undefined !== fileData) && (null !== fileData) ) {
      fs.writeFileSync(fileName, fileData, 'utf8');
      multiLog("Saved data to file: " + fileName);
    } else {
      multiLog("Data value is not properly set!");
    }
  }
};
