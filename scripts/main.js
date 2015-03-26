var bungie = new bungie();
var loadout = new loadout();

var _storage = [];
var _items = [];
var _sections = null;

var move, hover, loadoutBox, loadoutNew, loadoutList, amountBox, errorBox;

function hideMovePopup() {
	move.style.display = 'none';
	move.style.marginLeft = undefined;
	move.parentNode.classList.remove('popup-open');
}

function amountDialog(item, amount, confirm, cancel) {
	amountBox.style.display = 'block';

	amountBox.querySelector('.confirm').addEventListener('click', confirm)
	amountBox.querySelector('.cancel').addEventListener('click', cancel)
}

function errorDialog(message) {
	errorBox.style.display = 'block';

	errorBox.querySelector('.message').innerText = message
	errorBox.querySelector('.close').addEventListener('click', function(){
		errorBox.style.display = 'none';
	});
}

function hoverBox(item) {
	hover.style.display = 'block';

	var hoverItem = _items[item.dataset.index];
	updateName(hover, hoverItem);

	var stats = hover.querySelector('.stats');
	stats.innerHTML = '';

	for(var i = 0; i < hoverItem.stats.length; i++) {
		stats.innerHTML += ('<p>' + _statDefs[hoverItem.stats[i].statHash] + ' | ' + hoverItem.stats[i].value + '</p>')
	}

	item.appendChild(hover);

	var itemBounds = item.getBoundingClientRect();
	var bodyWidth = document.body.clientWidth;
	var requiredExtraPopupWidth = -(hover.clientWidth - itemBounds.width) * .25;

	var clippedLeft = itemBounds.left - 4 < requiredExtraPopupWidth,
	    clippedRight = bodyWidth - (itemBounds.right + 4) < requiredExtraPopupWidth;

	if (clippedLeft) {
		hover.style.marginLeft = (2 - itemBounds.left) + 'px';
	} else if (clippedRight) {
		hover.style.marginLeft = (bodyWidth - itemBounds.right - 4 - requiredExtraPopupWidth * 2) + 'px';
	} else {
		hover.style.marginLeft = (-requiredExtraPopupWidth) + 'px';
	}

}

function updateName(box, moveItem) {
	var name = box.querySelector('.item-name')
	var color = '#f5f5f5';

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

			switch(moveItem.dmg) {
				case 'arc': color = '#85c5ec'; break;
				case 'solar': color = '#f2721b';  break;
				case 'void': color = '#b184c5'; break;
			}

			name.innerHTML = '<img class="elemental ' + moveItem.dmg + '" src="assets/' + moveItem.dmg + '.png" />' +
			 	moveItem.name + ' | A: ' + attack + ' ';
		} else {
			name.innerHTML = moveItem.name;
		}
  } else {
		name.innerHTML = moveItem.name;
	}

	name.style.backgroundColor = color;
}

