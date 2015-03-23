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
var activeElement;
var moveItemPositionHandler = function(element){
	return function(){
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

ko.bindingHandlers.moveItem = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here
		$(element).bind("click", moveItemPositionHandler(element));
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // This will be called once when the binding is first applied to an element,
        // and again whenever any observables/computeds that are accessed change
        // Update the DOM element based on the supplied values here.
		//$(element).bind("click", moveItemPositionHandler(element));
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
	
	this.get = function(list, type){
		return self[list]().filter(filterItemByType(type, false));
	}
	this.itemEquipped = function(list, type){
		return ko.utils.arrayFirst(self[list](), filterItemByType(type, true));
	}
}

var Item = function(model, profile){
	var self = this;
	_.each(model, function(value, key){
		self[key] = value;
	});
	this.character = profile;
	this.href = "https://destinydb.com/items/" + self.id;
	this.isEquipped = ko.observable(self.isEquipped);
	this.moveItem = function(list, item){
		self.list = list;
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
	this.isVisible = ko.computed(function(){
		var $parent = app;
		var searchFilter = $parent.searchKeyword() == '' || self.hasPerkSearch($parent.searchKeyword()) || 
			($parent.searchKeyword() !== "" && self.description.toLowerCase().indexOf($parent.searchKeyword().toLowerCase()) >-1);
		var dmgFilter = $parent.dmgFilter() == 'All' || self.damageTypeName == $parent.dmgFilter();
		var setFilter = $parent.setFilter().length == 0 || $parent.setFilter().indexOf(self.id) > -1;
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
	this.equip = function(list, targetCharacterId){
		var sourceCharacterId = self.characterId;
		if (targetCharacterId == sourceCharacterId){
			app.bungie.equip(targetCharacterId, self._id, function(e, result){
				if (result.Message == "Ok"){
					self.isEquipped(true);
					self.character[list]().forEach(function(item){
						if (item != self && item.bucketType == self.bucketType){
							item.isEquipped(false);							
						}
					});
					if (list == "items" && self.bucketType == "Emblem"){
						/*console.log("old icon path: " + self.character.icon());
						console.log("new icon path " + app.makeBackgroundUrl(self.icon, true));
						console.log("old bg path: " + self.character.background());
						console.log("new bg path " + self.backgroundPath);*/
						self.character.icon(app.makeBackgroundUrl(self.icon, true));
						self.character.background(self.backgroundPath);
					}
				}
				else {
					alert(result.Message);
				}
			});
		}
		else {
			self.store(list, targetCharacterId, function(newProfile){
				self.character = newProfile;
				self.equip(list, targetCharacterId);
				window.item = self;
			});
		}
	}
	this.transfer = function(list, sourceCharacterId, targetCharacterId, cb){
		var isVault = targetCharacterId == "Vault";
		app.bungie.transfer(isVault ? sourceCharacterId : targetCharacterId, self._id, self.id, 1, isVault, function(e, result){
			if (result.Message == "Ok"){
				ko.utils.arrayFirst(app.characters(), function(character){
					if (character.id == sourceCharacterId){
						character[list].remove(self);
					}
					else if (character.id == targetCharacterId){
						self.characterId = targetCharacterId;
						character[list].push(self);
						if (cb) cb(character);
					}
				});				
			}
			else {
				alert(result.Message);
			}
		});
	}
	this.store = function(list, targetCharacterId, callback){
		var sourceCharacterId = self.characterId;
		if (targetCharacterId == "Vault"){
			//console.log("from charcter to vault");
			self.transfer(list, sourceCharacterId, "Vault", callback);
		}
		else if (sourceCharacterId !== "Vault"){
			//console.log("from character to vault to character");
			self.transfer(list, sourceCharacterId, "Vault", function(){
				self.transfer(list, "Vault", targetCharacterId, callback);
			});
		}
		else {
			//console.log("from vault to character");
			self.transfer(list, "Vault", targetCharacterId, callback);
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
	"284967655": "Ship"
}
var DestinyDamageTypeColors = {
	"None": "#BBB",
	"Arc": "#85C5EC",
	"Solar": "#C48A01",
	"Void": "#B184C5"
}
var perksTemplate = _.template('<div class="destt-talent">' +
	'<% perks.forEach(function(perk){ %>' +
		'<div class="destt-talent-wrapper">' +
			'<div class="destt-talent-icon">' +
				'<img src="https://desimg.zamimg.com/static/image/icons/gamedata/game-backgrounds/medium/<%= perk.hash %>.png">' +
			'</div>' +
			'<div class="destt-talent-description">' +
				'<%= perk.description %>' +
			'</div>' +
		'</div>' +
	'<% }) %>' +
'</div>')
		
var app = new (function() {
	var self = this;

	this.activeItem = ko.observable();
	this.activeUser = ko.observable();

	this.weaponTypes = ko.observableArray();
	this.characters = ko.observableArray();
	this.orderedCharacters = ko.computed(function(){
		return self.characters().sort(function(a,b){
			return a.order - b.order;
		});
	});
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
	this.searchKeyword = ko.observable("");
	this.doRefresh = ko.observable(true);
	this.refreshSeconds = ko.observable(300);
	this.tierFilter = ko.observable(0);
	this.typeFilter = ko.observable(0);
	this.dmgFilter =  ko.observable("All");
	this.progressFilter =  ko.observable(0);
	this.setFilter = ko.observableArray();
	this.shareView =  ko.observable(false);
	this.shareUrl  = ko.observable("");
	this.showMissing =  ko.observable(false);
	this.toggleShareView = function(){
		self.shareView(!self.shareView());
	}
	this.toggleShowMissing = function(){
		self.showMissing(!self.showMissing());
	}
	this.setSetFilter = function(model, event){
		var collection = $(event.target).parent().attr("value");
		self.setFilter(collection == "All" ? [] : _collections[collection]);
	}
	this.missingSets = ko.computed(function(){
		var missingIds = [];
		self.setFilter().forEach(function(item){
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
						hash: perk.iconPath.split("/")[4].split(".")[0],
						name: p.displayName,
						description: p.displayDescription
					}
				});
				itemObject.progression = (item.progression.progressToNextLevel == 0 && item.progression.currentProgress > 0);
				profile.weapons.push( new Item(itemObject,profile) );
			}
			else if (info.itemType == 2){
				profile.armor.push( new Item(itemObject,profile) );
			}
			else if (info.bucketTypeHash in DestinyBucketTypes){
				if (itemObject.typeName == "Emblem"){
					itemObject.backgroundPath = self.makeBackgroundUrl(info.secondaryIcon);
				}
				profile.items.push( new Item(itemObject,profile) );
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
					var profile = new Profile({ order: 0, gender: "Tower",  classType: "Vault", id: "Vault", level: "", icon: "", background: "" });
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
							level: character.characterLevel
						});
						var items = [];						
						response.data.buckets.Equippable.forEach(function(obj){
							obj.items.forEach(function(item){
								items.push(item);
							});
						});
						var def = response.definitions.items;
						var def_perks = response.definitions.perks;
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
		if (self.doRefresh() == 1){
			self.refreshInterval = setInterval(self.loadData, self.refreshSeconds() * 1000);
		}
	}
	this.init = function(){
		self.bungie = new bungie();
		self.loadData();
		self.doRefresh.subscribe(self.refreshHandler);
		self.refreshSeconds.subscribe(self.refreshHandler);
		self.refreshHandler();
		$(window).click(function(e){
			if (e.target.className !== "itemImage") {
				$("#move-popup").hide();
			}
		});
		ko.applyBindings(self, document.getElementById('itemsList'));
	}
});

$(document).ready(app.init);