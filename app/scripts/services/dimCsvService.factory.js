(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimCsvService', CsvService);

  CsvService.$inject = ['$rootScope', '$q', 'dimBungieService', 'dimItemDefinitions', 'dimStoreService', '$http'];

  function CsvService($rootScope, $q, dimBungieService, dimItemDefinitions, dimStoreService, $http) {

    function downloadCsv(filename, csv){
      var filename = filename+".csv";
      var pom = document.createElement('a');
      pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      pom.setAttribute('download', filename);
      pom.click();
    };


    function buildNodeString(nodes){
      var data ="";
      for (var cntr=0; cntr<nodes.length; cntr++){
        var node = nodes[cntr];
        if (filterNode(node.name)) continue;
        data+=node.name;
        if (node.activated) data+="*";
        data+=", ";
      }
      return data;
    }
    
    function filterNode(name){
      if ("Upgrade Defense"==name) return true;
      if ("Ascend"==name) return true;
      if ("Infuse"==name) return true;
      if ("Increase Intellect"==name) return true;
      if ("Increase Discipline"==name) return true;
      if ("Increase Strength"==name) return true;
      if ("Twist Fate"==name) return true;
      if ("The Life Exotic"==name) return true;
      if ("Reforge Artifact"==name) return true;
      if ("Reforge Shell"==name) return true;
      //if ("Red Chroma"==name) return true;
      //if ("Blue Chroma"==name) return true;
      //if ("Yellow Chroma"==name) return true;
      //if ("White Chroma"==name) return true;
      if ("Deactivate Chroma"==name) return true;
      if ("Kinetic Damage"==name) return true;
      if ("Solar Damage"==name) return true;
      if ("Arc Damage"==name) return true;
      if ("Void Damage"==name) return true;
      return false;
    }

    function downloadArmor(items, nameMap){
      var header = "Name, Tier, Type, Equippable, Light, Owner, % Leveled, Locked, Equipped, " +
          "% Quality, % IntQ, % DiscQ, % StrQ, Int, Disc, Str, Perks\n";
      var data = "";

      for (var cntr = 0; cntr < items.length; cntr++) {
        var item = items[cntr];

        data+=item.name+", ";
        data+=item.tier+", ";
        data+=item.typeName+", ";
        var equippable = item.classTypeName;
        if (!equippable || "unknown"==equippable) equippable = "Any";
        else equippable = capitalizeFirstLetter(equippable);
        data+=equippable+", ";
        data+=item.primStat.value+", ";
        data+=nameMap[item.owner]+", ";
        data+=(item.percentComplete*100).toFixed(0)+", ";
        data+=item.locked+", ";
        data+=item.equipped+", ";
        data+=item.quality?item.quality.max+", ":"0, ";
        var stats = {};
        for (var cntr2=0; cntr2<item.stats.length; cntr2++){
          var stat = item.stats[cntr2];
          var pct = 0;
          if (stat.scaled && stat.scaled.min) {
            pct = Math.round(100 * stat.scaled.min / stat.split);
          }
          stats[stat.name] = {
            value: stat.value,
            pct: pct
          }
        }
        data+=stats["Intellect"]?stats["Intellect"].pct+", ":"0, ";
        data+=stats["Discipline"]?stats["Discipline"].pct+", ":"0, ";
        data+=stats["Strength"]?stats["Strength"].pct+", ":"0, ";
        data+=stats["Intellect"]?stats["Intellect"].value+", ":"0, ";
        data+=stats["Discipline"]?stats["Discipline"].value+", ":"0, ";
        data+=stats["Strength"]?stats["Strength"].value+", ":"0, ";
        data+=buildNodeString(item.talentGrid.nodes);
        data+="\n";
      }
      downloadCsv("destinyArmor", header+data);
    }

    function downloadWeapons(guns, nameMap) {
      var header = "Name, Tier, Type, Light, Dmg, Owner, % Leveled, Locked, Equipped, " +
          "AA, Impact, Range, Stability, ROF, Reload, Mag, Equip, " +
          "Nodes\n";
      var data = "";
      for (var cntr = 0; cntr < guns.length; cntr++) {
        var gun = guns[cntr];
        data+=gun.name+", ";
        data+=gun.tier+", ";
        data+=gun.typeName+", ";
        data+=gun.primStat.value+", ";
        data+=gun.dmg+", ";
        data+=nameMap[gun.owner]+", ";
        data+=(gun.percentComplete*100).toFixed(0)+", ";
        data+=gun.locked+", ";
        data+=gun.equipped+", ";
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
        for (var cntr2=0; cntr2<gun.stats.length; cntr2++) {
          var stat = gun.stats[cntr2];
          //TODO use stathash?
          if ("Aim Assist" == stat.name) stats.aa = stat.value;
          else if ("Impact" == stat.name) stats.impact = stat.value;
          else if ("Range" == stat.name) stats.range = stat.value;
          else if ("Stability" == stat.name) stats.stability = stat.value;
          else if ("Rate of File" == stat.name) stats.rof = stat.value;
          else if ("Reload" == stat.name) stats.reload = stat.value;
          else if ("Magazine" == stat.name) stats.magazine = stat.value;
          else if ("Equip Speed" == stat.name) stats.equipSpeed = stat.value;
        }
        data+=stats.aa+", ";
        data+=stats.impact+", ";
        data+=stats.range+", ";
        data+=stats.stability+", ";
        data+=stats.rof+", ";
        data+=stats.reload+", ";
        data+=stats.magazine+", ";
        data+=stats.equipSpeed+", ";
        data+=buildNodeString(gun.talentGrid.nodes);
        data+="\n";
      }
      downloadCsv("destinyWeapons", header+data);
    }

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function downloadCsvFiles(stores){
      //perhaps we're loading
      if (stores.length==0) return;
      var nameMap = {};
      var allItems = [];
      for (var cntr=0; cntr<stores.length; cntr++){
        var store = stores[cntr];
        allItems = allItems.concat(store.items);
        if (store.id=="vault"){
          nameMap[store.id] = "Vault";
        }
        else{
          var name = capitalizeFirstLetter(store.class)+"("+store.powerLevel+")"; 
          nameMap[store.id] = name;
        }
      }
      
      var weapons = [];
      var armor = [];
      for (var cntr=0; cntr<allItems.length; cntr++){
        var item = allItems[cntr];
        if (item.primStat==null) continue;
        if (item.name.indexOf("Engram")>0) continue;
        if (item.type=="Class") continue;
        if (item.sort=="Weapons")
          weapons.push(item);
        else if (item.sort=="Armor")
          armor.push(item);
        else if (item.sort=="General"){
          if (item.type=="Ghost"){
            armor.push(item);
          }
          else if (item.type=="Artifact"){
            armor.push(item);
          }
        }
      }
      downloadWeapons(weapons, nameMap);
      downloadArmor(armor, nameMap);
    }
    
    return{
      downloadCsvFiles: downloadCsvFiles
    };
  }
})();
