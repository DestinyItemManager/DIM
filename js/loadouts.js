
/*
targetItem: item,
swapItem: swapItem,
description: item.description + "'s swap item is " + swapItem.description
*/
var swapTemplate3 = _.template('<ul class="list-group">' +	
	'<% swapArray.forEach(function(pair){ %>' +
		'<li class="list-group-item">' +
			'<div class="row">' +
				'<div class="col-lg-6">' +
					'<%= pair.description %>' +
				'</div>' +
				'<div class="col-lg-3">' +
					'<a class="item" href="<%= pair.targetItem && pair.targetItem.href %>" id="<%= pair.targetItem && pair.targetItem._id %>">' + 
						'<img class="itemImage" src="<%= pair.targetItem && pair.targetItem.icon %>">' +
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

var Loadout = function(model){
	var self = this;
	
	_.each(model, function(value, key){
		self[key] = value;
	});	
	this.name = self.name || "";
	this.ids = ko.observableArray(self.ids || []);
	this.setActive = function(){
		app.loadoutMode(true);
		app.activeLoadout(self);
	}
	this.remove = function(){
		app.loadouts.remove(self);
		app.createLoadout();
	}

	this.save = function(){
		var ref = _.findWhere( app.loadouts(), { name: self.name });
		if ( ref ){
			app.loadouts.splice(app.loadouts().indexOf(ref),1);
		}
		app.loadouts.push( self );
		var loadouts = ko.toJSON(app.loadouts());
		chrome.storage.sync.set({ loadouts: loadouts }, function(){ /*console.log("done saving");*/ });
	}
	this.items = ko.computed(function(){
		var _items = _.map(self.ids(), function(instanceId){
			var itemFound;
			app.characters().forEach(function(character){
				['weapons','armor'].forEach(function(list){
					var match = _.findWhere(character[list]() , { _id: instanceId });
					if (match) itemFound = match;
				});
			});
			return itemFound;
		});	
		return _items;
	});
	/* the object with the .store function has to be the one in app.characters not this copy */
	this.findReference = function(item){
		var c = _.findWhere(app.characters(),{ id: item.character.id });
		var x = _.findWhere(c[item.list](),{ _id: item._id });
		return x;
	}
	this.swapItems = function(swapArray, targetCharacterId){
		var itemIndex = -1;
		var transferNextItem = function(){
			var pair = swapArray[++itemIndex];
			if (pair){
				/* at this point it doesn't matter who goes first but lets transfer the loadout first */
				var owner = pair.targetItem.character.id;
				if ( typeof pair.targetItem !== "undefined"){
					//console.log("going to transfer first item " + pair.targetItem.description);
					self.findReference(pair.targetItem).store(targetCharacterId, function(targetProfile){			
						//console.log("xfered it, now to transfer next item " + pair.swapItem.description);
						if (typeof pair.swapItem !== "undefined"){
							self.findReference(pair.swapItem).store(owner, transferNextItem);
						}	
						else { transferNextItem(); }
					});
				}
				else { transferNextItem(); }
			}
			else {
				alert("Item(s) transferred successfully");
				$('#basicModal').modal('hide');
			}
		}
		app.activeLoadout(new Loadout());
		app.loadoutMode(false);
		transferNextItem();
	}
	/* before starting the transfer we need to decide what strategy we are going to use */
	/* strategy one involves simply moving the items across assuming enough space to fit in both without having to move other things */
	/* strategy two involves looking into the target bucket and creating pairs for an item that will be removed for it */
	/* strategy three is the same as strategy one except nothing will be moved bc it's already at the destination */
	this.transfer = function(targetCharacterId){
		var targetCharacter = _.findWhere( app.characters(), { id: targetCharacterId });
		var getFirstItem = function(sourceBucketIds, itemFound){
			return function(otherItem){
				/* if the otherItem is not part of the sourceBucket then it can go */
				if ( sourceBucketIds.indexOf( otherItem._id ) == -1 && itemFound == false){
					itemFound = true;
					sourceBucketIds.push(otherItem._id);
					return otherItem;
				}
			}
		};
		['weapons','armor'].forEach(function(list){			
			var sourceItems =  _.where( self.items(), { list: list });
			if (sourceItems.length > 0){
				var targetList = targetCharacter[list]();				
				var sourceGroups = _.groupBy( sourceItems, 'bucketType' );
				var targetGroups = _.groupBy( targetList, 'bucketType' );	
				var masterSwapArray = _.flatten(_.map(sourceGroups, function(group, key){
					var sourceBucket = sourceGroups[key];
					var targetBucket = targetGroups[key];
					/* use the swap item strategy */
					/* by finding a random item in the targetBucket that isnt part of sourceBucket */					
					if (sourceBucket.length + targetBucket.length > 9){
						var sourceBucketIds = _.pluck( sourceBucket, "_id");
						var swapArray = _.map(sourceBucket, function(item){
							/* if the item is already in the targetBucket then return an object indicating to do nothing */
							if ( _.findWhere( targetBucket, { _id: item._id }) ){
								return {
									description: item.description + " is already in the " + targetCharacter.classType + "'s bucket of " + item.bucketType
								}
							}
							else {
								var itemFound = false;
								var swapItem = _.filter(_.where(targetBucket, { type: item.type }), getFirstItem(sourceBucketIds, itemFound));
								swapItem = (swapItem.length > 0) ? swapItem[0] : _.filter(targetBucket, getFirstItem(sourceBucketIds, itemFound))[0];
								return {
									targetItem: item,
									swapItem: swapItem,
									description: item.description + "'s swap item is " + swapItem.description
								}							
							}
						});						
					}
					else {
						/* do a clean move by returning a swap object without a swapItem */
						var swapArray = _.map(sourceBucket, function(item){
							if ( _.findWhere( targetBucket, { _id: item._id }) ){
								return {
									description: item.description + " is already in the " + targetCharacter.classType + "'s bucket of " + item.bucketType
								}
							}
							else {							
								return {
									targetItem: item,
									description: item.description + " will be added with no swaps"
								}
							}
						});
					}
					return swapArray;
				}));
				$("#loadoutConfirm").show().click(function(){
					self.swapItems(masterSwapArray, targetCharacterId);
				});
				
				dialog.title("Transfer Confirm").content(swapTemplate3({ swapArray: masterSwapArray })).show(function(){							
					$("#loadoutConfirm").hide();
				});
			}			
		});
	}
}

Loadout.prototype.toJSON = function(){
    var copy = ko.toJS(this); //easy way to get a clean copy
	//copy.items = _.pluck(copy.items, '_id'); //strip out items metadata
	delete copy.items;
	return copy;
}