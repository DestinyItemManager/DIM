/* this will be the drag & drop functionality
//connect items with observableArrays
ko.bindingHandlers.sortableList = {
	init: function (element, valueAccessor) {
		var list = valueAccessor();
		
		$(element).sortable({
			update: function (event, ui) {
				console.log(arguments);				
				console.log(list);
			}
		});
	}
};
*/

var dialog = new (function(){
	var self = this;
	
	this.title = function(title){
		$("#myModalLabel").text(title);
		return self;
	}
	
	this.content = function(content){
		$("#myModalContent").html(content);
		return self;
	}
	
	this.show = function(cb){
		$('#basicModal').modal({}).on("hidden.bs.modal", cb);
		return self;
	}
});

var activeElement;
var moveItemPositionHandler = function(element, item){
	return function(){
		if (app.loadoutMode() == true){
			if (app.activeLoadout().ids().indexOf( item._id )>-1)
				app.activeLoadout().ids.remove(item._id);
			else {
				if ( _.where( app.activeLoadout().items(), { bucketType: item.bucketType }).length < 9){
					app.activeLoadout().ids.push(item._id);
				}
				else {
					alert("You cannot create a loadout with more than 9 items in the " + item.bucketType + " slots");
				}
			}
		}
		else {
			if (element	== activeElement){
				$( "#move-popup" ).hide();
				activeElement = null;
			}	
			else {
				activeElement = element;
				$( "#move-popup" ).show().position({
					my: "left bottom",
					at: "left top",
					collision: "none fit",
					of: element
				});
			}
		}	
	}
}

ko.bindingHandlers.moveItem = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		$(element).bind("click", moveItemPositionHandler(element, viewModel));
    }
};

var filterItemByType = function(type, isEquipped){
	return function(weapon){
		if (weapon.bucketType == type && weapon.isEquipped() == isEquipped)
			return weapon;
	}
}

var Profile = function(model){
	var self = this;
	_.each(model, function(value, key){
		self[key] = value;
	});
	
	this.icon = ko.observable(self.icon);	
	this.background = ko.observable(self.background);
	this.weapons = ko.observableArray([]);
	this.armor = ko.observableArray([]);
	this.items = ko.observableArray([]);
	this.uniqueName = self.level + " " + self.race + " " + self.gender + " " + self.classType;
	this.get = function(list, type){
		return self[list]().filter(filterItemByType(type, false));
	}
	this.itemEquipped = function(list, type){
		return ko.utils.arrayFirst(self[list](), filterItemByType(type, true));
	}
}

