var bungie = new bungie();
var loadout = new loadout();

var dimDO = {
	stores: {}
};


var _storage = {};
var _items = [];
var _sections = null;

var move, loadoutBox, loadoutNew, loadoutList;

function dequip(item, callback, exotic) {
  // find an item to replace the current.
  for (var i in _items) {
    if (item.owner === _items[i].owner && item.name !== _items[i].name && item.type === _items[i].type && (exotic || _items[i].tier === 'exotic') && !_items[i].equipped) {
      // console.log('[dequip] found replacement item: ', _items[i].name)
      bungie.equip(_items[i].owner, _items[i].id, function (e) {
        if (e === 0) {
          manageItemClick(_items[i], {
            type: 'equip',
            character: item.owner
          })
        }
        callback();
        return;
      });
      return;
    }
  }
  if (exotic) {
    console.log('ERROR: no', item.type, 'found on character. eventual support.');
    return;
  }
  dequip(item, callback, true)

	//angular.element(document).scope().$apply();
}

function moveItem(item, destination, amount, callback) {
  //console.log('move item', item, destination)

  if (item.equipped) {
    dequip(item, function () {
      item.equipped = false;

			//debugger;

      moveItem(item, destination, amount, callback);
    });
angular.element(document).scope().$apply();
    return;
  }

  // if the character now owns the item we're done!
  if (item.owner === destination.character) {
    // if we're equipping an item
    if (destination.type === 'equip' && !item.equipped) {
      bungie.equip(item.owner, item.id, function (e) {
        if (e === 0) {
          // find what was replaced
          for (var i in _items) {
            if (item.owner === _items[i].owner && item.type === _items[i].type && item.name !== _items[i].name && _items[i].equipped) {
							var tItem = _.find(window.dimDO.stores[_items[i].owner].items, function(item) {
								return (item.id === _items[i].id);
							});
              manageItemClick(tItem, {
                type: 'item',
                character: item.owner
              })
              break;
            }
          }
          item.equipped = true;
          _items[i].owner = destination.character;
					//debugger;
// angular.forEach(window.dimDO.stores[_items[i].owner].items, function (itemDO, itemIndex) {
//   if (itemDO.id === item.id) {
//     debugger;
//   }
// });
        }
        callback();angular.element(document).scope().$apply();
        return;
      });
    }

    callback();
    return;

		//angular.element(document).scope().$apply();
  }

  var toVault = true;
  var char = item.owner;
  if (char === 'vault') {
    char = destination.character;
    toVault = false;
  }

  bungie.transfer(char, item.id, item.hash, amount, toVault, function (cb, more) {
    item.owner = toVault ? 'vault' : destination.character;
		//debugger;
    moveItem(item, destination, amount, callback);
  });
}
function manageItemClick(item, data) {
  if (data.type === 'equip') {
    // document.querySelector('.items[data-character="' + data.character + '"][data-type="equip"] .sort-' + item.type)
    //   .appendChild(
    //     document.querySelector('[data-instance-id="' + item.id + '"]'));
    item.equipped = true;
  } else {
    // document.querySelector('.items[data-character="' + data.character + '"] .item-' + item.sort + ' .sort-' + item.type)
    //   .appendChild(
    //     document.querySelector('[data-instance-id="' + item.id + '"]'));
    item.equipped = false;
  }

	//angular.element(document).scope().$apply();
	//debugger;
}

function manageItem(e) {
  e.preventDefault();
  _dragCounter = 0;

  var destination = e.target.parentNode.parentNode.parentNode;
  if (destination.dataset.type === undefined) {
    destination = e.target.parentNode.parentNode;
  }
  if (_transfer.parentNode == destination || destination.dataset.type === undefined) return;

  var item = _items[_transfer.dataset.index];
  var amount = 1;

  if (item.notransfer) {
    console.log('no drag and drop support for this type of item yet.')
  }

  if (item.amount > 1) {
    console.log(item.amount)
  }

  moveItem(item, destination.dataset, amount, function () {
    // move the item to the right spot once done.
    if (_items[_transfer.dataset.index] === amount) {
      destination.querySelector('.sort-' + item.type)
        .appendChild(_transfer);
    } else {
      // TODO: partial stack move, so copy the item...
      destination.querySelector('.sort-' + item.type)
        .appendChild(_transfer);
    }
  });

}

