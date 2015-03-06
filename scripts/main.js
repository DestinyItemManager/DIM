var bungie = new bungie();
var loadout = new loadout();

var _storage = [];
var _items = [];
var _sections = null;

var loadoutMode = false;

var move, loadoutBox, loadoutNew, loadoutList;

function moveBox(item) {
	if(move.parentNode === item && move.style.display === 'block') {
		move.style.display = 'none';
		return;
	}

	if(loadoutBox.style.display === 'block') {
		loadoutBox.style.display = 'none';
	}

	var buttons = move.querySelectorAll('.move-button');

	for(var b = 0; b < buttons.length; b++) {
		buttons[b].style.display = 'block';
		if(buttons[b].dataset.character === _items[item.dataset.index].owner) {
			if(buttons[b].dataset.character === 'vault' || (_items[item.dataset.index].equipped && buttons[b].dataset.type === 'equip') || (!_items[item.dataset.index].equipped && buttons[b].dataset.type === 'item')) {
				buttons[b].style.display = 'none';
			}
		}
	}

	move.style.display = 'block';

	var name = move.querySelector('.item-name')
	var moveItem = _items[item.dataset.index];

    if (moveItem.primStat) {
		if (moveItem.primStat.statHash === 3897883278) {
			// This item has defense stats, so lets pull some useful armor stats
			name.innerHTML = moveItem.name;

			// only 4 stats if there is a light element. other armor has only 3 stats.
			if(moveItem.stats.length === 4) {
				name.innerHTML += ' &#10022;' + moveItem.stats[0].value;
			}
			var stats = ['Int:', 'Dis:', 'Str:'];
			var val = 0;
			for(var s = 0; s < stats.length; s++) {
				val = moveItem.stats[s + (moveItem.stats.length === 4 ? 1 : 0)].value;
				if(val !== 0) {
					name.innerHTML += ' | ' + stats[s] + ' ' + val;
				}
			}
		} else if (moveItem.primStat.statHash === 368428387) {
			// This item has attack stats, so lets pull some useful weapon stats
			var attack = moveItem.primStat.value;
			var damage = 'Kinetic';
			var color = 'rgba(245,245,245,1)';

			switch(moveItem.dmgType) {
				case 2: damage = 'arc'; color = '#85c5ec'; break;
				case 3: damage = 'solar'; color = '#f2721b';  break;
				case 4: damage = 'void'; color = '#b184c5'; break;
			}

			name.innerHTML = '<img class="elemental ' + damage + '" src="assets/' + damage + '.png" />' +
			 	moveItem.name + ' | A: ' + attack + ' ';
			name.style.backgroundColor = color;
		} else {
			name.innerHTML = _items[item.dataset.index].name;
		}
    } else {
		name.innerHTML = _items[item.dataset.index].name;
	}

	// switch(_items[item.dataset.index].tier) {
	// 	TODO: be fancy and color the item name background the color of the item
	// }

	item.appendChild(move);

	// move.querySelector('');

	if(move.offsetLeft <= 0) {
		// console.log(move.offsetLeft)
		move.style.marginLeft = move.style.offsetLeft;
		// console.log(move.style.marginLeft)
	}
	// console.log(_items[item.dataset.index]);
}

function dequip(item, callback, exotic) {
	// find an item to replace the current.
	for(var i in _items) {
		if(item.owner === _items[i].owner && item.name !== _items[i].name && item.type === _items[i].type && (exotic || _items[i].tier !== 6) && !_items[i].equipped) {
			// console.log('[dequip] found replacement item: ', _items[i].name)
			bungie.equip(_items[i].owner, _items[i].id, function(e) {
				if(e === 0) {
					manageItemClick(_items[i], {type: 'equip', character: item.owner})
				}
				callback();
				return;
			});
			return;
		}
	}
	if(exotic) {
		console.log('ERROR: no', item.type, 'found on character. eventual support.');
		return;
	}
	dequip(item, callback, true)
}

