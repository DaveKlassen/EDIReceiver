// Use these constants
const {CONSTANTS} = require('./lib/Constants');
const {CONFIG} = require('./lib/Constants');

var application_root = __dirname,
  fs = require('fs'),
  path = require('path'),
  assert = require('assert'),
  lutils = require('./lib/local_utils'),
  fileStreamRotator = require('file-stream-rotator'),
  xmlparser = require('express-xml-bodyparser'),
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),

  https = require('https'),
  http = require('http'),
  morgan = require('morgan'),
  MongoClient = require('mongodb').MongoClient,
  events = require('events'),
  mongo = require('./lib/mongo_api'),

  // If you would like to modify these settings create a json_data/server.json file.
  // For an example see the file json_data/envsave.json
  WWW_REDIRECT = true,
  SSL_DIR = "./",
  EXTERNAL_PORT = 80,
  EXTERNAL_HOST = "www.urlcheck.org",
  EXTERNAL_PROTOCOL = "http://",
  EXTERNAL_HOST_PORT = EXTERNAL_PROTOCOL + EXTERNAL_HOST,

  DB_HOST = "",
  DB_USER = "",
  DB_PASS = "",
  DB_IMPL = CONFIG.DB_IMPL,
  OWNER_EMAIL_ADDR = '"Admin" <dbavedb@shaw.ca>';


// Initialize the event emissions
var eventEmitter = new events.EventEmitter();

// Initialize the log directory
fs.existsSync(CONFIG.LOG_DIRECTORY) || fs.mkdirSync(CONFIG.LOG_DIRECTORY);

// create a rotating write stream
var accessLogStream = fileStreamRotator.getStream({
  date_format: 'YYYYMMDD',
  filename: path.join(CONFIG.LOG_DIRECTORY, 'access-%DATE%.log'),
  frequency: 'weekly',
  verbose: false
});

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

// If required override the above settings from a local file.
getCurrentEnvironment();

// Setup the webserver
app.set('port', EXTERNAL_PORT);
//app.use('/', express.static(CONFIG.WEB_SERVER_ROOT));
//app.use(xmlparser({attrkey: "attr$"}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Start the HTTPS server
if (443 === EXTERNAL_PORT) {
  lutils.multiLog('SSL Directory : ' + SSL_DIR);

  var httpsOptions = {
    ca: fs.readFileSync(SSL_DIR + 'urlcheck-ca.crt'),
    cert: fs.readFileSync(SSL_DIR + 'urlcheck.crt'),
    key: fs.readFileSync(SSL_DIR + 'urlcheck.key')
  };
  https.createServer(httpsOptions, app).listen(443);
} else {

  // If we are not running https on 443 there is no need to a redirect server.
  if (false !== WWW_REDIRECT) {
    WWW_REDIRECT = "Not Required";
  }
  app.listen(app.get('port') );
}
lutils.multiLog("PostConfig Site: " + EXTERNAL_HOST_PORT);
lutils.multiLog("Server started on Port: " + app.get('port') );
lutils.multiLog('Backend Storage Driver: ' + DB_IMPL);
lutils.multiLog('Using Admin e-mail address of: ' + OWNER_EMAIL_ADDR);
lutils.multiLog('Using DB_HOST of: ' + DB_HOST);

if (true === WWW_REDIRECT) {
  // Redirect port 80 to 443
  var redirectApp = express () ,
  redirectServer = http.createServer(redirectApp);
  redirectApp.use(function requireHTTPS(req, res, next) {
    if (!req.secure) {
      var redirectLocation = 'https://' + EXTERNAL_HOST;  //req.headers.host
      if (undefined !== EXTERNAL_PORT) {

        // If there is a special port supplied use it.
        if ( (null !== EXTERNAL_PORT) && ("" !== EXTERNAL_PORT) && (443 !== EXTERNAL_PORT) && ("443" !== EXTERNAL_PORT) ) {
          redirectLocation = redirectLocation + ":" + EXTERNAL_PORT
        }
      }
    redirectLocation = redirectLocation + req.url;
      lutils.multiLog("Redirecting client to secure service: " + redirectLocation);
      return res.redirect(redirectLocation);
    }
    next();
  })
  redirectServer.listen(80);
  lutils.multiLog("Redirect Server on Port 80: Started");
} else {
  if (false === WWW_REDIRECT) {
    lutils.multiLog("Redirect Server on Port 80: Not Configured");
  } else {
    lutils.multiLog("Redirect Server on Port 80: " + WWW_REDIRECT);
  }
}


