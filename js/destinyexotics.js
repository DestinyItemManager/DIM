var _collections={exoticWeapons:[135862170,119482464,3164616407,3490486525,119482466,135862171,119482465,3164616405,3164616404,1389842217,346443849,2809229973,2681212685,3118679308,3118679309,346443851,346443850,1389842216,2344494718,3191797830,3191797831,1274330687,1274330686,3705198528],vaultWeapons:[3074713346,3892023023,1603229152,2149012811,1267053937,892741686,3695068318,152628833,3807770941],crotaWeapons:[4144666151,4252504452,868574327,437329200,560601823,3615265777,1267147308,788203480,2361858758],ironWeapons:[2775854838,1998842327,1487387187,337037804,367695658,160095218,1221909933,2853794413,805224273],exoticArmor:[144553854,144553855,144553853,499191786,499191787,78421062,94883184,4146057409,921478195,2994845057,2994845058,2994845059,2272644374,2272644375,4132383826,3577254054,2591213943,104781337,2771018502,2771018500,2771018501,1398023010,1398023011,2335332317,3455371673,287395896,2927156752],vaultArmor:[1096028869,3833808556,1835128980,1698410142,2237496545,2147998057,3367833896,3851493600,2504856474,774963973,2486746566,4079606241,1883484055,3267664569,991704636],crotaArmor:[1311326450,1261228341,1736102875,186143053,4253790216,1898281764,2450884227,1462595581,3786747679,1349707258,2477121987,3009953622,3148626578,3549968172,2339580799],ironArmor:[2452629279,2413349891,2810850918,1063666591,1312172922,1556318808,1448055471,1914248812,1846030075,189873545,1737847390,925496553,391890850,1157862961,2314015087]};

function report() {

	function completeFilter(item){ return item.isGridComplete; }
	
	var _completed = [],
		_collected = [];
	app.characters().forEach(function(character){
	  ['weapons','armor'].forEach(function(list){
	  		var items = character[list]();			
	      	_collected = _collected.concat( _.pluck( items, 'id') );
			_completed = _completed.concat( _.pluck( _.filter(items, completeFilter), 'id') );
	  })
	});

	var collection = [];
	var hashArray = [];

	for(var c in _collections) {
		collection[c] = {completed:[], collected:[], missing:[]};
		for(var i in _collections[c]) {
			i = _collections[c][i];
			if(_completed.indexOf(i) != -1) {
				hashArray.push(2);
				collection[c].completed.push(i);
			} else if(_collected.indexOf(i) != -1) {
				hashArray.push(1);
				collection[c].collected.push(i);
			} else {
				hashArray.push(0);
				collection[c].missing.push(i);
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
