var Weapon = function(stats, ids){
	var self = this;
	Object.keys(stats).forEach(function(key){
		self[key] = stats[key];
	});
	this.hasDmgType = function(type){
		return self.dmg.indexOf(type) > -1;
	}
	this.hasPerkSearch = function(search){
		var foundPerk = false, vSearch = search.toLowerCase();
		self.perks.forEach(function(perk){
			if (perk.toLowerCase().indexOf(vSearch) > -1)
				foundPerk = true;
		});
		return foundPerk;
	}
	this.toons = [];
	
	_.each(ids, function(toon, index){
		self.toons[index] = {
			color: 		self.alts.indexOf(index+1) > -1 ? app.dmgTypeColors[self.dmg[index+1]] 	: '',
			damageStat: self.alts.indexOf(index+1) > -1 ? self.stats[index+1] 					: '-',
			damageType: self.alts.indexOf(index+1) > -1 ? ('(' + self.dmg[index+1]  + ')')		: '',
			perks:		self.alts.indexOf(index+1) > -1 ? self.perks[index+1] 					: ''
		}
	})
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
var DamageType = {
    "0": "None",
    "1": "Kinetic",
    "2": "Arc",
    "3": "Solar",
    "4": "Void",
    "5": "Raid"
};
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
	
	this.classesToItems = function(classes) {
		var items = {}, weapons = {}, stats = {}, dmg = {}, perks = {};
		classes.forEach(function(character) {
			var index = self.ids.push({
				id : character.id,
				title : character.gender + " " + character.class
			});
			character.weapons.forEach(function(weapon) {
				var id = weapon.id;
				weapons[id] = weapon; 
				if (!(id in items))
					items[id] = [ index ];				
				else
					items[id].push(index);
				
				if (!(id in stats))
					stats[id] = [];
				stats[id][index] = weapon.primaryStat;
				
				if (!(id in dmg))
					dmg[id] = [];
				dmg[id][index] = weapon.damageTypeName;
				
				if (!(id in perks))
					perks[id] = [];
				perks[id][index] = weapon && weapon.perks && weapon.perks.map(function(perk){
					  return "[" + perk.name + "] " + perk.description;
				}).join("\n");;
			});
		});
		
		Object.keys(items).forEach(function(key) {
			self.items.push(
				new Weapon(
					_.extend({}, weapons[key], {
						id: 	key,
						stats: 	stats[key],
						dmg:	dmg[key],
						perks: 	perks[key],
						alts : 	items[key]
					}), 
					self.ids
				)
			);
		});
		
		self.items(
			self.items().sort(function(a,b){
				return (a.damageType - b.damageType);
			}).sort(function(a,b){
				return (a.type - b.type);
			})
		);

		self.items().forEach(function(item){
			if (_.where(self.weaponTypes(), { type: item.type}).length == 0)
				self.weaponTypes.push({ name: item.typeName, type: item.type });
		});
		
		self.weaponTypes(
			self.weaponTypes().sort(function(a,b){
				return (a.type - b.type);
			})
		);
	}
	var processItem = function(profile, itemDefs, perkDefs){	
		return function(item){
			var info = itemDefs[item.itemHash];
			var itemObject = { 
				id: item.itemHash,
				damageType: item.damageType,
				damageTypeName: DamageType[item.damageType],
				description: info.itemName, 
				type: info.itemSubType, 
				typeName: info.itemTypeName,
				tierType: info.tierType
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
					var profile = { gender: "Tower",  class: "Vendor", id: "Vault", weapons: [], armor: [] };
					var def = results.definitions.items;
					var def_perks = results.definitions.perks;
					
					buckets[1].items.forEach(processItem(profile, def, def_perks));
					
					self.characters.push(profile);
				});
				avatars.forEach(function(character){
					self.bungie.inventory(character.characterBase.characterId, function(response) {
						var profile = { 
							gender: DestinyGender[character.characterBase.genderType],
							class: DestinyClass[character.characterBase.classType],
							id: character.characterBase.characterId, 
							weapons: [], 
							armor: [] 
						};
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
				/* setup promises and call this when they're all done or find a better way */
				setTimeout(function(){ self.classesToItems( self.characters() ) },3000);
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