var Item = function(model, profile, list){
	var self = this;
	_.each(model, function(value, key){
		self[key] = value;
	});
	this.list = list;
	this.character = profile;
	this.href = "https://destinydb.com/items/" + self.id;
	this.isEquipped = ko.observable(self.isEquipped);
	this.setActiveItem = function(){
		app.activeItem(self);
	}
	this.primaryStat = self.primaryStat || "";
	this.hasPerkSearch = function(search){
		var foundPerk = false;
		if (self.perks){
			var vSearch = search.toLowerCase();
			self.perks.forEach(function(perk){
				if (perk.name.toLowerCase().indexOf(vSearch) > -1 || perk.description.toLowerCase().indexOf(vSearch) > -1)
					foundPerk = true;
			});
		}
		return foundPerk;
	}
	this.hashProgress = function(state){
		if (typeof self.progression !== "undefined"){
			/* Missing XP */
			if (state == 1 && self.progression == false){
				return true;
			}
			/* Full XP  but not maxed out */
			else if (state == 2 && self.progression == true && self.isGridComplete == false){
				return true
			}
			/* Maxed weapons (Gold Borders only) */
			else if (state == 3 && self.progression == true && self.isGridComplete == true){
				return true;
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	}
	this.isVisible = ko.computed(function(){
		var $parent = app;
		var searchFilter = $parent.searchKeyword() == '' || self.hasPerkSearch($parent.searchKeyword()) || 
			($parent.searchKeyword() !== "" && self.description.toLowerCase().indexOf($parent.searchKeyword().toLowerCase()) >-1);
		var dmgFilter = $parent.dmgFilter() == 'All' || self.damageTypeName == $parent.dmgFilter();
		var setFilter = $parent.setFilter().length == 0 || $parent.setFilter().indexOf(self.id) > -1 || $parent.setFilterFix().indexOf(self.id) > -1;
		var tierFilter = $parent.tierFilter() == 0 || $parent.tierFilter() == self.tierType;
		var progressFilter = $parent.progressFilter() == 0 || self.hashProgress($parent.progressFilter());
		var typeFilter = $parent.typeFilter() == 0 || $parent.typeFilter() == self.type;
		/*console.log( "searchFilter: " + searchFilter);
		console.log( "dmgFilter: " + dmgFilter);
		console.log( "setFilter: " + setFilter);
		console.log( "tierFilter: " + tierFilter);
		console.log( "progressFilter: " + progressFilter);
		console.log( "typeFilter: " + typeFilter);
		console.log("keyword is: " + $parent.searchKeyword());
		console.log("keyword is empty " + ($parent.searchKeyword() == ''));
		console.log("keyword has perk " + self.hasPerkSearch($parent.searchKeyword()));
		console.log("perks are " + JSON.stringify(self.perks));
		console.log("description is " + self.description);
		console.log("keyword has description " + ($parent.searchKeyword() !== "" && self.description.toLowerCase().indexOf($parent.searchKeyword().toLowerCase()) >-1));*/
		return (searchFilter) && (dmgFilter) && (setFilter) && (tierFilter) && (progressFilter) && (typeFilter);
	});
	/* helper function that unequips the current item in favor of anything else */
	this.unequip = function(callback){
		//console.log('trying to unequip too!');
		if (self.isEquipped() == true){
			//console.log("and its actually equipped");
			var otherEquipped = false, itemIndex = -1;
			var otherItems = _.where( self.character[self.list](), { bucketType: self.bucketType });
			var tryNextItem = function(){			
				var item = otherItems[++itemIndex];
				//console.log(item.description);
				/* still haven't found a match */
				if (otherEquipped == false){
					if (item != self){
						//console.log("trying to equip " + item.description);
						item.equip(self.characterId, function(isEquipped){
							//console.log("result was " + isEquipped);
							if (isEquipped == true){ otherEquipped = true; callback(); }
							else { tryNextItem(); /*console.log("tryNextItem")*/ }
						});				
					}
					else {
						tryNextItem()
						//console.log("tryNextItem")
					}
				}
			}
			tryNextItem();		
			//console.log("tryNextItem")
		}
		else {
			//console.log("but not equipped");
			callback();
		}
	}
	this.equip = function(targetCharacterId, callback){
		var sourceCharacterId = self.characterId;
		if (targetCharacterId == sourceCharacterId){
			app.bungie.equip(targetCharacterId, self._id, function(e, result){
				if (result.Message == "Ok"){
					self.isEquipped(true);
					self.character[self.list]().forEach(function(item){
						if (item != self && item.bucketType == self.bucketType){
							item.isEquipped(false);							
						}
					});
					if (self.list == "items" && self.bucketType == "Emblem"){
						self.character.icon(app.makeBackgroundUrl(self.icon, true));
						self.character.background(self.backgroundPath);
					}
					if (callback) callback(true);
				}
				else {
					if (callback) callback(false);
					else alert(result.Message);
				}
			});
		}
		else {
			self.store(targetCharacterId, function(newProfile){
				self.character = newProfile;
				self.characterId = newProfile.id;
				self.equip(targetCharacterId);
			});
		}
	}
	
	this.transfer = function(sourceCharacterId, targetCharacterId, amount, cb){		
		setTimeout(function(){
			var isVault = targetCharacterId == "Vault";			
			app.bungie.transfer(isVault ? sourceCharacterId : targetCharacterId, self._id, self.id, amount, isVault, function(e, result){
				if (result.Message == "Ok"){
					var x,y;
					_.each(app.characters(), function(character){
						if (character.id == sourceCharacterId){
							//console.log("removing reference of myself ( " + self.description + " ) in " + character.classType + " from the list of " + self.list);
							x = character;
						}
						else if (character.id == targetCharacterId){
							//console.log("adding a reference of myself ( " + self.description + " ) to this guy " + character.classType);
							y = character;
						}
					});
					if (self.bucketType == "Materials" || self.bucketType == "Consumables"){
						console.log("need to split reference of self and push it into x and y");
						var remainder = self.primaryStat - amount;
						/* at this point we can either add the item to the inventory or merge it with existing items there */
						var existingItem = _.findWhere( y[self.list](), { description: self.description });
						if (existingItem){
							y[self.list].remove(existingItem);
							existingItem.primaryStat = existingItem.primaryStat + amount;
							y[self.list].push(existingItem);
						}
						else {
							self.characterId = targetCharacterId
							self.character = y;
							self.primaryStat = amount;
							y[self.list].push(self);
						}
						/* the source item gets removed from the array, change the stack size, and add it back to the array if theres items left behind */
						x[self.list].remove(self);
						if (remainder > 0){
							self.characterId = sourceCharacterId
							self.character = x;
							self.primaryStat = remainder;
							x[self.list].push(self);
						}
					}
					else {
						self.characterId = targetCharacterId
						self.character = y;
						y[self.list].push(self);
						x[self.list].remove(self);
					}
					if (cb) cb(y,x);
				}
				else {
					alert(result.Message);
				}
			});		
		}, 1000);
	}
	
	this.store = function(targetCharacterId, callback){
		var sourceCharacterId = self.characterId, transferAmount = 1;
		var done = function(){
			$("#basicModalButton").html("Close");
			if (targetCharacterId == "Vault"){
				//console.log("from character to vault");
				self.unequip(function(){
					//console.log("calling transfer from character to vault");
					self.transfer(sourceCharacterId, "Vault", transferAmount, callback);
				});
			}
			else if (sourceCharacterId !== "Vault"){
				//console.log("from character to vault to character");
				self.unequip(function(){
					//console.log("unquipped item");
					self.transfer(sourceCharacterId, "Vault", transferAmount, function(){
						//console.log("xfered item to vault");
						self.transfer("Vault", targetCharacterId, transferAmount, callback);
					});
				});
			}
			else {
				//console.log("from vault to character");
				self.transfer("Vault", targetCharacterId, transferAmount, callback);
			}		
		}
		if (self.bucketType == "Materials" || self.bucketType == "Consumables"){
			$("#basicModalButton").html("Transfer");
			dialog.title("Transfer Materials").content("<div>Transfer Amount: <input type='text' id='materialsAmount' value='" + self.primaryStat + "'></div>").show(function(event){
				transferAmount = parseInt($("input#materialsAmount").val());
				if (!isNaN(transferAmount))	done();
				else alert("Invalid amount entered: " + transferAmount);
			});
		}
		else {
			done();
		}
	}
}

var DestinyGender = {
	"0": "Male",
	"1": "Female",
	"2": "Unknown"
};
var DestinyClass = {
    "0": "Titan",
    "1": "Hunter",
    "2": "Warlock",
    "3": "Unknown"
};
var DestinyDamageTypes = {
    "0": "None",
    "1": "Kinetic",
    "2": "Arc",
    "3": "Solar",
    "4": "Void",
    "5": "Raid"
};
var DestinyBucketTypes = {
	"1498876634": "Primary",
	"2465295065": "Special",
	"953998645": "Heavy",
	"3448274439": "Helmet",
	"3551918588": "Gauntlet",
	"14239492": "Chest",
	"20886954": "Boots",
	"2973005342": "Shader",
	"4274335291": "Emblem",
	"2025709351": "Sparrow",
	"284967655": "Ship",
	"3865314626": "Materials",
	"1469714392": "Consumables"
}
var DestinyDamageTypeColors = {
	"None": "#BBB",
	"Arc": "#85C5EC",
	"Solar": "#C48A01",
	"Void": "#B184C5"
}
var _collectionsFix = {
	"exoticWeapons": [],
	"vaultWeapons": [],
	"crotaWeapons": [],
	"ironWeapons": [1488311144,1244530683,1451703869,3244859508,996787434,3800763760,337037804,1487387187], /* 300 ATK: Fusion,Sniper,Shotgun,LMG,Rocket,Scout,Hand Cannon,Pulse */
	"exoticArmor": [],
	"vaultArmor": [],
	"crotaArmor": [],
	"ironArmor": []
}

/*
targetItem: item,
swapItem: swapItem,
description: item.description + "'s swap item is " + swapItem.description
*/
var swapTemplate = _.template('<ul class="list-group">' +	
	'<% swapArray.forEach(function(pair){ %>' +
		'<li class="list-group-item">' +
			'<div class="row">' +
				'<div class="col-lg-6">' +
					'<%= pair.description %>' +
				'</div>' +
				'<div class="col-lg-3">' +
					'<a class="item" href="<%= pair.targetItem.href %>" id="<%= pair.targetItem._id %>">' + 
						'<img class="itemImage" src="<%= pair.targetItem.icon %>">' +
					'</a>' +
				'</div>' +
				'<div class="col-lg-3">' +
					'<a class="item" href="<%= pair.swapItem && pair.swapItem.href %>" id="<%= pair.swapItem && pair.swapItem._id %>">' + 
						'<img class="itemImage" src="<%= pair.swapItem && pair.swapItem.icon %>">' +
					'</a>' +
				'</div>' +
			'</div>' +
		'</li>' +
	'<% }) %>' +
'</ul>');

var perksTemplate = _.template('<div class="destt-talent">' +
	'<% perks.forEach(function(perk){ %>' +
		'<div class="destt-talent-wrapper">' +
			'<div class="destt-talent-icon">' +
				'<img src="<%= perk.iconPath %>" width="36">' +
			'</div>' +
			'<div class="destt-talent-description">' +
				'<%= perk.description %>' +
			'</div>' +
		'</div>' +
	'<% }) %>' +
'</div>');
		
var app = new (function() {
	var self = this;

	var defaults = {
		searchKeyword: "",
		doRefresh: true,
		refreshSeconds: 300,
		tierFilter: 0,
		typeFilter: 0,
		dmgFilter: "All",
		progressFilter: 0,
		setFilter: [],
		shareView: false,
		shareUrl: "",
		showMissing: false
	};
	this.loadoutMode = ko.observable(false);
	this.activeLoadout = ko.observable(new Loadout());
	this.loadouts = ko.observableArray();
	this.searchKeyword = ko.observable(defaults.searchKeyword);
	var _doRefresh = ko.observable(defaults.doRefresh);
	this.doRefresh = ko.computed({
		read: function(){
			return _doRefresh();
		},
		write: function(newValue){
			chrome.storage.sync.set({
			  'autoRefresh': newValue
			}, function() { });
			_doRefresh(newValue);
		}
	});
	this.refreshSeconds = ko.observable(defaults.refreshSeconds);
	this.tierFilter = ko.observable(defaults.tierFilter);
	this.typeFilter = ko.observable(defaults.typeFilter);
	this.dmgFilter =  ko.observable(defaults.dmgFilter);
	this.progressFilter =  ko.observable(defaults.progressFilter);
	this.setFilter = ko.observableArray(defaults.setFilter);
	this.setFilterFix = ko.observableArray(defaults.setFilter);
	this.shareView =  ko.observable(defaults.shareView);
	this.shareUrl  = ko.observable(defaults.shareUrl);
	this.showMissing =  ko.observable(defaults.showMissing);
	
	this.activeItem = ko.observable();
	this.activeUser = ko.observable();

	this.weaponTypes = ko.observableArray();
	this.characters = ko.observableArray();
	this.orderedCharacters = ko.computed(function(){
		return self.characters().sort(function(a,b){
			return a.order - b.order;
		});
	});
	
	this.createLoadout = function(){
		self.loadoutMode(true);
		self.activeLoadout(new Loadout());
	}
	this.cancelLoadout = function(){
		self.loadoutMode(false);
		self.activeLoadout(new Loadout());
	}	
	
	this.showHelp = function(){
		$.get("help.html", function(content){ dialog.title("Help").content(content).show(); });
	}
		
	this.showAbout = function(){
		$.get("about.html", function(content){ dialog.title("About").content(content).show(); });
	}
	
	this.clearFilters = function(model, element){
		self.searchKeyword(defaults.searchKeyword);
		self.doRefresh(defaults.doRefresh);
		self.refreshSeconds(defaults.refreshSeconds);
		self.tierFilter(defaults.tierFilter);
		self.typeFilter(defaults.typeFilter);
		self.dmgFilter(defaults.dmgFilter);
		self.progressFilter(defaults.progressFilter);
		self.setFilter(defaults.setFilter);
		self.setFilterFix(defaults.setFilter);
		self.shareView(defaults.shareView);
		self.shareUrl (defaults.shareUrl);
		self.showMissing(defaults.showMissing);
		$(element.target).removeClass("active");
		return false;
	}
	this.renderCallback = function(context, content, element, callback){
		if (element) lastElement = element
		var instanceId = lastElement.id, activeItem, $content = $("<div>" + content + "</div>");
		self.characters().forEach(function(character){
		  ['weapons','armor'].forEach(function(list){
	          var item = _.findWhere( character[list](), { '_id': instanceId });
			  if (item) activeItem = item;			  	
	      });
	   	});
		if (activeItem){		
			if (activeItem.perks && $content.find(".destt-talent").length == 0){
				$content.find(".destt-info").prepend(perksTemplate({ perks: activeItem.perks }));
			}
			$content.find(".destt-primary-min").html( activeItem.primaryStat );
		}
		callback($content.html());
	}
	this.toggleShareView = function(){
		self.shareView(!self.shareView());
	}
	this.toggleShowMissing = function(){
		self.showMissing(!self.showMissing());
	}
	this.setSetFilter = function(model, event){
		var collection = $(event.target).parent().attr("value");
		self.setFilter(collection == "All" ? [] : _collections[collection]);
		self.setFilterFix(collection == "All" ? [] : _collectionsFix[collection]);
	}
	this.missingSets = ko.computed(function(){
		var missingIds = [];
		self.setFilter().concat(self.setFilterFix()).forEach(function(item){
		   var itemFound = false;
		   self.characters().forEach(function(character){
			  ['weapons','armor'].forEach(function(list){
		          if (_.pluck( character[list](), 'id') .indexOf(item) > -1) itemFound = true;
		      });
		   });
		   if (!itemFound) missingIds.push(item);
		});
		return missingIds;
	})
	
	this.activeView = ko.observable(1);
	this.setView = function(){
		self.activeView($(event.target).parent().attr("value"));
	}	
	this.setDmgFilter = function(model, event){
		self.dmgFilter($(event.target).parent().attr("value"));
	}
	this.setTierFilter = function(model, event){
		self.tierFilter($(event.target).parent().attr("value"));
	}
	this.setTypeFilter = function(model, event){
		self.typeFilter($(event.target).parent().attr("value"));
	}
	this.setProgressFilter = function(model, event){
		self.progressFilter($(event.target).parent().attr("value"));
	}
	this.toggleRefresh = function(){
		self.doRefresh(!self.doRefresh());
	}
	var processItem = function(profile, itemDefs, perkDefs){	
		return function(item){
			var info = itemDefs[item.itemHash];
			var itemObject = { 
				id: item.itemHash,
				_id: item.itemInstanceId,
				characterId: profile.id,
				damageType: item.damageType,
				damageTypeName: DestinyDamageTypes[item.damageType],
				description: info.itemName, 
				bucketType: DestinyBucketTypes[info.bucketTypeHash],
				type: info.itemSubType, //12 (Sniper)
				typeName: info.itemTypeName, //Sniper Rifle
				tierType: info.tierType, //6 (Exotic) 5 (Legendary)
				icon: self.bungie.getUrl() + info.icon,
				isEquipped: item.isEquipped,
				isGridComplete: item.isGridComplete
			};
			if (item.primaryStat)
				itemObject.primaryStat = item.primaryStat.value;
			
			if (info.itemType == 3){
				itemObject.perks = item.perks.map(function(perk){
					var p = perkDefs[perk.perkHash];
					return {
						iconPath: app.bungie.getUrl() + perk.iconPath,
						name: p.displayName,
						description: p.displayDescription
					}
				});
				if (item.progression){
					itemObject.progression = (item.progression.progressToNextLevel == 0 && item.progression.currentProgress > 0);
				}
				profile.weapons.push( new Item(itemObject,profile,'weapons') );
			}
			else if (info.itemType == 2){
				profile.armor.push( new Item(itemObject,profile,'armor') );
			}
			else if (info.bucketTypeHash in DestinyBucketTypes){
				if (itemObject.typeName == "Emblem"){
					itemObject.backgroundPath = self.makeBackgroundUrl(info.secondaryIcon);
				}
				if (itemObject.bucketType == "Materials" || itemObject.bucketType == "Consumables"){
					itemObject.primaryStat = item.stackSize;
				}
				profile.items.push( new Item(itemObject,profile,'items') );
			}
		}
	}
	
	this.addWeaponTypes = function(weapons){
		weapons.forEach(function(item){
			if (_.where(self.weaponTypes(), { type: item.type}).length == 0)
				self.weaponTypes.push({ name: item.typeName, type: item.type });
		});
	}
	
	this.makeBackgroundUrl = function(path, excludeDomain){
		return "url(" + (excludeDomain ? "" : self.bungie.getUrl()) + path + ")";
	}
		
	this.loadData = function(){
		//console.log("refreshing");
		self.characters.removeAll();
		self.bungie.user(function(user){			
			self.activeUser(user);
			if (user.error){
				return
			}
			self.bungie.search(function(e){
				var avatars = e.data.characters;
				self.bungie.vault(function(results){
					var buckets = results.data.buckets;
					var profile = new Profile({ race: "", order: 0, gender: "Tower",  classType: "Vault", id: "Vault", level: "", icon: "", background: "" });
					var def = results.definitions.items;
					var def_perks = results.definitions.perks;
					
					buckets.forEach(function(bucket){
						bucket.items.forEach(processItem(profile, def, def_perks));
					});
					self.addWeaponTypes(profile.weapons());
					self.characters.push(profile);
				});

				avatars.forEach(function(character, index){
					self.bungie.inventory(character.characterBase.characterId, function(response) {
						var profile = new Profile({
							order: index+1,
							gender: DestinyGender[character.characterBase.genderType],
							classType: DestinyClass[character.characterBase.classType],
							id: character.characterBase.characterId,
							icon: self.makeBackgroundUrl(character.emblemPath),
							background: self.makeBackgroundUrl(character.backgroundPath),
							level: character.characterLevel,
							race: e.definitions.races[character.characterBase.raceHash].raceName
						});
						var items = [];
						var def = response.definitions.items;
						var def_perks = response.definitions.perks;
						
						response.data.buckets.Equippable.forEach(function(obj){
							obj.items.forEach(function(item){
								items.push(item);
							});
						});
						response.data.buckets.Item.forEach(function(obj){
							obj.items.forEach(function(item){
								items.push(item);
							});
						});
						//Currency bucket indicates how many Vanguard/Crucible marks you have
						//Invisible bucket is for medallions and other things in the bottom left square
						
						items.forEach(processItem(profile, def, def_perks));
						self.addWeaponTypes(profile.weapons());
						self.characters.push(profile);
						if (avatars.length == (index + 1)){
							self.shareUrl(new report().de());
						}
					});
				});
			});			
		});
	}
	
	this.refreshHandler = function(){
		clearInterval(self.refreshInterval);
		if (self.doRefresh() == 1 && self.loadoutMode() == false){
			self.refreshInterval = setInterval(self.loadData, self.refreshSeconds() * 1000);
		}
	}
	
	this.init = function(){
		// until I figure out a solution for contentScriptWhen: "start" in main.js
		setTimeout(function(){		
			self.bungie = new bungie();
			self.loadData();
		}, 5000);
		self.doRefresh.subscribe(self.refreshHandler);
		self.refreshSeconds.subscribe(self.refreshHandler);
		self.loadoutMode.subscribe(self.refreshHandler);
		$(window).click(function(e){
			if (e.target.className !== "itemImage") {
				$("#move-popup").hide();
			}
		});
		ko.applyBindings(self, document.getElementById('itemsList'));
	}
});

$(document).ready(app.init);