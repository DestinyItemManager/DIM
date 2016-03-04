var MinMaxUtil = {
  getIterations: function(_class) {
    console.log('start')
    var iterations = [];

    var h = 0, hlen = _class.helmet.length,
        g = 0, glen = _class.gauntlets.length,
        c = 0, clen = _class.chest.length,
        l = 0, llen = _class.leg.length,
        ci = 0, cilen = _class.classItem.length,
        a = 0, alen = _class.artifact.length,
        gh = 0, ghlen = _class.ghost.length;


    console.log(hlen*glen*clen*llen*cilen*alen*ghlen)
    for(h=0;h < hlen; h++) {
    for(g=0;g < glen; g++) {
    for(c=0;c < clen; c++) {
    for(l=0;l < llen; l++) {
    for(ci=0;ci < cilen; ci++) {
    for(a=0;a < alen; a++) {
    for(gh=0;gh < ghlen; gh++) {
      var exotics = 0;

      exotics += _class.helmet[h].tier === 'Exotic' ? 1 : 0;
      exotics += _class.gauntlets[g].tier === 'Exotic' ? 1 : 0;
      exotics += _class.chest[c].tier === 'Exotic' ? 1 : 0;
      exotics += _class.leg[l].tier === 'Exotic' ? 1 : 0;
      exotics += _class.classItem[ci].tier === 'Exotic' ? 1 : 0;
//                  exotics += _class.artifact[a].tier === 'Exotic' ? 1 : 0;
//                  exotics += _class.ghost[gh].tier === 'Exotic' ? 1 : 0;

      if(_class.classItem[ci].tier === 'Exotic' && exotics > 2) {
          continue;
      } else if(exotics > 1) {
        continue;
      }

      var set = {
        armor: [
          {hash: _class.helmet[h].hash, name: _class.helmet[h].name, stats: _class.helmet[h].stats},
          {hash: _class.gauntlets[g].hash, name: _class.gauntlets[g].name, stats: _class.gauntlets[g].stats},
          {hash: _class.chest[c].hash, name: _class.chest[c].name, stats: _class.chest[c].stats},
          {hash: _class.leg[l].hash, name: _class.leg[l].name, stats: _class.leg[l].stats},
          {hash: _class.classItem[ci].hash, name: _class.leg[l].name, stats: _class.leg[l].stats},
          {hash: _class.artifact[a].hash, name: _class.artifact[a].name, stats: _class.artifact[a].stats},
          {hash: _class.ghost[gh].hash, name: _class.ghost[gh].name, stats: _class.ghost[gh].stats}
        ],
        stats: {
          light: 0,
          int: 0,
          dis: 0,
          str: 0
        }
      };

//
//      set.armor.forEach(function(armor) {
//        armor.stats.forEach(function(stats) {
//          switch(stats.statHash) {
//            case 2391494160: //light
//              set.stats.light += stats.value;
//              break;
//            case 144602215: //int
//              set.stats.int += stats.value;
//              break;
//            case 1735777505: //dis
//              set.stats.dis += stats.value;
//              break;
//            case 4244567218: //str
//              set.stats.str += stats.value;
//              break;
//          }
//        });
//
//        delete armor.stats;
//      });

//      if(set.stats.int > 200) {
        iterations.push(set);
//      }
    }}}}}}}
    console.log('end', iterations.length)
//    console.log('added', JSON.stringify (iterations[0]))
    return iterations;
  }
};


//
//
//function armor() {
//
//  this.addItem = function(itemDef, stats, complete) {
//    var newItem = {
//      tier:       itemDef.tier,
//      name:       itemDef.name,
//      class:      itemDef.class,
//      bucket:     itemDef.bucket,
//      stats:      stats,
//    };
//
//    console.log('adding item', newItem)
//
//    var items = _items.filter(function(item) { return item.class === newItem.class && item.stats.length; });
//    console.log(items.length)
//    items.push(newItem);
//    console.log(items.length)
//
//    _sets[newItem.class] = getIterations(getBuckets(items));
//    console.log(_sets[newItem.class])
//
//    complete();
//  }
//
//  this.filter = function(_class, stats) {
//    var iterations = _sets[_class];
//    var passed = [];
//    // var club = 600
//    for(var i in iterations) {
//      if(stats.total && iterations[i].stats.int + iterations[i].stats.dis + iterations[i].stats.str > stats.total) {
//        passed.push(iterations[i]);
//      } else if(iterations[i].stats.int > stats.int && iterations[i].stats.dis > stats.dis && iterations[i].stats.str > stats.str) {
//        passed.push(iterations[i]);
//      }
//    }
//
//    console.log('found', passed.length, 'sets out of a possible', iterations.length + '.');
//    return passed;
//  }
//}
