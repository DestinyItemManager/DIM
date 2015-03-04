function loadout() {
  // private vars
  var _box, _contents, _saveButton, _cancelButton, _name;
  var _loadouts = []

  // private methods
  function _close(confirm) {
    if(confirm) {
      // ask for confirmation before closing.
    }

    buildLoadouts();

    for(var c = 0; c < _contents.children.length; c++) {
      _contents.children[c].innerHTML = '';
    }
    _name.value = '';

    _box.style.display = 'none';
  }

  function _load(callback) {
    chrome.storage.sync.get('loadouts', function(result) {
      _loadouts = result.loadouts || [];
      callback();
    });
  }

  function _sync(callback) {
    chrome.storage.sync.set({
      'loadouts': _loadouts
    }, function() {
      console.log('saved!');
      callback();
    });
  }

  function _save() {
    if(_name.value.length === 0) {
      _name.style.border = '1px solid red';
      return;
    }

    var selected = _contents.querySelectorAll('.item');
    if(selected.length === 0) return;

    var ids = [];
    for(var i = 0; i < selected.length; i++) {
      ids.push(_items[selected[i].dataset.index].id);
    }

    // if loadout already exists, update
    for(var l = 0; l < _loadouts.length; l++) {
      if(_loadouts[l].name === _name.value) {
        _loadouts[l].items = ids;
        return;
      }
    }

    // otherwise create new layout
    _loadouts.push({
      name: _name.value,
      items: ids
    });

    _sync();
    _close(false)
  }
  function getItem(id) {
  	for(var i in _items) {
  		if(_items[i].id === id) return _items[i];
  	}
  	return -1;
  }

  // privileged methods
  this.ready = function(callback) {
    _box = document.getElementById('loadout-create');

    _contents = document.getElementById('loadout-contents');

    _saveButton = document.getElementById('loadout-save');
    _saveButton.addEventListener('click', _save)
    _cancelButton = document.getElementById('loadout-cancel');
    _cancelButton.addEventListener('click', function() { _close(true) });

    _name = document.getElementById('loadout-name');

    _load(callback);
  }
  this.add = function(item) {
    if(item.type === 'Miscellaneous') return;

    var node = document.querySelector('[data-name="' + item.name + '"]').cloneNode(true);
    node.querySelector('img').draggable=false;

    var slot = _contents.querySelector('.loadout-' + item.type);
    slot.innerHTML = '';
    slot.appendChild(node);
  }
  this.delete = function(id, callback) {
        _loadouts.splice(id,1);
        _sync(callback);

  }
  this.apply = function(character, loadout) {
    if(character === 'vault') return;
  	var destination = {type: "equip", character: character};

    (function processItem(i) {
      if(i-- <= 0) return;
      var item = getItem(_loadouts[loadout].items[i]);
      // console.log(i, item.name)
      if(destination.character === item.owner && item.equipped) {
        processItem(i);
        return;
      }
      moveItem(item, destination, 1, function() {
        manageItemClick(item, {type:'equip', character: character});

        setTimeout(function () { processItem(i); }, 1000);
      });
    })(_loadouts[loadout].items.length);
  }
  this.all = function() {
    return _loadouts;
  }
  this.toggle = function(open) {
      _box.style.display = open ? 'block' : 'none';

      if(open) _name.focus();
  }
  this.open = function() {
    return _box.style.display === 'block';
  }
}
