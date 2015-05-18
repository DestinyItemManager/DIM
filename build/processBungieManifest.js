//
// var file = fs.createWriteStream("file.jpg");
// var request = http.get("http://www.bungie.net/platform/Destiny/Manifest/", function(response) {
//   response.pipe(file);
// });

var rp = require('request-promise');
var http = require('http');
var fs = require('fs');
var AdmZip = require('adm-zip');
var sqlite3 = require('sqlite3').verbose();
var _ = require("underscore");

var file = fs.createWriteStream('manifest.zip');
var options = {
  uri: 'http://www.bungie.net/platform/Destiny/Manifest/',
  method: 'GET'
};

var db;
var dbFile;

function processItemRow(row, pRow) {
  var imageRequest = http.get('http://www.bungie.net' + row.icon, function(imageResponse) {
    var imgFS = fs.createWriteStream('.' + row.icon);
    imageResponse.on('end', function() {
      console.log(row.icon);
      imgFS.end();
      pRow.next();
    });

    imageResponse.pipe(imgFS);

  });
}

function processItemRows(rows) {
  var keys = _.keys(rows);
  var i = 0;

  return {
    'next': next
  };

  function next() {
    i = i + 1;

    if (i < keys.length) {
      processItemRow(rows[keys[i]], this);
    }
  }
}

rp(options)
  .then(JSON.parse)
  .then(function(response) {
    var request = http.get('http://www.bungie.net' + response.Response.mobileWorldContentPaths.en, function(response) {

      response.on('end', function() {
        file.end();
        var zip = new AdmZip('manifest.zip');
        var zipEntries = zip.getEntries();
        zipEntries.forEach(function(zipEntry) {
          dbFile = zipEntry.name;
        });

        zip.extractAllTo('manifest');

        db = new sqlite3.Database('manifest/' + dbFile);
        var items = {};

        db.all('select * from DestinyInventoryItemDefinition', function(err, rows) {
          items = {};

          rows.forEach(function(row) {
            var item = JSON.parse(row.json);
            delete item.equippingBlock;
            items[item.itemHash] = item;
          });

          var pRow = processItemRows(items);
          pRow.next();

          var defs = fs.createWriteStream('items.json');
          defs.write(JSON.stringify(items));
        });

        db.all('select * from DestinyInventoryBucketDefinition', function(err, rows) {
          items = {};

          rows.forEach(function(row) {
            var item = JSON.parse(row.json);
            delete item.equippingBlock;
            items[item.itemHash] = item;
          });

          var defs = fs.createWriteStream('buckets.json');
          defs.write(JSON.stringify(items));
        });
      });

      response.pipe(file);
    });
  })
  .catch(console.error);
