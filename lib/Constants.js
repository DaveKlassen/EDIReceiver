const CONSTANTS = {

  // This file is used to review configuration information.
  SERVER_CONF_FILE : 'conf/server.json',
  BUILD_NUMBER : "%BUILD_NUMBER%",

  // Data related values
  CACHED_CRM_BUSINESS_UNITS : "BUSINESS_UNITS",
  CACHED_CRM_SYSTEM_USERS : "SYSTEM_USERS",
  CACHED_CRM_SITE_IDS : "SITE_IDS",
  OVER_TWENTY_THREE_HOURS : ((60 * 60 * 23.7) * 1000),
  OVER_FIFTY_FIVE_MINUTES : ((60 * 55) * 1000),

  // WebSite related values
  WEB_SERVER_ROOT : '../www',
  LOG_DIRECTORY : 'log',
  SERVER_LOG_FILE : '/server.log',

  // API values
  DENY_HOST_COLLECTION : "deny_host",
  DENY_URL_COLLECTION : "deny_url",
  BASE_URI : "/edi/",
  XML_BASE_URI : "/edi/xml/",
  SUBMITTED_EDI_COLLECTION : "edi",
  DOCUMENTS_FILE : "data/documents.json",
  SUCCESS: "SUCCESS",
  DOCUMENT_SAVED: "Document Saved",
  ERROR: "ERROR",
  PROCESSING_FAILED : "Processing Failed",
  PROCESSING: "Processing",
  DENIED: "Denied",
  WARNING: "Warning",
  APPROVED: "Approved",
  DEFAULT_WARNING: "Check Operations Not Completed",
  UNEXPECTED_WARNING: "Check Operations Not Completed",
  STILL_PROCESSING: "Processing not completed",
  NO_HOST : "No Host",
  DENY_NO_HOST : "No Host Provided to check",
  HOST_FORMAT : "Wrong Host Format",
  PORT_FORMAT : "Wrong Port Format",
  HOST_DB_ERROR: "Error in vetting host info",
  HOST_NOT_FOUND: "The provided host is not restricted",
  BAD_HOST_FOUND: "This host port combination has a bad history",
  URL_DB_ERROR: "Error in vetting URL info",
  URL_NOT_FOUND: "The provided URL is not restricted",
  BAD_URL_FOUND: "This URL has a bad history",

  // External API related values
  XRM_ODATA_API_PATH : '/XRMServices/2011/OrganizationData.svc/',
  WEB_API_PATH : '/api/data/v8.2/',
  EXCH_API_PATH : '/api/v2.0/',
  HTTP_METHODS : {
    GET : 'GET',
    POST : 'POST',
    UPDATE : 'UPDATE',
    PUT : 'PUT',
    PATCH : 'PATCH'
  }
};

var path = require('path');
var WEB_SERVER_ROOT = path.join(__dirname + '/..', CONSTANTS.WEB_SERVER_ROOT);
var LOG_DIRECTORY = path.join(__dirname + '/..', CONSTANTS.LOG_DIRECTORY);
var SERVER_LOG_FILE = LOG_DIRECTORY + CONSTANTS.SERVER_LOG_FILE;
function setConfigurationDirectories() {
  var conf = {};

  conf.WEB_SERVER_ROOT = WEB_SERVER_ROOT;
  conf.LOG_DIRECTORY = LOG_DIRECTORY;
  conf.SERVER_LOG_FILE = SERVER_LOG_FILE;

  return(conf);
}

const CONFIG = setConfigurationDirectories();
module.exports = {
  CONSTANTS,
  CONFIG
}