function handleDragEnter(e) {
  // this / e.target is the current hover target.
  this.classList.add('over');
}

function handleDragLeave(e) {
  this.classList.remove('over');  // this / e.target is previous target element.
}

function ignoreDrag(e) {
	e.preventDefault();
	// _dragCounter = 0;
	// return;

	// var sections = document.querySelectorAll('.items');

	// for(var s = 0; s < _sections.length; s++) {
	// // for(var s in sections ) {
	// 	_sections[s].style.border='none';
	//
	// 	var testObj = e.target;
	// 	while(testObj.className != null && testObj.className != 'items') {
	// 			testObj = testObj.parentNode;
	// 	}
	//
	// 	if(testObj.className != undefined) {
	// 		console.log(testObj.parentNode.children[0]);
	// 		// testObj.className = 'hover'
	// 		// testObj.style.height = testObj.parentNode.height;
	// 	}
	// }
}

function buildLoadouts() {
		var sets = loadout.all();
		loadoutList.innerHTML = '';

		var node = document.getElementById('loadout-template').content;
		for(var s = 0; s < sets.length; s++) {
			var d = node.cloneNode(true);

			d.querySelector('.loadout-set')
			  .dataset.index = s;

			d.querySelector('.button-edit')
			  .addEventListener('click', function (e) {
			    loadout.edit(e.target.parentNode.dataset.index);
			  });


			d.querySelector('.button-delete')
			  .addEventListener('click', function (e) {
			    loadout.delete(e.target.parentNode.dataset.index, function () {
			      buildLoadouts();
			    });
			  });

			var n = d.querySelector('.button-name');
			n.innerText = sets[s].name;
			n.parentNode.addEventListener('click', function(e) {
				// this is really sketchy
				loadout.apply(
					loadoutBox.parentNode.parentNode.parentNode.querySelector('[data-character]').dataset.character,
					e.target.dataset.index || e.target.parentNode.dataset.index);

			});

			loadoutList.appendChild(d);
		}
}


// //TODO
// //TODO
// //TODO
// //TODO

		// var equipedblock = node.querySelector('div[data-type="equip"]');
		// if(c !== 'vault') {
		// 	equipedblock.dataset.character = c;
		// 	equipedblock.parentNode.addEventListener('dragover', ignoreDrag);
		// 	equipedblock.addEventListener('drop', manageItem);
		// }
		// var itemblock = node.querySelector('div[data-type="item"]');
		// itemblock.dataset.character = c;
		// itemblock.parentNode.addEventListener('dragover', ignoreDrag);
		// itemblock.addEventListener('drop', manageItem);

// //END TODO
// //END TODO
// //END TODO


// // TODO
		// img.addEventListener('dragstart', function(e) {
		// 	_transfer = this.parentNode;
		// });
// // TODO


