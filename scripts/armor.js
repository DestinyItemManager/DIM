function armor() {
  var getBuckets = function(items) {
    return {
      helmet: items.filter(function(item) { return item.bucket === 'Helmet'; }),
      gauntlets: items.filter(function(item) { return item.bucket === 'Gauntlets'; }),
      chest: items.filter(function(item) { return item.bucket === 'Chest Armor'; }),
      leg: items.filter(function(item) { return item.bucket === 'Leg Armor'; }),
    };
  };

  var getIterations = function(_class) {
    var iterations = [];
    for(var h in _class.helmet) {
      for(var g in _class.gauntlets) {
        for(var c in _class.chest) {
          for(var l in _class.leg) {
            var exotics = 0;

            exotics += _class.helmet[h].tier === 'Exotic' ? 1 : 0;
            exotics += _class.gauntlets[g].tier === 'Exotic' ? 1 : 0;
            exotics += _class.chest[c].tier === 'Exotic' ? 1 : 0;
            exotics += _class.leg[l].tier === 'Exotic' ? 1 : 0;

            if(exotics > 1) {
              continue;
            }

            var set = {
              armor: [
                _class.helmet[h],
                _class.gauntlets[g],
                _class.chest[c],
                _class.leg[l]
              ],
              stats: {
                light: 0,
                int: 0,
                dis: 0,
                str: 0
              }
            };

            for(var a in set.armor) {
              for(var s in set.armor[a].stats) {
                switch(set.armor[a].stats[s].statHash) {
                  case 2391494160: //light
                    set.stats.light += set.armor[a].stats[s].value;
                    break;
                  case 144602215: //int
                    set.stats.int += set.armor[a].stats[s].value;
                    break;
                  case 1735777505: //dis
                    set.stats.dis += set.armor[a].stats[s].value;
                    break;
                  case 4244567218: //str
                    set.stats.str += set.armor[a].stats[s].value;
                    break;
                }
              }
            }

            iterations.push(set);
          }
        }
      }
    }
    return iterations;
  }

  var _sets = [ // titan, hunter, warlock
    getIterations(getBuckets(_items.filter(function(item) { return item.class === 0 && item.stats.length; }))),
    getIterations(getBuckets(_items.filter(function(item) { return item.class === 1 && item.stats.length; }))),
    getIterations(getBuckets(_items.filter(function(item) { return item.class === 2 && item.stats.length; })))
  ];

  this.addItem = function(itemDef, stats, complete) {
    var newItem = {
      tier:       itemDef.tier,
      name:       itemDef.name,
      class:      itemDef.class,
      bucket:     itemDef.bucket,
      stats:      stats,
    };

    console.log('adding item', newItem)

    var items = _items.filter(function(item) { return item.class === newItem.class && item.stats.length; });
    console.log(items.length)
    items.push(newItem);
    console.log(items.length)

    _sets[newItem.class] = getIterations(getBuckets(items));
    console.log(_sets[newItem.class])

    complete();
  }

  this.filter = function(_class, stats) {
    var iterations = _sets[_class];
    var passed = [];
    // var club = 600
    for(var i in iterations) {
      if(stats.total && iterations[i].stats.int + iterations[i].stats.dis + iterations[i].stats.str > stats.total) {
        passed.push(iterations[i]);
      } else if(iterations[i].stats.int > stats.int && iterations[i].stats.dis > stats.dis && iterations[i].stats.str > stats.str) {
        passed.push(iterations[i]);
      }
    }

    console.log('found', passed.length, 'sets out of a possible', iterations.length + '.');
    return passed;
  }
}