function processPostData(receivedReq) {
  let response = { status : CONSTANTS.WARNING,
                   reason : CONSTANTS.DEFAULT_WARNING,
                   payload : Object.assign({})
                  };

  // Capture our post Info
  if (receivedReq.body) {
    response.status = CONSTANTS.PROCESSING;
    response.reason = CONSTANTS.STILL_PROCESSING;

    try {

      response.payload = Object.assign({}, receivedReq.body);
      response.payload.id = Date.now();
    } catch (unexpectedError) {
      response.status = CONSTANTS.ERROR;
      response.reason = CONSTANTS.PROCESSING_FAILED;

      // For debugging production print this value in an exception case... so we know what happened
      console.error(unexpectedError);
      console.error("Processing data: ");
      console.error( receivedReq.body );
      //console.error( JSON.stringify(receivedReq.body) );
      return(response);
    }
  } else {
    response.reason = CONSTANTS.UNEXPECTED_WARNING;
  }

  return(response);
}

function processPostReq(req, res) {
  lutils.multiLog("Received request : " + req.url);

  // Process Request
  let resData = processPostData(req)
  if (resData.status === CONSTANTS.PROCESSING) {

    try {

      // Save Data to DB
      mongo.saveDataObject(resData.payload);
      resData.status = CONSTANTS.SUCCESS;
      resData.reason = CONSTANTS.DOCUMENT_SAVED;
    } catch (unexpectedError) {

      // For debugging production we need to print this value in an exception case... so we know what happened
      console.error(unexpectedError);
      console.error("Processing data: ");
      console.error( JSON.stringify(req.body) );
      return;
    }
    lutils.multiLog(resData.status + " : " + resData.reason);
    res.end(JSON.stringify(resData));
  } else {
    lutils.multiLog(resData.status + " : " + resData.reason);
    res.end(JSON.stringify(resData));
  }
}


/* Entry REST handler to verify the URL is up  */
app.get(CONSTANTS.XML_BASE_URI + '*', function(req, res) {
  resData = Object.assign({}, req.body);
  resData.status = CONSTANTS.APPROVED;
  resData.reason = CONSTANTS.URL_NOT_FOUND;
  resData.info = "This EndPoint receives XML POST only data at: /edi/xml/"

  lutils.multiLog("Received request : " + req.url);
  res.end(JSON.stringify(resData));
});

/* Entry XML REST handler to verify the URL is  */
app.post(CONSTANTS.XML_BASE_URI + '*',
  xmlparser({attrkey: "attr$", trim: false, explicitArray: false}),
  function(req, res) {

  processPostReq(req, res);
});


/* Entry REST handler to verify the URL is up  */
app.get(CONSTANTS.BASE_URI + '*', function(req, res) {
  resData = Object.assign({}, req.body);
  resData.status = CONSTANTS.APPROVED;
  resData.reason = CONSTANTS.URL_NOT_FOUND;
  resData.info = "This EndPoint receives JSON POST only data at: /edi/"

  lutils.multiLog("Received request : " + req.url);
  res.end(JSON.stringify(resData));
});

/* Entry JSON REST handler to verify the URL is  */
app.post(CONSTANTS.BASE_URI + '*', function(req, res) {
  processPostReq(req, res);
});


/**
 **  Utility functions
 **/
