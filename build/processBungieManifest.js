var http = require('http');
var fs = require('fs');

var request = require('request');
var sqlite3 = require('sqlite3').verbose();
var _ = require("underscore");
var unzip = require('unzip');
var mkdirp = require('mkdirp');

var db;
var dbFile;
var version;

function processItemRow(icon, pRow) {

  var exists = fs.existsSync('.' + icon);

  if (icon === undefined) {
    exists = true;
  }

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
      processItemRow(rows[keys[i]][prop], this);
    }
  }
}

function onManifestRequest(error, response, body) {
  var parsedResponse = JSON.parse(body);
  var manifestFile = fs.createWriteStream("manifest.zip");
  version = parsedResponse.Response.version;


  var exists = fs.existsSync(version + '.txt');

  // if (!exists) {
    // var versionFile = fs.createWriteStream(version + '.txt');
    // versionFile.write(JSON.stringify(parsedResponse, null, 2));
    // versionFile.end();

    request
      .get('http://www.bungie.net' + parsedResponse.Response.mobileWorldContentPaths.en)
      .pipe(manifestFile)
      .on('close', onManifestDownloaded);
  // } else {
  //   console.log('Version already exist, \'' + version + '\'.');
  // }
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

    var defs = fs.createWriteStream('items.json');
    defs.write(JSON.stringify(items));
    defs.end();
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

    var defs = fs.createWriteStream('objectives.json');
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

    var defs = fs.createWriteStream('buckets.json');
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

    var defs = fs.createWriteStream('talent.json');
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

        var defs = fs.createWriteStream('perks.json');
        defs.write(JSON.stringify(items));
    });

    console.log("done.");
}

mkdirp('img/misc', function(err) { });
mkdirp('common/destiny_content/icons', function(err) { });

request({
    headers: {
      'X-API-Key': '57c5ff5864634503a0340ffdfbeb20c0'
    },
    uri: 'http://www.bungie.net/platform/Destiny/Manifest/',
    method: 'GET'
  }, onManifestRequest);
