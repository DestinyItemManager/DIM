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



function tryPageLoad() {
	// 	var input = document.getElementById('filter-text');
	// 	input.style.display = 'inline-block';
	// 	var item = document.querySelectorAll('.item');
	//
	// 	function collapseSections() {
	// 		for (var i = 0; i < _sections.length; i++) {
	// 			if(_sections[i].parentNode !== null)
	// 			_sections[i].parentNode.style.display = 'none';
	// 			for(var j = 0; j < _sections[i].children.length; j++) {
	// 				for(var k = 0; k < _sections[i].children[j].children.length; k++) {
	// 					if(_sections[i].children[j].children[k].style.display == '' && _sections[i].parentNode !== null) {
	// 						_sections[i].parentNode.style.display = '';
	// 						break;
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// 	collapseSections();
	// 	input.addEventListener('keyup', function () {
	// 		var filter = input.value.toLowerCase();
	// 		var special = filter.indexOf('is:') >= 0;
	// 		if(special) {
	// 			filter = filter.split('is:')[1].trim();
	// 			if(['arc', 'solar', 'void', 'kinetic'].indexOf(filter) >= 0) {
	// 				special = 'elemental';
	// 			} else if(['primary', 'special', 'heavy'].indexOf(filter) >= 0) {
	// 				special = 'type';
	// 			} else if(['basic', 'uncommon', 'rare', 'legendary', 'exotic'].indexOf(filter) >= 0) {
	// 				special = 'tier';
	// 			} else if(['complete'].indexOf(filter) >= 0) {
	// 				special = 'complete';
	// 			}
	// 		}
	// 		for (var i = 0; i < item.length; i++) {
	// 			switch(special) {
	// 				case 'elemental':	item[i].style.display = _items[item[i].dataset.index].dmg == filter ? '' : 'none'; break;
	// 				case 'type':	item[i].style.display = _items[item[i].dataset.index].type.toLowerCase() == filter ? '' : 'none'; break;
	// 				case 'tier':	item[i].style.display = _items[item[i].dataset.index].tier.toLowerCase() == filter ? '' : 'none'; break;
	// 				case 'complete':	item[i].style.display = _items[item[i].dataset.index].complete === true ? '' : 'none'; break;
	// 				default: item[i].style.display = item[i].dataset.name.toLowerCase().indexOf(filter) >= 0 ? '' : 'none'; break;
	// 			}
	// 		}
	//
	// 		collapseSections();
	// 	});
	// 	input.addEventListener('click', function() { this.select(); });
	// 	input.addEventListener('search', function() { this.dispatchEvent(new Event('keyup')); });
	//
	// 	function hideTooltip(e) {
	//
	// 		// console.log( e.target, e.target.parentNode, e.target.parentNode.parentNode, e.target.className === 'loadout-set')
	// 		if((e.type === 'keyup' && e.keyCode === 27) || (e.type === 'mousedown' &&
	// 			!(e.target.parentNode.className === 'move-button' ||
	// 			 	e.target.parentNode.className === 'item' ||
	// 				e.target.className === 'loadout-button' ||
	// 				e.target.parentNode.id === 'loadout-popup' ||
	// 				e.target.className === 'loadout-set' ||
	// 				e.target.parentNode.className === 'loadout-set' ||
	// 				e.target.parentNode.id === 'loadout-list' ||
	// 				e.target.parentNode.parentNode.id === 'loadout-list')) /*|| e.target.className !== 'loadouts'*/) {
	//
	// 			loadoutBox.style.display = 'none';
	// 			// faq.style.display = 'none';
	// 		}
	// 	}
	// 	document.body.addEventListener('mousedown', hideTooltip);
	// 	document.body.addEventListener('keyup', hideTooltip);
	// }
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