function getCurrentEnvironment() {
  lutils.multiLog("Using Build Number: " + CONSTANTS.BUILD_NUMBER);

  var jsonData = getFsFile(CONSTANTS.SERVER_CONF_FILE);
  lutils.multiLog("PreConfig Site: " + EXTERNAL_HOST_PORT);
  if (jsonData.length <= 0) {
    lutils.multiLog("No configruation data in '" + CONSTANTS.SERVER_CONF_FILE + "'.");
  } else {
    try {
      var env = JSON.parse(jsonData);

      // Override the local variables only if they are actually present/defined the config file.
      if ( (undefined !== env.DB_HOST) && (null !== env.DB_HOST) && ("" !== env.DB_HOST) ) {
        DB_HOST = env.DB_HOST;
      }
      if ( (undefined !== env.DB_USER) && (null !== env.DB_USER) && ("" !== env.DB_USER) ) {
        DB_USER = env.DB_USER;
      }
      if ( (undefined !== env.DB_PASS) && (null !== env.DB_PASS) && ("" !== env.DB_PASS) ) {
        DB_PASS = env.DB_PASS;
      }
      if ( (undefined !== env.OWNER_EMAIL_ADDR) && (null !== env.OWNER_EMAIL_ADDR) && ("" !== env.OWNER_EMAIL_ADDR) ) {
        OWNER_EMAIL_ADDR = env.OWNER_EMAIL_ADDR;
      }
      if ( (undefined !== env.EXTERNAL_PORT) && (null !== env.EXTERNAL_PORT) && ("" !== env.EXTERNAL_PORT) ) {
        EXTERNAL_PORT = env.EXTERNAL_PORT;
      }
      if ( (undefined !== env.EXTERNAL_HOST) && (null !== env.EXTERNAL_HOST) && ("" !== env.EXTERNAL_HOST) ) {
        EXTERNAL_HOST = env.EXTERNAL_HOST;
      }
      if ( (undefined !== env.EXTERNAL_PROTOCOL) && (null !== env.EXTERNAL_PROTOCOL) && ("" !== env.EXTERNAL_PROTOCOL) ) {
        EXTERNAL_PROTOCOL = env.EXTERNAL_PROTOCOL;
      }
      if ( (undefined !== env.SSL_DIR) && (null !== env.SSL_DIR) && ("" !== env.SSL_DIR) ) {
        SSL_DIR = env.SSL_DIR;
      }
      if ( (undefined !== env.DB_IMPL) && (null !== env.DB_IMPL) && ("" !== env.DB_IMPL) ) {
        DB_IMPL = env.DB_IMPL;
      }
      if ( (undefined !== env.WWW_REDIRECT) && (null !== env.WWW_REDIRECT) && ("" !== env.WWW_REDIRECT) ) {
        WWW_REDIRECT = env.WWW_REDIRECT;
      }

      // Recreate the dynamic variables.
      EXTERNAL_HOST_PORT = EXTERNAL_PROTOCOL + EXTERNAL_HOST + ':' + EXTERNAL_PORT;
    } catch (e) {

      // It isn't accessible
      lutils.multiLog("Error reading '" + CONSTANTS.SERVER_CONF_FILE + "'' json data.");
    }
  }
}

/*
 *  Methods to retrieve/store file based information.
 */
function getFsFile(dataFile) {
  //var sessionFile = "json_data/session";
  var data = '';

  try {
    fs.accessSync(dataFile, fs.F_OK);
    data = fs.readFileSync(dataFile, 'utf8');
    lutils.multiLog("We have a read config file: " + dataFile ); //+ " Cookie?: " + data);
  } catch (e) {

    // It isn't accessible
    lutils.multiLog("No pre-existing '" + dataFile + "'' file is available.");
  }

  return(data);
}

/*
app.get('*', (req, res) => {
  switch (req.url) {

    default:
      // If the route is not in our list... redirect to 404
      res.redirect("/error404");
  }
})*/