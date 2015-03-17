function report() {

	// save this function to get the hash for the collection.json file
	function getHashByName(name) {
		for(var i in _itemDefs) {
			if(_itemDefs[i].name.replace('&#39;', '').toLowerCase() == name.replace('\'', '').toLowerCase()) {
				return i;
			}
		}
		console.log('error finding: ', name)
	}

	function toLower(item) { return item.name.toLowerCase(); }

	var _completed = _items.filter(function(item){ return item.complete; }).map(toLower);
	var _collected = _items.map(toLower);

	var collection = [];
	var hashArray = [];

	for(var c in _collections) {
		collection[c] = {completed:[], collected:[], missing:[]};
		for(var i in _collections[c]) {
			for(var h in _collections[c][i]) {
				var title = _collections[c][i][h].replace("'", "&#39;").toLowerCase();

				if(_completed.indexOf(title) != -1) {
					hashArray.push(2);
					collection[c].completed.push(h);
				} else if(_collected.indexOf(title) != -1) {
					hashArray.push(1);
					collection[c].collected.push(h)
				} else {
					hashArray.push(0);
					collection[c].missing.push(h);
				}
			}
		}
	}

  this.de = function() {
    return 'http://destinyexotics.com/?share=' + LZString.compressToBase64(hashArray.join(''));
  }

	this.buildHTML = function() {
		var e, has, missing;
		for(var c in collection) {
			e = document.getElementById(c);
			done = e.querySelector('.done');
			has = e.querySelector('.has');
			missing = e.querySelector('.missing');
			done.innerHTML = '';
			has.innerHTML = '';
			missing.innerHTML = '';

			for(var h in collection[c].completed) {
				done.innerHTML += ('<p>' + _itemDefs[collection[c].completed[h]].name + '</p>');
			}
			for(var h in collection[c].collected) {
				has.innerHTML += ('<p>' + _itemDefs[collection[c].collected[h]].name + '</p>');
			}
			for(var h in collection[c].missing) {
				missing.innerHTML += ('<p>' + _itemDefs[collection[c].missing[h]].name + '</p>');
			}
		}
	}
}