function moveBox(item) {

	if(move.parentNode === item && move.style.display !== 'none' ) {
		hideMovePopup();
		return;
	}

	hideMovePopup();

	if(loadoutBox.style.display === 'block') {
		loadoutBox.style.display = 'none';
	}

	move.style.display = 'block';

	var buttons = move.querySelectorAll('.move-button');
	var moveItem = _items[item.dataset.index];

	move.classList.remove('little');
	if(moveItem.notransfer)
		move.classList.add('little');

	for(var b = 0; b < buttons.length; b++) {
		buttons[b].style.display = 'block';

		if(moveItem.notransfer) {
			buttons[b].style.display = 'none';
			if(buttons[b].dataset.character === moveItem.owner &&
			((!moveItem.equipped && buttons[b].dataset.type === 'equip') ||
			 (moveItem.equipped && buttons[b].dataset.type === 'item'))) {
				buttons[b].style.display = 'block';
			}
		} else if(!moveItem.equipment) {
			buttons[b].style.display = 'none';
			if(buttons[b].dataset.character !== moveItem.owner &&
			((moveItem.equipped && buttons[b].dataset.type === 'equip') ||
			(!moveItem.equipped && buttons[b].dataset.type === 'item'))) {
				buttons[b].style.display = 'block';
			}
		} else if(buttons[b].dataset.character === moveItem.owner) {
			if(buttons[b].dataset.character === 'vault' ||
				(moveItem.equipped && buttons[b].dataset.type === 'equip') ||
				(!moveItem.equipped && buttons[b].dataset.type === 'item')) {
				buttons[b].style.display = 'none';
			}
		}
	}

	if(moveItem.sort === "Postmaster") {
		for(var b = 0; b < buttons.length; b++) {
			buttons[b].style.display = 'none';
		}
	}

	updateName(move, moveItem);

	// switch(_items[item.dataset.index].tier) {
	// 	TODO: be fancy and color the item name background the color of the item
	// }

	item.appendChild(move);

	var itemBounds = item.getBoundingClientRect();
	var bodyWidth = document.body.clientWidth;
	var requiredExtraPopupWidth = (move.clientWidth - itemBounds.width) / 2;

	var clippedLeft = itemBounds.left - 4 < requiredExtraPopupWidth,
	    clippedRight = bodyWidth - (itemBounds.right + 4) < requiredExtraPopupWidth;

	if (clippedLeft) {
		move.style.marginLeft = (2 - itemBounds.left) + 'px';
	} else if (clippedRight) {
		move.style.marginLeft = (bodyWidth - itemBounds.right - 4 - requiredExtraPopupWidth * 2) + 'px';
	} else {
		move.style.marginLeft = (-requiredExtraPopupWidth) + 'px';
	}

	item.classList.add('popup-open');
}

function dequip(item, callback, exotic) {
	// find an item to replace the current.
	for(var i in _items) {
		if(item.owner === _items[i].owner && item.name !== _items[i].name && item.type === _items[i].type && (exotic || _items[i].tier !== 'Exotic') && !_items[i].equipped) {
			// console.log('[dequip] found replacement item: ', _items[i].name)
			bungie.equip(_items[i].owner, _items[i].id, function(e, more) {
				if(more.ErrorCode > 1) {
					errorDialog('Error #' + more.ErrorCode + '\n' +  more.Message);
					return;
				}
				manageItemClick(i, {type: 'equip', character: item.owner});
				callback();
				return;
			});
			return;
		}
	}
	if(exotic) {
		errorDialog('No ' + item.type + ' found on character to switch with ' + item.name + '. move over item to swap with.');
		console.log('ERROR: no', item.type, 'found on character. eventual support.');
		return;
	}
	dequip(item, callback, true)
}

function moveItem(item, destination, amount, callback) {
	// console.log('move item', item, destination)

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
			bungie.equip(item.owner, item.id, function(e, more) {
				if(more.ErrorCode > 1) {
					errorDialog('Error #' + more.ErrorCode + '\n' +  more.Message);

					// if the error was that an exotic was already equipped
					// erroritem = find the item that caused the error
					// 	dequip(erroritem, function(){
					//    moveItem(item, destination, amount, callback);
					//  })

					return;
				}

				// find what was replaced
				for(var i in _items) {
					if(item.owner === _items[i].owner && item.type === _items[i].type && item.name !== _items[i].name && _items[i].equipped) {
						// console.log(_items[i].name)
						manageItemClick(i, {type: 'item', character: item.owner});
						_items[i].equipped = false;
						break;
					}
				}
				item.equipped = true;
				_items[i].owner = destination.character;

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
		if(more.ErrorCode > 1) {
			errorDialog('Error #' + more.ErrorCode + '\n' +  more.Message);
			return;
		}
		item.owner = toVault ? 'vault' : destination.character;

		moveItem(item, destination, amount, callback);
	});
}

