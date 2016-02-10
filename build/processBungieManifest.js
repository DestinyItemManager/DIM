#!/usr/bin/env node

var http = require('http');
var fs = require('fs');
var request = require('request');
var sqlite3 = require('sqlite3').verbose();
var _ = require("underscore");
var unzip = require('unzip');
var mkdirp = require('mkdirp');

var itemHashesJSON = require('./itemHashes.json');

var db;
var dbFile;
var version;

function processItemRow(icon, pRow, itemHash) {

  var exists = fs.existsSync('.' + icon);

  if (icon === undefined) {
    exists = true;
  }

  var contains = true;

  // if (itemHash) {
  //   contains = _.contains(itemHashesJSON.itemHashes, parseInt(itemHash, 10));
  // }

  if (contains) {
    if (!exists) {
      var imageRequest = http.get('http://www.bungie.net' + icon, function(imageResponse) {
        var imgFS = fs.createWriteStream('.' + icon);
        imageResponse.on('end', function() {
          console.log(icon);
          imgFS.end();
          pRow.next();
        });

        imageResponse.pipe(imgFS);
      });
    } else {
      pRow.next();
    }
  } else {
    pRow.next();
  }
}

function processItemRows(rows, prop) {
  var keys = _.keys(rows);
  var i = 0;

  return {
    'next': next
  };

  function next() {
    i = i + 1;

    if (i < keys.length) {
      processItemRow(rows[keys[i]][prop], this, keys[i]);
    }
  }
}

function onManifestRequest(error, response, body) {
  var parsedResponse = JSON.parse(body);
  var manifestFile = fs.createWriteStream("manifest.zip");
  version = parsedResponse.Response.version;

  request
    .get('http://www.bungie.net' + parsedResponse.Response.mobileWorldContentPaths.en)
    .pipe(manifestFile)
    .on('close', onManifestDownloaded);
}

function onManifestDownloaded() {
  fs.createReadStream('manifest.zip')
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      ws = fs.createWriteStream('manifest/' + entry.path);

      ws.on('finish', function() {
        var exists = fs.existsSync('manifest/' + entry.path);

        if (exists) {
          extractDB('manifest/' + entry.path);
        }
      });

      entry.pipe(ws);
    });
}

function extractDB(dbFile) {
  db = new sqlite3.Database(dbFile);
  var items = {};

  db.all('select * from DestinyInventoryItemDefinition', function(err, rows) {
    if (err) {
      throw err;
    }

    items = {};

    rows.forEach(function(row) {
      var item = JSON.parse(row.json);
      delete item.equippingBlock;
      items[item.itemHash] = item;
    });

    var pRow = processItemRows(items, 'icon');
    pRow.next();

    var defs = fs.createWriteStream('api-manifest/items.json');
    defs.write(JSON.stringify(items));
    defs.end();
  });

  db.all('select * from DestinyStatDefinition', function(err, rows) {
    if (err) {
      throw err;
    }

    items = {};

    rows.forEach(function(row) {
      var item = JSON.parse(row.json);
      items[item.statHash] = item;
    });

    var defs = fs.createWriteStream('api-manifest/stats.json');
    defs.write(JSON.stringify(items));
  });

  // Get objectives for progress tracking JFLAY2015
  db.all('select * from DestinyObjectiveDefinition', function(err, rows) {
    if (err) {
      throw err;
    }

    items = {};

    rows.forEach(function(row) {
      var item = JSON.parse(row.json);
      delete item.equippingBlock;
      items[item.objectiveHash] = item;
    });

    var defs = fs.createWriteStream('api-manifest/objectives.json');
    defs.write(JSON.stringify(items));
  });

  db.all('select * from DestinyInventoryBucketDefinition', function(err, rows) {
    if (err) {
      throw err;
    }

    items = {};

    rows.forEach(function(row) {
      var item = JSON.parse(row.json);
      items[item.bucketHash] = item;
    });

    var defs = fs.createWriteStream('api-manifest/buckets.json');
    defs.write(JSON.stringify(items));
  });

  db.all('select * from DestinyTalentGridDefinition', function(err, rows) {
    if (err) {
      throw err;
    }

    items = {};

    rows.forEach(function(row) {
      var item = JSON.parse(row.json);
      //delete item.equippingBlock;
      items[item.gridHash] = item;
    });

    var pRow = processItemRows(items, 'iconPath');
    pRow.next();

    var defs = fs.createWriteStream('api-manifest/talent.json');
    defs.write(JSON.stringify(items));
  });

  db.all('select * from DestinySandboxPerkDefinition', function(err, rows) {
      if (err) {
          throw err;
      }

      items = {};

      rows.forEach(function(row) {
          var item = JSON.parse(row.json);
          items[item.perkHash] = item;
      });

      var defs = fs.createWriteStream('api-manifest/perks.json');
      defs.write(JSON.stringify(items));
  });


  db.all('select * from DestinyProgressionDefinition', function(err, rows) {
      if (err) {
          throw err;
      }

      items = {};

      rows.forEach(function(row) {
          var item = JSON.parse(row.json);
          items[item.progressionHash] = item;
          delete item.progressionHash;
          delete item.hash;
          delete item.icon;
          delete item.name;
          item.steps = item.steps.map(function(i) { return i.progressTotal; });
      });

      var defs = fs.createWriteStream('api-manifest/progression.json');
      defs.write(JSON.stringify(items));
  });

  console.log("done.");
}

mkdirp('api-manifest', function(err) { });
mkdirp('img/misc', function(err) { });
mkdirp('img/destiny_content/items', function(err) { });
mkdirp('common/destiny_content/icons', function(err) { });

request({
    headers: {
      'X-API-Key': '57c5ff5864634503a0340ffdfbeb20c0'
    },
    uri: 'http://www.bungie.net/platform/Destiny/Manifest/',
    method: 'GET'
  }, onManifestRequest);
