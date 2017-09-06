#!/usr/bin/env node

var fs = require('fs');
var request = require('request');
var unzip = require('unzip');

function onManifestRequest(error, response, body) {
  var parsedResponse = JSON.parse(body);
  var manifestFile = fs.createWriteStream("manifest.zip");

  request
    .get('https://www.bungie.net' + parsedResponse.Response.mobileWorldContentPaths.en)
    .pipe(manifestFile)
    .on('close', onManifestDownloaded);
}

function onManifestDownloaded() {
  fs.createReadStream('manifest.zip')
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
      var ws = fs.createWriteStream('manifest2/' + entry.path);
      entry.pipe(ws);
    });
}

request({
  headers: {
    'X-API-Key': process.env.API_KEY
  },
  uri: 'http://www.bungie.net/platform/Destiny2/Manifest/',
  method: 'GET'
}, onManifestRequest);