function manageItemClick(item, data) {
	if(data.type === 'equip') {
		document.querySelector('.items[data-character="' + data.character + '"][data-type="equip"] .sort-' + _items[item].type).appendChild(
			document.querySelector('[data-index="' + item + '"]'));
		item.equipped = true;
	} else {
		item.equipped = false;
		// else do this insane hack
		var drop = document.querySelector('.items[data-character="' + data.character + '"][data-type="item"] .sort-' + _items[item].type);

		if(_items[item].id == 0) {
			for(var e = 0; e < drop.childNodes.length; e++) {
				current = _items[drop.childNodes[e].dataset.index];
				if(current.hash === _items[item].hash) {
					current.amount += _items[item].amount;

					var stack = drop.childNodes[e].querySelector('.stack');
					if(stack === null) {
						stack =  document.createElement('div');
						stack.className = 'stack';
						stack.innerText = '1';
						drop.childNodes[e].appendChild(stack);
					};
					stack.innerText = parseInt(stack.innerText,10) + _items[item].amount;
					var remove = document.querySelector('[data-index="' + item + '"]');
					remove.parentNode.removeChild(remove);
					return;
				}
			}
		}
		// document.querySelector('.items[data-character="' + data.character + '"][data-type="item"] .sort-' + _items[item].type).appendChild(
		drop.appendChild(document.querySelector('[data-index="' + item + '"]'));
	}
	setSortHeights();
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
	var amount = item.amount;

	// console.log(item)

	if(item.notransfer) {
		console.log('no drag and drop support for this type of item yet.')
	}

	var doMove = function(quantity) {
		moveItem(item, destination.dataset, amount, function() {
			// move the item to the right spot once done.
			if(item.amount === quantity) {
				destination.querySelector('.sort-' + item.type).appendChild(_transfer);
			} else {
				// item.owner = destination.dataset.character;
				// _items.push(item);

				// if destination location does not have the item {
					var newStack = _transfer.cloneNode(true);
					destination.querySelector('.sort-' + item.type).appendChild(newStack);
				// }
				// newStack.querySelector('.stack').innerText = quantity;
				//
				// var stack = _transfer.querySelector('.stack');
				// stack.innerText = stack.innerText - quantity;
				setSortHeights();
			}
		});
	}

	if(amount > 1) {
		showAmountDialog(item, amount, doMove);
	} else {
		doMove();
	}
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
			d.querySelector('.button-edit').addEventListener('click', function(e) {
				loadout.edit(e.target.parentNode.dataset.index);
			});
			d.querySelector('.button-delete').addEventListener('click', function(e) {
				loadout.delete(e.target.parentNode.dataset.index, function() {
					buildLoadouts();
				});
			});
			var n = d.querySelector('.button-name');
			n.innerText = sets[s].name;
			n.addEventListener('click', function(e) {
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
					hideMovePopup();
					var data = this.dataset;
					var item = _items[_transfer.dataset.index];
					moveItem(item, data, item.amount, function() {
						manageItemClick(_transfer.dataset.index, data)
					})
				});
				move.querySelector('.locations').appendChild(char);
		} else {
			var char = document.createElement('div');
			char.className = 'move-button';
			char.innerHTML = '<span>store</span>';
			char.dataset.type = 'item';
			char.dataset.character =	c;
			char.addEventListener('click', function() {
				hideMovePopup();
				var data = this.dataset;
				var item = _items[_transfer.dataset.index];
				moveItem(item, data, item.amount, function() {
					manageItemClick(_transfer.dataset.index, data)
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
				hideMovePopup();
				var data = this.dataset;
				var item = _items[_transfer.dataset.index];
				moveItem(item, data, item.amount, function() {
					manageItemClick(_transfer.dataset.index, data)
				})
			});
			char.style.backgroundImage = "url(http://bungie.net/" + _storage[c].icon + ')';
			move.querySelector('.locations').appendChild(char);
		}

		characterNode.querySelector('.loadout-button').addEventListener('click', function() {
			if(loadoutBox.style.display === 'block') {
				loadoutBox.style.display = 'none';
				return;
			}

			if(move.style.display === 'block') {
				hideMovePopup();
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
		node.querySelector('.storage').className = node.querySelector('.storage').className + ' ' + characterNode.querySelector('.class').innerText;
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
		// if(!_items[itemId].equipment) continue;

		var itemBox = document.createElement('span');

		// populate the item
		var img = document.createElement('img');
		img.draggable = true;
		img.src = 'http://bungie.net/' + _items[itemId].icon;

		if (typeof(_items[itemId].stats[0]) != "undefined" && _items[itemId].stats[0].statHash === 2391494160) {
			var lightTag = document.createElement('span');
			var light = _items[itemId].stats[0].value;
			lightTag.className = 'dmgTag';
			lightTag.innerText = light;
			itemBox.appendChild(lightTag);
		}

		if (typeof(_items[itemId].primStat) != "undefined" && _items[itemId].primStat.statHash === 368428387) {
			var dmgTag = document.createElement('span');
			var color = '';
			dmgTag.className = 'dmgTag';
			switch(_items[itemId].dmg) {
				case 'arc': color = '#85c5ec'; break;
				case 'solar': color = '#f2721b'; break;
				case 'void': color = '#b184c5'; break;
			}
			dmgTag.style.backgroundColor = color;
			dmgTag.innerText = _items[itemId].primStat.value;
			itemBox.appendChild(dmgTag);
		}

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
		itemBox.dataset.instance = _items[itemId].id;
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
		// img.addEventListener('mouseover', function() {
		// 	hoverBox(this.parentNode);
		// });

		if(_items[itemId].equipped) {
			_storage[_items[itemId].owner].elements.equipped.querySelector('.sort-' + _items[itemId].type).appendChild(itemBox);
		} else {
			_storage[_items[itemId].owner].elements.item.querySelector('.sort-' + _items[itemId].type).appendChild(itemBox);
		}
	}
}

function getItemType(type, name) {
	if(name.indexOf("Marks") != -1) {
		return null;
	}
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
	if(["Gauntlet Engram"].indexOf(type) != -1)
		return 'Gauntlets';
	if(["Titan Mark", "Hunter Cloak", "Warlock Bond"].indexOf(type) != -1)
		return 'ClassItem';
	if(["Helmet Engram", "Leg Armor Engram", "Body Armor Engram", "Armor Shader", "Emblem", "Ghost Shell", "Ship", "Vehicle", "Primary Weapon Engram", "Special Weapon Engram", "Heavy Weapon Engram", "Consumable", "Material"].indexOf(type) != -1)
		return type.split(' ')[0];
	if(["Currency"].indexOf(type) != -1)
		return 'Material';
}

function flattenInventory(data) {
	var inv = [];
	var buckets = data.buckets;

	for(var b in buckets) {
		// if(b === "Currency") continue;
		for(var s in buckets[b]) {
			var items = buckets[b][s].items;
			for(var i in items) {
				inv.push(items[i]);
				// inv[items[i].itemInstanceId+items[i].itemHash] = items[i];
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
			inv.push(items[i]);
			// inv[items[i].itemInstanceId+items[i].itemHash] = items[i];
		}
	}

	return inv;
}

function appendItems(owner, items) {
	// Loop through the flattened inventory
	for (var i in items) {

		var item        = items[i];
		var itemDef     = _itemDefs[item.itemHash];

		if(itemDef === undefined) {
			continue;
		}

		if(itemDef.type.indexOf('Bounty') != -1 || itemDef.type.indexOf('Commendation') != -1) continue;

		var itemType = getItemType(itemDef.type, itemDef.name);

		// if(item.stackSize > 1) {
		// 	// console.log(itemDef)
		// }

		if(!itemType) {
			// console.log(itemDef.name, itemDef.type)
			continue;
		}

		var dmgName = ['kinetic',,'arc','solar','void'][item.damageType];


		// for(var i = 0; i < item.stats.length; i++) {
		// 	if(item.stats[i].statHash === 1345609583) {
		// 		console.log(itemDef.name)
		// 	}
		// }
		//
		// if(item.itemInstanceId == 6917529046161258692) {
		// 	console.log(item, itemDef)
		// }

		_items.push({
			owner:      owner,
			hash:       item.itemHash,
			type:       itemType,
			tier:       itemDef.tier,
			name:       itemDef.name,
			icon:       itemDef.icon,
			notransfer: itemDef.notransfer,
			class:      itemDef.class,
			bucket:     itemDef.bucket,
			id:         item.itemInstanceId,
			equipped:   item.isEquipped,
			equipment:  item.isEquipment,
			complete:   item.isGridComplete,
			amount:     item.stackSize,
			primStat:   item.primaryStat,
			stats:      item.stats,
			dmg:        dmgName
		});
	}

	tryPageLoad();
}

function loadInventory(c) {
	bungie.inventory(c, function(i) {
		appendItems(c, flattenInventory(i.data))
	});

	// bungie.getItem(c, "6917529046161258692", function(eee) {
	// 	console.log('yeah!')
	// 	console.log(JSON.stringify(eee))
	// })
}

var loader = {
	loaded: 0,
	characters: 0
}

var a = null;
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

		a = new armor();

		var r = new report();
		r.buildHTML();

		var collectionButton = document.getElementById('collection-button');
		var collectionUrl = document.getElementById('collection-url');
		var collection = document.getElementById('collection');
		collectionButton.addEventListener('click', function() {
			if(collection.style.display === 'block') {
				collectionUrl.style.display = 'none';
				collection.style.display = 'none';
				return;
			}
			collectionUrl.value = r.de();
			collectionUrl.style.display = 'inline-block';
			collection.style.display = 'block';
		})
		collection.addEventListener('click', function(e) {
			collectionUrl.style.display = 'none';
			collection.style.display = 'none';
		});

		errorBox = document.getElementById('error-popup');
		amountBox = document.getElementById('move-amount');

		hover = document.getElementById('hover-popup');

		move = document.getElementById('move-popup');
		move.querySelector('.locations').innerHTML = '';


		var mmButton = document.getElementById('mm-button');
		var minmax = document.getElementById('minmax');
		mmButton.addEventListener('click', function() {
			if(minmax.style.display === 'block') {
				minmax.style.display = 'none';
				return;
			}
			minmax.style.display = 'block'
		})
		var mmClose = document.getElementById('mm-close');
		mmClose.addEventListener('click', function(e) {
			minmax.style.display = 'none';
		});

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
			setSortHeights();
		}
		setSortHeights();
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
				} else if(['incomplete'].indexOf(filter) >= 0) {
					special = 'incomplete';
				} else if(['complete'].indexOf(filter) >= 0) {
					special = 'complete';
				} else if(['weapon', 'weapons'].indexOf(filter) >= 0) {
					special = 'weapon';
				} else if(['armor'].indexOf(filter) >= 0) {
					special = 'armor';
				} else if(['general'].indexOf(filter) >= 0) {
					special = 'general';
				} else if(['style'].indexOf(filter) >= 0) {
					special = 'style';
				} else if(['inventory'].indexOf(filter) >= 0) {
					special = 'inventory';
				}
			}
			var _tmpItem;
			for (var i = 0; i < item.length; i++) {
				_tmpItem = _items[item[i].dataset.index]
				switch(special) {
					case 'elemental':
						if ((_tmpItem.type.toLowerCase().indexOf('primary') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('special') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('heavy') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('class') >= 0 && _tmpItem.type.toLowerCase().indexOf('classitem') < 0)
						&& _tmpItem.dmg == filter) {
							item[i].style.display = '';
							break;
						} else {
							item[i].style.display = 'none';
							break;
						}
					case 'type':	item[i].style.display = _tmpItem.type.toLowerCase() == filter ? '' : 'none'; break;
					case 'tier':	item[i].style.display = _tmpItem.tier.toLowerCase() == filter ? '' : 'none'; break;
					case 'complete':	item[i].style.display = _tmpItem.complete ? '' : 'none'; break;
					case 'incomplete':
						if ((_tmpItem.type.toLowerCase().indexOf('primary') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('special') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('heavy') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('helmet') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('gauntlets') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('chest') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('leg') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('class') >= 0 && _tmpItem.type.toLowerCase().indexOf('classitem') < 0)
						&& !_tmpItem.complete) {
							item[i].style.display = '';
							break;
						} else {
							item[i].style.display = 'none';
							break;
						}
					case 'weapon':
						if (_tmpItem.type.toLowerCase().indexOf('primary') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('special') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('heavy') >= 0) {
							item[i].style.display = '';
							break;
						} else {
							item[i].style.display = 'none';
							break;
						}
					case 'armor':
						if (_tmpItem.type.toLowerCase().indexOf('helmet') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('gauntlets') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('chest') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('leg') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('classitem') >= 0) {
							item[i].style.display = '';
							break;
						} else {
							item[i].style.display = 'none';
							break;
						}
					case 'general':
						if (_tmpItem.type.toLowerCase().indexOf('emblem') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('armor') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('vehicle') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('ship') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('ghost') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('material') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('consumable') >= 0) {
							item[i].style.display = '';
							break;
						} else {
							item[i].style.display = 'none';
							break;
						}
					case 'style':
						if (_tmpItem.type.toLowerCase().indexOf('emblem') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('armor') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('vehicle') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('ship') >= 0
						 || _tmpItem.type.toLowerCase().indexOf('ghost') >= 0) {
							item[i].style.display = '';
							break;
						} else {
							item[i].style.display = 'none';
							break;
						}
					case 'inventory':
						if (_tmpItem.type.toLowerCase().indexOf('material') >= 0
						|| _tmpItem.type.toLowerCase().indexOf('consumable') >= 0) {
							item[i].style.display = '';
							break;
						} else {
							item[i].style.display = 'none';
							break;
						}
					default: item[i].style.display = _tmpItem.name.toLowerCase().indexOf(filter) >= 0 ? '' : 'none'; break;
				}
			}

			setSortHeights();
		});
		input.addEventListener('click', function() { this.select(); });
		input.addEventListener('search', function() { this.dispatchEvent(new Event('keyup')); });

		var quickFilters = [
			'is:arc', 'is:solar', 'is:void', 'is:kinetic',
			'is:weapon', 'is:armor', 'is:style', 'is:inventory',
			'is:complete', 'is:incomplete'
		]

		quickFilters.forEach(function(quickFilter) {
			document.getElementById(quickFilter).addEventListener('click', function() { input.value = quickFilter; input.dispatchEvent(new Event('keyup')); });
		});

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

				hideMovePopup();
				loadoutBox.style.display = 'none';
				// faq.style.display = 'none';
			}
		}
		document.body.addEventListener('mousedown', hideTooltip);
		document.body.addEventListener('keyup', hideTooltip);
	}
}

