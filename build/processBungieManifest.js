var http = require('http');
var fs = require('fs');
var request = require('request');
var sqlite3 = require('sqlite3').verbose();
var _ = require("underscore");
var unzip = require('unzip');
var mkdirp = require('mkdirp');
var async = require("async");
var ProgressBar = require('progress');

var progressionMeta = require('./progressionMeta.json');

var version;

function onManifestRequest(error, response, body) {
  var parsedResponse = JSON.parse(body);
  var manifestFile = fs.createWriteStream("manifest.zip");
  version = parsedResponse.Response.version;

  request
    .get('https://www.bungie.net' + parsedResponse.Response.mobileWorldContentPaths.en)
    .pipe(manifestFile)
    .on('close', onManifestDownloaded);
}

function onManifestDownloaded() {
  fs.createReadStream('manifest.zip')
    .pipe(unzip.Parse())
    .on('entry', function (entry) {
      ws = fs.createWriteStream('manifest/' + entry.path);

      ws.on('finish', function () {
        var exists = fs.existsSync('manifest/' + entry.path);

        if (exists) {
          extractDB('manifest/' + entry.path);
        }
      });

      entry.pipe(ws);
    });
}

function downloadAssetFromBungie(icon, callback) {
  if (_.isEmpty(icon)) {
    callback();
    return;
  }

  if (!fs.existsSync('.' + icon)) {
    let req = request.get('http://www.bungie.net' + icon)
      .on('error', (err) => {
        console.log(err);
        callback();
      });

    req.pause();

    req.on('response', function (resp) {
      if (resp.statusCode === 200) {
        req.pipe(fs.createWriteStream('.' + icon).on('finish', () => {
          callback();
        }));

        req.resume();
      } else {
        console.log('Error - ', icon);
        callback();
      }
    });
  } else {
    callback();
  }

  return;
}

function generateManifest(dbPath, query, manifestPath, rowFn, postFn, cbFn) {
  let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  let items = {};

  db.each(query, (err, row) => {
    if (err) { throw err; }

    var item = rowFn(err, row);
    items[item.DimHash] = item;
  }, () => {
    db.close();

    _.each(items, item => {
      delete item.DimHash;
    });

    fs.writeFile(manifestPath, JSON.stringify(items));

    if (postFn) {
      postFn(items, cbFn);
    } else {
      if (cbFn) {
        cbFn();
      }
    }
  });
}

function processItemDefinitions(err, row) {
  let item = JSON.parse(row.json, (k, v) => (k === 'equippingBlock') ? undefined : v);
  item.DimHash = item.itemHash;
  return item;
}

function postProcessItemDefinitions(items, cb) {
  let bar = new ProgressBar('  downloading items \t\t [:bar] :percent :current/:total',
    {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: _.keys(items).length
    });

  async.eachSeries(items, (item, callback) => {
    bar.tick();
    downloadAssetFromBungie(item.icon, callback);
  }, () => {
    if (cb) {
      cb();
    }
  });
}

function postProcessTalentGridDefinitions(items, cb) {
  let nodes = {};

  _.values(items).forEach(function (item) {
    item.nodes.forEach(function (node) {
      node.steps.forEach(function (step) {
        nodes[step.icon] = step; // index by icon so we get all the icons
      });
    });
  });

  let bar = new ProgressBar('  downloading talents \t\t [:bar] :percent :current/:total',
    {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: _.keys(nodes).length
    });

  async.eachSeries(nodes, (step, callback) => {
    bar.tick();
    downloadAssetFromBungie(step.icon, callback);
  }, () => {
    if (cb) {
      cb();
    }
  });
}

function processProgressionDefinitions(err, row) {
  let item = JSON.parse(row.json, (k, v) => (k === 'equippingBlock') ? undefined : v);
  item.DimHash = item.progressionHash;

  if (progressionMeta[item.progressionHash]) {
    item.label = progressionMeta[item.progressionHash].label;
    item.color = progressionMeta[item.progressionHash].color;
    item.scale = progressionMeta[item.progressionHash].scale;
    item.order = progressionMeta[item.progressionHash].order;
  }

  item.steps = item.steps.map(function (i) { return i.progressTotal; });

  delete item.progressionHash;
  delete item.hash;

  return item;
}

function postProcessProgressionDefinitions(items, cb) {
  let bar = new ProgressBar('  downloading progression \t [:bar] :percent :current/:total',
    {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: _.keys(items).length
    });

  async.eachSeries(items, (item, callback) => {
    bar.tick();
    downloadAssetFromBungie(item.icon, callback);
  }, () => {
    if (cb) {
      cb();
    }
  });
}

function processVendorDefinitions(err, row) {
  let item = JSON.parse(row.json).summary;
  item.DimHash = item.vendorHash;

  delete item.vendorHash;
  delete item.hash;

  return item;
}

