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

var filterWeaponByType = function(type, isEquipped){
	return function(weapon){
		if (weapon.bucketType == type && weapon.isEquipped == isEquipped)
			return weapon;
	}
}

var Profile = function(model){
	var self = this;
	_.each(model, function(value, key){
		self[key] = value;
	});
	
	this.weapons = ko.observableArray([]);
	this.armor = [];
	this.primaries = ko.computed(function(){
		return self.weapons().filter(filterWeaponByType("Primary", false));
	});
	this.specials = ko.computed(function(){
		return self.weapons().filter(filterWeaponByType("Special", false));
	});
	this.heavies = ko.computed(function(){
		return self.weapons().filter(filterWeaponByType("Heavy", false));
	});
	this.primaryEquipped = ko.computed(function(){
		return ko.utils.arrayFirst(self.weapons(), filterWeaponByType("Primary", true));
	});
	this.specialEquipped = ko.computed(function(){
		return ko.utils.arrayFirst(self.weapons(), filterWeaponByType("Special", true));
	});
	this.heavyEquipped = ko.computed(function(){
		return ko.utils.arrayFirst(self.weapons(), filterWeaponByType("Heavy", true));
	});
}

var Weapon = function(stats, ids){
	var self = this;
	Object.keys(stats).forEach(function(key){
		self[key] = stats[key];
	});
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
	"953998645": "Heavy"
}

var app = new (function() {
	var self = this;

	this.activeUser = ko.observable();
	
	this.searchPerk = ko.observable("");
	this.items = ko.observableArray();
	this.characters = ko.observableArray();
	this.ids = [];
	this.tierFilter = ko.observable(0);
	this.typeFilter = ko.observable(0);
	this.dmgFilter =  ko.observable("All");
	this.weaponTypes = ko.observableArray();
	this.dmgTypeColors = {
		"None": "white",
		"Arc": "blue",
		"Arc": "cyan",
		"Solar": "orange",
		"Void": "magenta"
	}
	
	this.setTierFilter = function(model, event){
		self.tierFilter(event.target.value);
	}
	
	this.setDmgFilter = function(model, event){
		self.dmgFilter(event.target.value);
	}
	
	this.setTypeFilter = function(model, event){
		self.typeFilter(event.target.value);
	}
	
	var processItem = function(profile, itemDefs, perkDefs){	
		return function(item){
			var info = itemDefs[item.itemHash];
			var itemObject = { 
				id: item.itemHash,
				damageType: item.damageType,
				damageTypeName: DestinyDamageTypes[item.damageType],
				description: info.itemName, 
				bucketType: DestinyBucketTypes[info.bucketTypeHash],
				type: info.itemSubType, //12 (Sniper)
				typeName: info.itemTypeName, //Sniper Rifle
				tierType: info.tierType, //6 (Exotic) 5 (Legendary)
				icon: "http://www.bungie.net/" + info.icon,
				isEquipped: item.isEquipped
			};			
			if (item.primaryStat)
				itemObject.primaryStat = item.primaryStat.value;
			
			if (info.itemType === 3){
				itemObject.perks = item.perks.map(function(perk){
					var p = perkDefs[perk.perkHash];
					return {
						name: p.displayName,
						description: p.displayDescription
					}
				});
				profile.weapons.push( itemObject );
			}
			else if (info.itemType != 3 && info.tierType == 6)
				profile.armor.push( itemObject );
		}
	}
	
	this.loadData = function(){
		self.bungie.user(function(user){
			self.activeUser(user);
			self.bungie.search(function(e){
				var avatars = e.data.characters;
				self.bungie.vault(function(results){
					var buckets = results.data.buckets;
					var profile = new Profile({ gender: "Tower",  classType: "Vault", id: "Vault", level: "", icon: "", background: "" });
					var def = results.definitions.items;
					var def_perks = results.definitions.perks;
					
					buckets[2].items.forEach(processItem(profile, def, def_perks));
					
					self.characters.push(profile);
				});
				avatars.forEach(function(character){
					self.bungie.inventory(character.characterBase.characterId, function(response) {
						var profile = new Profile({ 
							gender: DestinyGender[character.characterBase.genderType],
							classType: DestinyClass[character.characterBase.classType],
							id: character.characterBase.characterId,
							icon: "url(http://www.bungie.net/" + character.emblemPath + ")",
							background: "url(http://www.bungie.net/" + character.backgroundPath + ")",
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
						self.characters.push(profile);
					});
				});
			});			
		});
	}
	
	this.init = function(){
		self.bungie = new bungie();
		self.loadData();
		ko.applyBindings(self, document.getElementById('itemsList'));
	}
});

$(document).ready(app.init);