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
			console.log("itemIndex " + itemIndex);
			var pair = swapArray[++itemIndex];
			if (pair){
				console.log(pair);
				/* at this point it doesn't matter who goes first but lets transfer the loadout first */
				var owner = pair.targetItem.character.id;
				console.log("going to transfer first item " + pair.targetItem.description);
				self.findReference(pair.targetItem).store(targetCharacterId, function(targetProfile){			
					console.log("xfered it, now to transfer next item " + pair.swapItem.description);	
					self.findReference(pair.swapItem).store(owner, function(){
						console.log("xfered that too, now to the next pair");
						transferNextItem();
					});
				});
			}
			else {
				alert("Items transferred successfully");
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
	this.transfer = function(targetCharacterId){
		var targetCharacter = _.findWhere( app.characters(), { id: targetCharacterId });
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
							var itemFound = false;
							var swapItem = _.filter(targetBucket, function(otherItem){
								/* if the otherItem is not part of the sourceBucket then it can go */
								if ( sourceBucketIds.indexOf( otherItem._id ) == -1 && itemFound == false){
									itemFound = true;
									sourceBucketIds.push(otherItem._id);
									return otherItem;
								}
							})[0];
							return {
								targetItem: item,
								swapItem: swapItem,
								description: item.description + "'s swap item is " + swapItem.description
							}
						});
						return swapArray;
					}
					else {
						/* do a clean move by returning a swap object without a swapItem */
					}
				}));
				$("#loadoutConfirm").show().click(function(){
					self.swapItems(masterSwapArray, targetCharacterId);
				});
				dialog.title("Transfer Confirm").content(swapTemplate({ swapArray: masterSwapArray })).show(function(){							
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