function moveItem(item, destination, amount, callback) {
	console.log('move item', item, destination)

	if(item.equipped) {
		dequip(item, function() {
			item.equipped = false;
			moveItem(item, destination, amount, callback);
		});
		return;
	}

	// if the character now owns the item we're done!
	if(item.owner === destination.character) {
		// if we're equipping an item
		if(destination.type === 'equip' && !item.equipped) {
			bungie.equip(item.owner, item.id, function(e) {
				if(e === 0) {
					// find what was replaced
					for(var i in _items) {
						if(item.owner === _items[i].owner && item.type === _items[i].type && item.name !== _items[i].name && _items[i].equipped) {
							manageItemClick(_items[i], {type: 'item', character: item.owner})
							break;
						}
					}
					item.equipped = true;
					_items[i].owner = destination.character;
				}
				callback();
				return;
			});
		}

		callback();
		return;
	}

	var toVault = true;
	var char = item.owner;
	if(char === 'vault') {
		char = destination.character;
		toVault = false;
	}

	bungie.transfer(char, item.id, item.hash, amount, toVault, function(cb, more) {
		item.owner = toVault ? 'vault' : destination.character;

		moveItem(item, destination, amount, callback);
	});
}

function manageItemClick(item, data) {
	if(data.type === 'equip') {
		document.querySelector('.items[data-character="' + data.character + '"][data-type="equip"] .sort-' + item.type).appendChild(
			document.querySelector('[data-instance-id="' + item.id + '"]'));
		item.equipped = true;
	} else {
		document.querySelector('.items[data-character="' + data.character + '"] .item-' + item.sort + ' .sort-' + item.type	).appendChild(
			document.querySelector('[data-instance-id="' + item.id + '"]'));
		item.equipped = false;
	}
}

