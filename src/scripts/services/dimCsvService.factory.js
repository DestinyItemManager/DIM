import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimCsvService', CsvService);

function CsvService() {
  // step node names we'll hide, we'll leave "* Chroma" for now though, since we don't otherwise indicate Chroma
  var FILTER_NODE_NAMES = ["Upgrade Defense", "Ascend", "Infuse", "Increase Intellect", "Increase Discipline",
    "Increase Strength", "Twist Fate", "The Life Exotic", "Reforge Artifact", "Reforge Shell",
    "Deactivate Chroma", "Kinetic Damage", "Solar Damage", "Arc Damage", "Void Damage"];

  function capitalizeFirstLetter(string) {
    if (!string || string.length === 0) {
      return "";
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function downloadCsv(filename, csv) {
    filename = filename + ".csv";
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    pom.setAttribute('download', filename);
    pom.click();
  }

  function buildNodeString(nodes) {
    var data = "";
    nodes.forEach(function(node) {
      if (_.contains(FILTER_NODE_NAMES, node.name)){
        return;
      }
      data += node.name;
      if (node.activated){
        data += "*";
      }
      data += ",";
    });

    return data;
  }

  function downloadArmor(items, nameMap) {
    var header = "Name,Tag,Tier,Type,Equippable,Light,Owner,% Leveled,Locked,Equipped,Year," +
      "% Quality,% IntQ,% DiscQ,% StrQ,Int,Disc,Str,Notes,Perks\n";
    var data = "";
    items.forEach(function(item) {
      data += item.name + ",";
      data += (item.dimInfo.tag || '') + ",";
      data += item.tier + ",";
      data += item.typeName + ",";
      var equippable = item.classTypeName;
      if (!equippable || equippable === "unknown") {
        equippable = "Any";
      }
      else {
        equippable = capitalizeFirstLetter(equippable);
      }
      data += equippable + ",";
      data += item.primStat.value + ",";
      data += nameMap[item.owner] + ",";
      data += (item.percentComplete * 100).toFixed(0) + ",";
      data += item.locked + ",";
      data += item.equipped + ",";
      data += item.year + ",";
      data += item.quality ? item.quality.min + "," : "0,";
      var stats = {};
      if (item.stats) {
        item.stats.forEach(function(stat) {
          var pct = 0;
          if (stat.scaled && stat.scaled.min) {
            pct = Math.round(100 * stat.scaled.min / stat.split);
          }
          stats[stat.name] = {
            value: stat.value,
            pct: pct
          };
        });
      }
      data += stats.Intellect ? stats.Intellect.pct + "," : "0,";
      data += stats.Discipline ? stats.Discipline.pct + "," : "0,";
      data += stats.Strength ? stats.Strength.pct + "," : "0,";
      data += stats.Intellect ? stats.Intellect.value + "," : "0,";
      data += stats.Discipline ? stats.Discipline.value + "," : "0,";
      data += stats.Strength ? stats.Strength.value + "," : "0,";

      // the Notes column may need CSV escaping, as it's user-supplied input.
      if (item.dimInfo && item.dimInfo.notes) {
        // if any of these four characters are present, we have to escape it.
        if (/[",\r\n]/.test(item.dimInfo.notes)) {
          var notes = item.dimInfo.notes;
          // emit the escaped data, wrapped in double quotes.
          // any instances of " need to be changed to "" per RFC 4180.
          // everything else is fine, as long as it's in double quotes.
          data += '"' + notes.replace(/"/g, '""') + '",';
        } else {
          // no escaping required, append it as-is.
          data += item.dimInfo.notes + ",";
        }
      } else {
        // terminate the empty Notes column with a comma and continue.
        data += ",";
      }

      // if DB is out of date this can be null, can't hurt to be careful
      if (item.talentGrid) {
        data += buildNodeString(item.talentGrid.nodes);
      }
      data += "\n";
    });
    downloadCsv("destinyArmor", header + data);
  }

  function downloadWeapons(guns, nameMap) {
    var header = "Name,Tag,Tier,Type,Light,Dmg,Owner,% Leveled,Locked,Equipped,Year," +
      "AA,Impact,Range,Stability,ROF,Reload,Mag,Equip," +
      "Notes,Nodes\n";
    var data = "";
    guns.forEach(function(gun) {
      data += gun.name + ",";
      data += (gun.dimInfo.tag || '') + ",";
      data += gun.tier + ",";
      data += gun.typeName + ",";
      data += gun.primStat.value + ",";
      if (gun.dmg) {
        data += capitalizeFirstLetter(gun.dmg) + ",";
      }
      else {
        data += "Kinetic,";
      }
      data += nameMap[gun.owner] + ",";
      data += (gun.percentComplete * 100).toFixed(0) + ",";
      data += gun.locked + ",";
      data += gun.equipped + ",";
      data += gun.year + ",";
      var stats = {
        aa: 0,
        impact: 0,
        range: 0,
        stability: 0,
        rof: 0,
        reload: 0,
        magazine: 0,
        equipSpeed: 0
      };
      gun.stats.forEach(function(stat) {
        switch (stat.statHash) {
        case 1345609583: // Aim Assist
          stats.aa = stat.value;
          break;
        case 4043523819: // Impact
          stats.impact = stat.value;
          break;
        case 1240592695: // Range
          stats.range = stat.value;
          break;
        case 155624089: // Stability
          stats.stability = stat.value;
          break;
        case 4284893193: // Rate of fire
          stats.rof = stat.value;
          break;
        case 4188031367: // Reload
          stats.reload = stat.value;
          break;
        case 3871231066: // Magazine
        case 925767036: // Energy
          stats.magazine = stat.value;
          break;
        case 943549884: // Equip Speed
          stats.equipSpeed = stat.value;
          break;
        }
      });
      data += stats.aa + ",";
      data += stats.impact + ",";
      data += stats.range + ",";
      data += stats.stability + ",";
      data += stats.rof + ",";
      data += stats.reload + ",";
      data += stats.magazine + ",";
      data += stats.equipSpeed + ",";
      data += ((gun.dimInfo && gun.dimInfo.notes) || '') + ",";
      // haven't seen this null yet, but can't hurt to check since we saw it on armor above
      if (gun.talentGrid) {
        data += buildNodeString(gun.talentGrid.nodes);
      }
      data += "\n";
    });
    downloadCsv("destinyWeapons", header + data);
  }

  function downloadCsvFiles(stores, type) {
    // perhaps we're loading
    if (stores.length === 0){
      return;
    }
    var nameMap = {};
    var allItems = [];
    stores.forEach(function(store) {
      allItems = allItems.concat(store.items);
      if (store.id === "vault") {
        nameMap[store.id] = "Vault";
      }
      else {
        nameMap[store.id] = capitalizeFirstLetter(store.class) + "(" + store.powerLevel + ")";
      }
    });
    var items = [];
    allItems.forEach(function(item) {
      if (!item.primStat) {
        return;
      }
      if (type === "Weapons") {
        if (item.primStat.statHash === 368428387) {
          items.push(item);
        }
      }
      else if (type === "Armor") {
        if (item.primStat.statHash === 3897883278) {
          items.push(item);
        }
      }
    });
    if (type === "Weapons") {
      downloadWeapons(items, nameMap);
    }
    else {
      downloadArmor(items, nameMap);
    }
  }

  return {
    downloadCsvFiles: downloadCsvFiles
  };
}