function postProcessVendorDefinitions(items, cb) {
  let bar = new ProgressBar('  downloading vendors \t\t [:bar] :percent :current/:total',
    {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: _.keys(items).length
    });

  async.eachSeries(items, (item, callback) => {
    bar.tick();
    if (item.factionIcon) {
      downloadAssetFromBungie(item.factionIcon, callback);
    } else {
      downloadAssetFromBungie(item.vendorIcon, callback);
    }
  }, () => {
    if (cb) {
      cb();
    }
  });
}

function processGenericDefinitions(hashProp, err, row) {
  let item = JSON.parse(row.json);
  item.DimHash = item[hashProp];
  return item;
}

function postProcessGenericDefinitions(label, tabs, items, cb) {
  let bar = new ProgressBar('  downloading ' + label + ' ' + _.map([tabs], num => '\t'.repeat(num)) + ' [:bar] :percent :current/:total',
    {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: _.keys(items).length
    });

  async.eachOfSeries(items, (item, itemHash, callback) => {
    bar.tick();
    callback();
  }, () => {
    if (cb) {
      cb();
    }
  });
}

function processObjectiveDefinitions(err, row) {
  let item = JSON.parse(row.json, (k, v) => (k === 'equippingBlock') ? undefined : v);
  item.DimHash = item.objectiveHash;
  return item;
}

function processTalentGridDefinitions(err, row) {
  let item = JSON.parse(row.json, (k, v) => (k === 'equippingBlock') ? undefined : v);
  item.DimHash = item.gridHash;
  return item;
}

function extractDB(dbFile) {
  const steps = [
    {
      database: dbFile,
      query: 'SELECT * FROM DestinyInventoryItemDefinition',
      manifest: 'api-manifest/items.json',
      processFn: processItemDefinitions,
      postFn: postProcessItemDefinitions
    },
    {
      database: dbFile,
      query: 'SELECT * FROM DestinyStatDefinition',
      manifest: 'api-manifest/stats.json',
      processFn: processGenericDefinitions.bind(this, 'statHash'),
      postFn: postProcessGenericDefinitions.bind(this, 'stats', 2)
    },
    {
      database: dbFile,
      query: 'SELECT * FROM DestinyRecordDefinition',
      manifest: 'api-manifest/records.json',
      processFn: processGenericDefinitions.bind(this, 'hash'),
      postFn: postProcessGenericDefinitions.bind(this, 'records', 2)
    },
    {
      database: dbFile,
      query: 'SELECT * FROM DestinyObjectiveDefinition',
      manifest: 'api-manifest/objectives.json',
      processFn: processObjectiveDefinitions,
      postFn: postProcessGenericDefinitions.bind(this, 'objectives', 1)
    },
    {
      database: dbFile,
      query: 'SELECT * FROM DestinyInventoryBucketDefinition',
      manifest: 'api-manifest/buckets.json',
      processFn: processGenericDefinitions.bind(this, 'bucketHash'),
      postFn: postProcessGenericDefinitions.bind(this, 'buckets', 2)
    },
    {
      database: dbFile,
      query: 'SELECT * FROM DestinySandboxPerkDefinition',
      manifest: 'api-manifest/perks.json',
      processFn: processGenericDefinitions.bind(this, 'perkHash'),
      postFn: postProcessGenericDefinitions.bind(this, 'perks', 2)
    },
    {
      database: dbFile,
      query: 'SELECT * FROM DestinyTalentGridDefinition',
      manifest: 'api-manifest/talent.json',
      processFn: processTalentGridDefinitions,
      postFn: postProcessTalentGridDefinitions
    },
    {
      database: dbFile,
      query: 'SELECT * FROM DestinyProgressionDefinition',
      manifest: 'api-manifest/progression.json',
      processFn: processProgressionDefinitions,
      postFn: postProcessProgressionDefinitions
    },
    {
      database: dbFile,
      query: 'SELECT * FROM DestinyVendorDefinition',
      manifest: 'api-manifest/vendor.json',
      processFn: processVendorDefinitions,
      postFn: postProcessVendorDefinitions
    }
  ];

  async.eachSeries(steps, (work, callback) => {
    generateManifest(work.database, work.query, work.manifest, work.processFn, work.postFn, callback);
  }, () => {
    console.log("done.");
  });
}

mkdirp('api-manifest', function(err) { });
mkdirp('img/misc', function(err) { });
mkdirp('img/destiny_content/items', function(err) { });
mkdirp('img/destiny_content/progression', function(err) { });
mkdirp('img/destiny_content/vendor', function() { });
mkdirp('common/destiny_content/icons', function(err) { });

request({
  headers: {
    'X-API-Key': '57c5ff5864634503a0340ffdfbeb20c0'
  },
  uri: 'http://www.bungie.net/platform/Destiny/Manifest/',
  method: 'GET'
}, onManifestRequest);