function manageItem(e) {
  e.preventDefault();
	_dragCounter = 0;

	var destination = e.target.parentNode.parentNode.parentNode;
	if(destination.dataset.type === undefined) {
		destination = e.target.parentNode.parentNode;
	}
	if(_transfer.parentNode == destination || destination.dataset.type === undefined) return;

	var item = _items[_transfer.dataset.index];
	var amount = 1;
	if(item.amount > 1) {
		console.log(item.amount)
	}

	moveItem(_items[_transfer.dataset.index], destination.dataset, amount, function() {
		// move the item to the right spot once done.
		if(_items[_transfer.dataset.index] === amount) {
			destination.querySelector('.sort-' + _items[_transfer.dataset.index].type).appendChild(_transfer);
		} else {
			// TODO: partial stack move, so copy the item...
			destination.querySelector('.sort-' + _items[_transfer.dataset.index].type).appendChild(_transfer);
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

			d.querySelector('.loadout-set').dataset.index = s;


			d.querySelector('.button-delete').addEventListener('click', function(e) {
				loadout.delete(e.target.parentNode.dataset.index, function() {
					buildLoadouts();
				});
			})

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

function buildStorage() {
	var storage = document.getElementById('storage');
	storage.innerHTML = '';

	for(var c in _storage) {
		var node = document.getElementById('storage-template').content.cloneNode(true);
		var characterNode = document.getElementById('character-template').content.cloneNode(true);

		var drop = document.createElement('div');

		if(c === 'vault') {
				var char = document.createElement('div');
				char.className = 'move-button';
				char.innerHTML = '<span>vault</span>';
				char.dataset.type = 'item';
				char.dataset.character =	c;
				char.addEventListener('click', function() {
					move.style.display = 'none';
					var data = this.dataset;
					var item = _items[_transfer.dataset.index];
					moveItem(item, data, 1, function() {
						manageItemClick(item, data)
					})
				});
				// char.style.b = "url(http://bungie.net/" + _storage[c].icon + ')';
				move.querySelector('.locations').appendChild(char);
		} else {
			var char = document.createElement('div');
			char.className = 'move-button';
			char.innerHTML = '<span>store</span>';
			char.dataset.type = 'item';
			char.dataset.character =	c;
			char.addEventListener('click', function() {
				move.style.display = 'none';
				var data = this.dataset;
				var item = _items[_transfer.dataset.index];
				moveItem(item, data, 1, function() {
					manageItemClick(item, data)
				})
			});
			char.style.backgroundImage = "url(http://bungie.net/" + _storage[c].icon + ')';
			move.querySelector('.locations').appendChild(char);

			char = document.createElement('div');
			char.className = 'move-button';
			char.innerHTML = '<span>equip</span>';
			char.dataset.type = 'equip';
			char.dataset.character =	c;
			char.addEventListener('click', function() {
				move.style.display = 'none';
				var data = this.dataset;
				var item = _items[_transfer.dataset.index];
				moveItem(item, data, 1, function() {
					manageItemClick(item, data)
				})
			});
			char.style.backgroundImage = "url(http://bungie.net/" + _storage[c].icon + ')';
			move.querySelector('.locations').appendChild(char);
		}

		characterNode.querySelector('.loadout-button').addEventListener('click', function() {
			// if(loadoutBox.style.display === 'block') {
			// 	loadoutBox.style.display = 'none';
			// 	return;
			// }

			if(move.style.display === 'block') {
				move.style.display = 'none';
			}

			loadoutBox.style.display = 'block';
			this.appendChild(loadoutBox);
		});

		if(c !== 'vault') {
			characterNode.querySelector('.character-box').style.backgroundImage = "url(http://bungie.net/" + _storage[c].background + ')';
			characterNode.querySelector('.emblem').style.backgroundImage = "url(http://bungie.net/" + _storage[c].icon + ')';
		}
		characterNode.querySelector('.class').innerText =
			c === 'vault' ? c : _storage[c].class;
		var level = characterNode.querySelector('.level');
		level.innerText = _storage[c].level;
		if(_storage[c].level >= 20) level.style.color = 'rgba(245, 220, 86, 1)';

		var title = node.querySelector('.character');
		title.appendChild(characterNode)

		var equipedblock = node.querySelector('div[data-type="equip"]');
		if(c !== 'vault') {
			equipedblock.dataset.character = c;
			equipedblock.parentNode.addEventListener('dragover', ignoreDrag);
			equipedblock.addEventListener('drop', manageItem);
		}
		var itemblock = node.querySelector('div[data-type="item"]');
		itemblock.dataset.character = c;
		itemblock.parentNode.addEventListener('dragover', ignoreDrag);
		itemblock.addEventListener('drop', manageItem);

		// this is what i get for using templates.
		if(c === 'vault') {
			level.style.display = 'none';
			equipedblock.parentNode.style.display = 'none';
			// itemblock.parentNode.childNodes[0].style.display = 'none';
		}

		_storage[c].elements = {
			equipped: equipedblock,
			item: itemblock
		};

		storage.appendChild(node);
	}
}

function buildItems() {

	// create the item blocks
	for(var itemId in _items) {
		if(!_items[itemId].equipment) continue;

		var itemBox = document.createElement('span');

		// populate the item
		var img = document.createElement('img');
		img.draggable = true;
		img.src = 'http://bungie.net/' + _items[itemId].icon;

		if(_items[itemId].amount > 1) {
			var amt = document.createElement('div');
			amt.className = 'stack';
			amt.innerText = _items[itemId].amount;

			// console.log(amt)
			itemBox.appendChild(amt);
		}
		itemBox.appendChild(img);

		// img.className = 'item';
		itemBox.className = 'item';
		if(_items[itemId].complete) itemBox.className += ' complete';
		itemBox.dataset.index = itemId;
		itemBox.dataset.name = _items[itemId].name;
		itemBox.dataset.instanceId = _items[itemId].id;
		img.addEventListener('dragstart', function(e) {
			_transfer = this.parentNode;
		});
		img.addEventListener('click', function() {
			if(loadout.open()) {
				loadout.add(_items[this.parentNode.dataset.index]);
				return;
			}
			_transfer = this.parentNode;
			moveBox(this.parentNode);
		});

		if(_items[itemId].equipped) {
			_storage[_items[itemId].owner].elements.equipped.querySelector('.sort-' + _items[itemId].type).appendChild(itemBox);
		} else {
			_storage[_items[itemId].owner].elements.item.querySelector('.item-' + _items[itemId].sort + ' .sort-' + _items[itemId].type).appendChild(itemBox);
		}
	}
}

function getItemType(type, name) {
	if(["Pulse Rifle",  "Scout Rifle", "Hand Cannon", "Auto Rifle"].indexOf(type) != -1)
		return 'Primary';
	if(["Sniper Rifle", "Shotgun", "Fusion Rifle"].indexOf(type) != -1) {
		// detect special case items that are actually primary weapons.
		if(["Vex Mythoclast", "Universal Remote", "No Land Beyond"].indexOf(name) != -1)
			return 'Primary';
		return 'Secondary';
	}
	if(["Rocket Launcher", "Machine Gun"].indexOf(type) != -1)
		return 'Heavy';
	if(["Gauntlets", "Helmet", "Chest Armor", "Leg Armor"].indexOf(type) != -1)
		return type.split(' ')[0];
	if(["Titan Mark", "Hunter Cloak", "Warlock Bond", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle"].indexOf(type) != -1)
		return type.split(' ')[0];
	if(["Helmet Engram", "Leg Armor Engram", "Consumable", "Body Armor Engram", "Material", "Gauntlet Engram", "Currency", "Primary Weapon Engram"].indexOf(type) != -1)
		return 'Miscellaneous';
}

function sortItem(type) {
	if(["Pulse Rifle", "Sniper Rifle", "Shotgun", "Scout Rifle", "Hand Cannon", "Fusion Rifle", "Rocket Launcher", "Auto Rifle", "Machine Gun"].indexOf(type) != -1)
		return 'Weapon';
	if(["Gauntlets", "Helmet", "Chest Armor", "Leg Armor"].indexOf(type) != -1)
		return 'Armor';
	if(["Titan Mark", "Hunter Cloak", "Warlock Bond", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle"].indexOf(type) != -1)
		return 'Styling';
	if(["Helmet Engram", "Leg Armor Engram", "Consumable", "Body Armor Engram", "Material", "Gauntlet Engram", "Currency", "Primary Weapon Engram"].indexOf(type) != -1)
		return 'Miscellaneous';
}

function flattenInventory(data) {
	var inv = [];
	var buckets = data.buckets;

	// Only look at the equippable bucket
	if (buckets.Equippable) {

		// Loop through the equippable buckets and flatten the items
		for (var b in buckets.Equippable) {

			var eBucket = buckets.Equippable[b];

			// Skip the subclass bucket - 3284755031
			if (eBucket.bucketHash === 3284755031)
				continue;

			var items = eBucket.items;

			// Store the item in the inventory array, associated to its instanceId, so we can support duplicate items
			for (var i in items) {
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
	// Loop through the flattened inventory
	for (var i in items) {

		var item        = items[i];
		var itemHash    = item.itemHash;
		var itemDef     = defs[item.itemHash];

		// Skip this item if we don't have a definition for it or it cannot be transferred
		if (itemDef === undefined || itemDef.nonTransferrable)
			continue;

		if (typesOfItems.indexOf(itemDef.itemTypeName) == -1) typesOfItems.push(itemDef.itemTypeName);

		var itemType = getItemType(itemDef.itemTypeName, itemDef.itemName);
		var itemSort = sortItem(itemDef.itemTypeName);

		_items.push({
			owner:     owner,
			hash:      itemHash,
			type:      itemType,
			sort:      itemSort,
			tier:      itemDef.tierType,
			name:      itemDef.itemName.replace(/'/g, '&#39;').replace(/"/g, '&quot;'),
			icon:      itemDef.icon,
			id:        item.itemInstanceId,
			equipped:  item.isEquipped,
			equipment: item.isEquipment,
			complete:  item.isGridComplete,
			amount:    item.stackSize,
			primStat:  item.primaryStat,
			stats:     item.stats,
			dmgType:   item.damageType
		});
	}

	tryPageLoad();
}

function loadInventory(c) {
	bungie.inventory(c, function(i) {
		appendItems(c, i.definitions.items, flattenInventory(i.data))
	});
}

function getClass(type) {
	switch(type) {
		case 0: return 'titan';
		case 1: return 'hunter';
		case 2: return 'warlock';
	}
	return 'unknown';
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
				loadoutBox.style.display = 'none';
				loadout.toggle(true);
			})
			buildLoadouts();
		});

		move = document.getElementById('move-popup');

		var faqButton = document.getElementById('faq-button');
		var faq = document.getElementById('faq');
		faqButton.addEventListener('click', function() {
			if(faq.style.display === 'block') {
				faq.style.display = 'none';
				return;
			}
			faq.style.display = 'block'
		})
		faq.addEventListener('click', function(e) {
			faq.style.display = 'none';
			loadout.toggle(false);
		});

		buildStorage();
		_dragCounter = 0;
		_sections = document.querySelectorAll('.sections');
		var sorter = document.getElementById('sort-template').content;
		for(var i = 0; i < _sections.length; i++) {
			_sections[i].appendChild(sorter.cloneNode(true));
		}

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

		buildItems();


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
					switch(filter) {
						case 'kinetic': filter = 0; break;
						case 'arc': filter = 2; break;
						case 'solar': filter = 3; break;
						case 'void': filter = 4; break;
						default: filter = 0;
					}
				} else if(['primary', 'secondary', 'heavy'].indexOf(filter) >= 0) {
					special = 'type';
				} else if(['complete'].indexOf(filter) >= 0) {
					special = 'complete';
				}
			}
			for (var i = 0; i < item.length; i++) {
				switch(special) {
					case 'elemental':	item[i].style.display = _items[item[i].dataset.index].dmgType == filter ? '' : 'none'; break;
					case 'type':	item[i].style.display = _items[item[i].dataset.index].type.toLowerCase() == filter ? '' : 'none'; break;
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

				move.style.display = 'none';
				loadoutBox.style.display = 'none';
				// faq.style.display = 'none';
			}
		}
		document.body.addEventListener('mousedown', hideTooltip);
		document.body.addEventListener('keyup', hideTooltip);
	}
}

bungie.user(function(u) {
	if(u.error) {
			var storage = document.getElementById('storage');
			storage.innerHTML = 'error loading user. make sure your account is linked with bungie.net and you are logged in.';
			return;
	}
	document.getElementById('user').innerText = bungie.gamertag();

	bungie.search(function(e) {
		if(e.error) {
				var storage = document.getElementById('storage');
				storage.innerHTML = 'bungie.net user found. but was unable to find your ' +
					'account. you may have a XBL and PSN account tied to your bungie.net' +
					' profile. This is not yet supported.';
				return;
		}

		var avatars = e.data.characters;
		loader.characters = avatars.length;

		for(var c in avatars) {
			// move.appendChild();
			_storage[avatars[c].characterBase.characterId] = {
				icon: avatars[c].emblemPath,
				background: avatars[c].backgroundPath,
				level: avatars[c].characterLevel,
				class: getClass(avatars[c].characterBase.classType)
			}
			loadInventory(avatars[c].characterBase.characterId);
		}
	});

	bungie.vault(function(v) {
		_storage['vault'] = {
			icon: ''
		};

		appendItems('vault', v.definitions.items, flattenVault(v.data));
	});
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
