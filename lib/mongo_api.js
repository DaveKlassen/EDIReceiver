const {CONSTANTS} = require('./Constants');
const {CONFIG} = require('./Constants');

var MongoClient = require('mongodb').MongoClient;
var lutils = require('./local_utils');
var fs = require('fs');


var saveDataObject = function (ediDocument) {

  if ("mongo" === CONFIG.DB_IMPL) {

    // Save the new application to the database
    MongoClient.connect(CONFIG.WEB_APP_DB, function(err, db) {
      if (err) {
        lutils.multiLog("Connect Error - ID# " + ediDocument.id + " : " + err);
      } else {
        var collection = db.collection(CONSTANTS.SUBMITTED_EDI_COLLECTION);

        collection.insert(ediDocument, {w:1}, function(err2, result) {
          if (err2) {
            lutils.multiLog("Insert Error - ID# " + ediDocument.id  + " : " + err2);
          } else {
            lutils.multiLog("New Document: ID# " + ediDocument.id);
          }
        });
      }
    });
  } else {

    // Read the answers from file, push this new one, and save the new list back to file.
    fs.readFile(CONSTANTS.DOCUMENTS_FILE, function(err, data) {
      if (err) {
        lutils.multiLog("File Read Error - ID# " + ediDocument.id  + " : " + err);
      }
      // Parse deserialize json to object
      var submissions = JSON.parse(data);

      // Push the new record onto the list.
      submissions.push(ediDocument);

      // Save the data backout to file.
      fs.writeFile(CONSTANTS.DOCUMENTS_FILE, JSON.stringify(submissions, null, 4), function(err2) {
        if (err2) {
          lutils.multiLog("File Write Error - ID# " + ediDocument.id  + " : " + err2);
        } else {
          lutils.multiLog("New Application: ID# " + ediDocument.id);
        }
      });
    });
  }
}

module.exports = {
  saveDataObject : saveDataObject
}