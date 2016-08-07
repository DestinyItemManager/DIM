#!/usr/bin/env node

// For example, to find the nodeStepHash of "The Life Exotic" nodes:

// brew install jq
// ./getBungieManifest.js
// ./manifestDig.js manifest/world_sql_content_c7ea5036ed3278fe06a7a8feae87bf94.content 'The Life Exotic' DestinyTalentGridDefinition | jq '.nodes[].steps[] | select(.nodeStepName == "The Life Exotic") | .["nodeStepHash"]' | sort | uniq

var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var target = process.argv[3];

var tables = (process.argv[4] || '').split(',');
if (tables.length == 1 && !tables[0].length) {
  tables = [];
}

var db = new sqlite3.Database(process.argv[2], sqlite3.OPEN_READONLY);

function dig(object, target, table, result) {
  if (typeof object === 'object') {
    for (var key in object) {
      if (key === target) {
        console.log(result);
      } else {
        dig(object[key], target, table, result);
      }
    }
  } else if (Array.isArray(object)) {
    object.forEach(function(val) {
      dig(val, target, table, result);
    });
  } else if (object == target) {
    console.log(result);
  }
}


db.serialize(function () {
  db.each("select name from sqlite_master where type='table'", function (err, table) {
    if (!tables.length || tables.indexOf(table.name) >= 0) {
      db.all("select * from " + table.name, function (err, result) {
        (result || []).forEach(function(entry) {
          if (entry.id === target) {
            console.log(entry.json);
          } else {
            try {
              var doc = JSON.parse(entry.json);
              dig(doc, target, table.name, entry.json);
            } catch(e) {
              console.error(e, entry.json);
            }
          }
        });
      });
    }
  });
});