function printError(message) {
	var storage = document.getElementById('storage');
	storage.innerHTML = '<span class="error">'+ message+'</span>';
}

function loadUser() {
	_storage = [];
	_items = [];
	_sections = null;

	document.getElementById('user').innerText = bungie.active().id;

	bungie.search(function(e) {
		if(e.error) {
				printError('Bungie.net user found, but was unable to find your linked ' + (bungie.active().type == 1 ? 'Xbox' : 'PSN') + ' account.');
				return;
		}

		bungie.vault(function(v) {
			if(v === undefined) {
				printError('Bungie.net user found, but was unable to find your linked ' + (bungie.active().type == 1 ? 'Xbox' : 'PSN') + ' account.');
				return;
			}
			_storage['vault'] = {
				icon: ''
			};
			appendItems('vault', flattenVault(v.data));
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
			loadInventory(avatars[c].characterBase.characterId);
		}
	});
}

bungie.user(function(u) {
	if(u.error) {
			printError('Error loading user. Make sure your account is <a href="http://www.bungie.net">linked with bungie.net and you are logged in</a>.');
			return;
	}

	var toggle = document.getElementById('system');
	chrome.storage.sync.get('system', function(res) {
		if(res.system !== undefined) {
			bungie.setsystem(res.system);
			toggle.value = res.system;
		}
		loadUser();
	});

	if(bungie.system().xbl.id !== undefined && bungie.system().psn.id !== undefined) {
		toggle.style.display = 'block';
		toggle.addEventListener('change', function() {
			bungie.setsystem(this.value);
			chrome.storage.sync.set({'system': this.value});
			loadUser();
		});
	}
});

function setSortHeights() {
	var sorts = [
		'primary',
		'special',
		'heavy',
		'helmet',
		'gauntlets',
		'chest',
		'leg',
		'classitem',
		'emblem',
		'armor',
		'vehicle',
		'ship',
		'ghost',
		'class',
		'material',
		'consumable',
		'miscellaneous'
	];

	sorts.forEach(function(sort) {
		var elements = document.querySelectorAll('.sort-' + sort),
				maxHeight;

		Array.prototype.forEach.call(elements, function(element) {
			element.style.height = 'auto';

			if (typeof maxHeight === 'undefined' || element.clientHeight > maxHeight) {
				maxHeight = element.clientHeight;
			}
		});

		Array.prototype.forEach.call(elements, function(element) {
			element.style.height = maxHeight - 6 + 'px';
		});
	});
}

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