function getItemType(type, name) {
	if(["Pulse Rifle",  "Scout Rifle", "Hand Cannon", "Auto Rifle"].indexOf(type) != -1)
		return 'Primary';
	if(["Sniper Rifle", "Shotgun", "Fusion Rifle"].indexOf(type) != -1) {
		// detect special case items that are actually primary weapons.
		if(["Vex Mythoclast", "Universal Remote", "No Land Beyond"].indexOf(name) != -1)
			return 'Primary';
		return 'Special';
	}
	if(["Rocket Launcher", "Machine Gun"].indexOf(type) != -1)
		return 'Heavy';
	if(["Gauntlets", "Helmet", "Chest Armor", "Leg Armor"].indexOf(type) != -1)
		return type.split(' ')[0];
	if(["Titan Subclass", "Hunter Subclass", "Warlock Subclass"].indexOf(type) != -1)
		return 'Class';
	if(["Restore Defaults"].indexOf(type) != -1)
		return 'Armor';
	if(["Titan Mark", "Hunter Cloak", "Warlock Bond", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle"].indexOf(type) != -1)
		return type.split(' ')[0];
	if(["Helmet Engram", "Leg Armor Engram", "Body Armor Engram", "Gauntlet Engram", "Consumable", "Material", "Primary Weapon Engram"].indexOf(type) != -1)
		return 'Miscellaneous';
}

function sortItem(type) {
	if(["Pulse Rifle", "Sniper Rifle", "Shotgun", "Scout Rifle", "Hand Cannon", "Fusion Rifle", "Rocket Launcher", "Auto Rifle", "Machine Gun"].indexOf(type) != -1)
		return 'Weapon';
	if(["Helmet Engram", "Leg Armor Engram", "Body Armor Engram", "Gauntlet Engram", "Gauntlets", "Helmet", "Chest Armor", "Leg Armor"].indexOf(type) != -1)
		return 'Armor';
	if(["Restore Defaults", "Titan Mark", "Hunter Cloak", "Warlock Bond", "Titan Subclass", "Hunter Subclass", "Warlock Subclass", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle"].indexOf(type) != -1)
		return 'Styling';
	if(["Consumable", "Material", "Primary Weapon Engram"].indexOf(type) != -1)
		return 'Miscellaneous';
}

function flattenInventory(data) {
	var inv = [];
	var buckets = data.buckets;

	for(var b in buckets) {
		// if(b === "Currency") continue;
		for(var s in buckets[b]) {
			var items = buckets[b][s].items;
			for(var i in items) {
				inv[items[i].itemInstanceId] = items[i];
			}
		}
	}

	return inv;
}


function flattenVault(data) {
	var inv = [];
	var buckets = data.buckets;

	for (var b in buckets) {
		var items = buckets[b].items;
		for (var i in items) {
			inv[items[i].itemInstanceId] = items[i];
		}
	}

	return inv;
}

var typesOfItems = [];

function appendItems(owner, defs, items) {
	var index = 0;
	// Loop through the flattened inventory
	for (var i in items) {

		var item        = items[i];
		var itemHash    = item.itemHash;
		var itemDef     = defs[item.itemHash];

		if(itemDef.itemTypeName.indexOf('Bounty') != -1 || itemDef.itemTypeName.indexOf('Commendation') != -1) continue;

		var itemType = getItemType(itemDef.itemTypeName, itemDef.itemName);

		if(!itemType) {
			// console.log(itemDef.itemName, itemDef.itemTypeName)
			continue;
		}

		var itemSort = sortItem(itemDef.itemTypeName);
		if(item.location === 4) {
			itemSort = 'Postmaster';
		}

		var tierName = [,,'basic','uncommon','rare','legendary','exotic'][itemDef.tierType];
		var dmgName = ['kinetic',,'arc','solar','void'][item.damageType];


		_items.push({
			index: 			index,
			owner:      owner,
			hash:       itemHash,
			type:       itemType,
			sort:       itemSort,
			tier:       tierName,
			name:       itemDef.itemName.replace(/'/g, '&#39;').replace(/"/g, '&quot;'),
			icon:       itemDef.icon,
			notransfer: itemDef.nonTransferrable,
			id:         item.itemInstanceId,
			equipped:   item.isEquipped,
			equipment:  item.isEquipment,
			complete:   item.isGridComplete,
			amount:     item.stackSize,
			primStat:   item.primaryStat,
			stats:      item.stats,
			dmg:        dmgName
		});

		window.dimDO.stores[owner].items.push({
			index: 			index,
			owner:      owner,
			hash:       itemHash,
			type:       itemType,
			sort:       itemSort,
			tier:       tierName,
			name:       itemDef.itemName.replace(/'/g, '&#39;').replace(/"/g, '&quot;'),
			icon:       itemDef.icon,
			notransfer: itemDef.nonTransferrable,
			id:         item.itemInstanceId,
			equipped:   item.isEquipped,
			equipment:  item.isEquipment,
			complete:   item.isGridComplete,
			amount:     item.stackSize,
			primStat:   item.primaryStat,
			stats:      item.stats,
			dmg:        dmgName
		});

		index = index + 1;
	}

	tryPageLoad();
}

function loadInventory(c) {
	bungie.inventory(c, function(i) {
		appendItems(c, i.definitions.items, flattenInventory(i.data))
	});
}

var loader = {
	loaded: 0,
	characters: 0
}

function tryPageLoad() {
	loader.loaded++;
	if(loader.characters != 0 && loader.loaded > loader.characters) {
		loadout.ready(function() {
			loadoutBox = document.getElementById('loadout-popup');
			loadoutNew = document.getElementById('loadout-new');
			loadoutList = document.getElementById('loadout-list');
			loadoutNew.addEventListener('click', function() {
				loadout.toggle(true);
			})
			buildLoadouts();
		});

		//move = document.getElementById('move-popup');

		// var faqButton = document.getElementById('faq-button');
		// var faq = document.getElementById('faq');
		// faqButton.addEventListener('click', function() {
		// 	if(faq.style.display === 'block') {
		// 		faq.style.display = 'none';
		// 		return;
		// 	}
		// 	faq.style.display = 'block'
		// })
		// faq.addEventListener('click', function(e) {
		// 	faq.style.display = 'none';
		// 	loadout.toggle(false);
		// });


		angular.element(document).scope().$apply(); // Something changed so angular needs to digest.

		_dragCounter = 0;
		_sections = document.querySelectorAll('#storage .sections');
		// TODO
		// var sorter = document.getElementById('sort-template').content;
		// for(var i = 0; i < _sections.length; i++) {
		// 	_sections[i].appendChild(sorter.cloneNode(true));
		// }

		//TODO

		// var items = document.querySelectorAll('.items');
		// for(var s = 0; s < items.length; s++) {
		// 	items[s].parentNode.addEventListener('dragenter', function() {
    //    	_dragCounter++;
		// 		console.log(_dragCounter)
		// 		this.classList.add('over');
		// 	}, false);
		// 	items[s].parentNode.addEventListener('dragleave', function() {
		// 		_dragCounter--;
    // 		if (_dragCounter <= 0) {
		// 			_dragCounter = 0;
		// 			this.classList.remove('over');
		// 		}
		// 	}, false);
		// }

	//	buildItems();


		var input = document.getElementById('filter-text');
		input.style.display = 'inline-block';
		var item = document.querySelectorAll('.item');

		function collapseSections() {
			for (var i = 0; i < _sections.length; i++) {
				if(_sections[i].parentNode !== null)
				_sections[i].parentNode.style.display = 'none';
				for(var j = 0; j < _sections[i].children.length; j++) {
					for(var k = 0; k < _sections[i].children[j].children.length; k++) {
						if(_sections[i].children[j].children[k].style.display == '' && _sections[i].parentNode !== null) {
							_sections[i].parentNode.style.display = '';
							break;
						}
					}
				}
			}
		}
		collapseSections();
		input.addEventListener('keyup', function () {
			var filter = input.value.toLowerCase();
			var special = filter.indexOf('is:') >= 0;
			if(special) {
				filter = filter.split('is:')[1].trim();
				if(['arc', 'solar', 'void', 'kinetic'].indexOf(filter) >= 0) {
					special = 'elemental';
				} else if(['primary', 'special', 'heavy'].indexOf(filter) >= 0) {
					special = 'type';
				} else if(['basic', 'uncommon', 'rare', 'legendary', 'exotic'].indexOf(filter) >= 0) {
					special = 'tier';
				} else if(['complete'].indexOf(filter) >= 0) {
					special = 'complete';
				}
			}
			for (var i = 0; i < item.length; i++) {
				switch(special) {
					case 'elemental':	item[i].style.display = _items[item[i].dataset.index].dmg == filter ? '' : 'none'; break;
					case 'type':	item[i].style.display = _items[item[i].dataset.index].type.toLowerCase() == filter ? '' : 'none'; break;
					case 'tier':	item[i].style.display = _items[item[i].dataset.index].tier.toLowerCase() == filter ? '' : 'none'; break;
					case 'complete':	item[i].style.display = _items[item[i].dataset.index].complete === true ? '' : 'none'; break;
					default: item[i].style.display = item[i].dataset.name.toLowerCase().indexOf(filter) >= 0 ? '' : 'none'; break;
				}
			}

			collapseSections();
		});
		input.addEventListener('click', function() { this.select(); });
		input.addEventListener('search', function() { this.dispatchEvent(new Event('keyup')); });

		function hideTooltip(e) {

			// console.log( e.target, e.target.parentNode, e.target.parentNode.parentNode, e.target.className === 'loadout-set')
			if((e.type === 'keyup' && e.keyCode === 27) || (e.type === 'mousedown' &&
				!(e.target.parentNode.className === 'move-button' ||
				 	e.target.parentNode.className === 'item' ||
					e.target.className === 'loadout-button' ||
					e.target.parentNode.id === 'loadout-popup' ||
					e.target.className === 'loadout-set' ||
					e.target.parentNode.className === 'loadout-set' ||
					e.target.parentNode.id === 'loadout-list' ||
					e.target.parentNode.parentNode.id === 'loadout-list')) /*|| e.target.className !== 'loadouts'*/) {

				loadoutBox.style.display = 'none';
				// faq.style.display = 'none';
			}
		}
		document.body.addEventListener('mousedown', hideTooltip);
		document.body.addEventListener('keyup', hideTooltip);
	}
}

function loadUser() {
	_storage = [];
	_items = [];
	_sections = null;

	document.getElementById('user').innerText = bungie.gamertag();

	bungie.search(function(e) {
		if(e.error) {
				var storage = document.getElementById('storage');
				storage.innerHTML = 'Bungie.net user found, but was unable to find your linked account.';
				return;
		}

		bungie.vault(function(v) {
			_storage['vault'] = {
				icon: ''
			};

			window.dimDO.stores['vault'] = _.extend({}, _storage['vault']);
			window.dimDO.stores['vault'].id = 'vault';
			window.dimDO.stores['vault'].items = [];

			appendItems('vault', v.definitions.items, flattenVault(v.data));
		});

		var avatars = e.data.characters;
		loader.characters = avatars.length;

		function getClass(type) {
			switch(type) {
				case 0: return 'titan';
				case 1: return 'hunter';
				case 2: return 'warlock';
			}
			return 'unknown';
		}

		for(var c in avatars) {
			// move.appendChild();
			_storage[avatars[c].characterBase.characterId] = {
				icon: avatars[c].emblemPath,
				background: avatars[c].backgroundPath,
				level: avatars[c].characterLevel,
				class: getClass(avatars[c].characterBase.classType)
			}

			var charId = avatars[c].characterBase.characterId;
			window.dimDO.stores[charId] = _.extend({}, _storage[charId]);
			window.dimDO.stores[charId].id = charId;
			window.dimDO.stores[charId].items = [];

			loadInventory(avatars[c].characterBase.characterId);
		}
	});
}

bungie.user(function(u) {
	if(u.error) {
			var storage = document.getElementById('storage');
			storage.innerHTML = 'error loading user. make sure your account is linked with bungie.net and you are logged in.';
			return;
	}

	if(bungie.system().xbl.id !== undefined && bungie.system().psn.id !== undefined) {
		var toggle = document.getElementById('system');
		toggle.style.display = 'block';
		toggle.addEventListener('change', function() {
			bungie.setsystem(this.value);
			loadUser();
		});
	}

	loadUser()
});

chrome.browserAction.onClicked.addListener(function(tab) {
	var optionsUrl = chrome.extension.getURL('window.html');
	chrome.tabs.query({url: optionsUrl}, function(tabs) {
	    if (tabs.length) {
	        chrome.tabs.update(tabs[0].id, {active: true});
	    } else {
	        chrome.tabs.create({url: optionsUrl});
	    }
	});
});

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://ssl.google-analytics.com/analytics.js','ga');

ga('create', 'UA-60316581-1', 'auto');
ga('send', 'pageview');
