function bungie() {
  // private vars
  var domain = 'bungie.net';
  var url = 'https://www.bungie.net/Platform';
  var apikey = '5a70a3009ea0428a8d5a75a7c329eb5b';

  var systemIds = {};
  var membershipId = 0;
  var characterIds = [];

  var active = {id: 'loading'};

  // private methods
  function _getAllCookies(callback) {
    chrome.cookies.getAll({ domain: '.' + domain }, function(){
      callback.apply(null, arguments);
    });
  }

  function _getCookie(name, callback) {
    _getAllCookies(function(cookies){
      var c = null;
      for(var i = 0, l = cookies.length; i < l; ++i){
        if(cookies[i].name === name){
          c = cookies[i];
          break;
        }
      }
      callback(c ? c.value : null);
    });
  }

  function _getToken(callback) {
    _getCookie('bungled', function(token) {
      callback(token);
    });
  }

  function _request(opts) {
    var r = new XMLHttpRequest();
    r.open(opts.method, url + opts.route, true);
    r.setRequestHeader('X-API-Key', apikey);
    r.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        var response = JSON.parse(this.response);

        if(response.ErrorCode === 36) setTimeout(function () { _request(opts); }, 1000);
        else opts.complete(response.Response, response);
      } else {
        opts.complete({error: 'network error:' + this.status}, this.response);
      }
    };

    r.onerror = function() { opts.complete({error: 'connection error'}); };

    _getToken(function(token) {
      if(token != null) {
        r.withCredentials = true;
        r.setRequestHeader('x-csrf', token);
        r.send(JSON.stringify(opts.payload));
      } else {
        opts.complete({error: 'cookie not found'});
      }
    });
  }

  // privileged methods
  this.setsystem = function(type) {
    if(type === undefined) return;
    active = systemIds.xbl
    if(type === 'PSN')
      active = systemIds.psn;
  }
  this.active = function() {
    return active;
  }
  this.system = function() {
    return systemIds;
  }
  this.user = function(callback) {
    _request({
      route: '/User/GetBungieNetUser/',
      method: 'GET',
      complete: function(res) {
        if(res === undefined) {
          callback({error: 'no response'})
          return;
        }

        systemIds.xbl = {id: res.gamerTag, type: 1};
        systemIds.psn = {id: res.psnId, type: 2};

        active = systemIds.xbl;

        if(res.psnId)
          active = systemIds.psn;

        callback(res);
      }
    });
  }
  this.search = function(callback) {
    _request({
      route: '/Destiny/SearchDestinyPlayer/' + active.type + '/' + active.id + '/',
      method: 'GET',
      complete: function(membership) {
        if(membership[0] === undefined) {
          callback({error: true})
          return;
        }
        membershipId = membership[0].membershipId;
        _request({
          route: '/Destiny/Tiger' + (active.type == 1 ? 'Xbox' : 'PSN') +
                  '/Account/' + membershipId + '/',
          method: 'GET',
          complete: callback
        });
      }
    });
  }
  this.vault = function(callback) {
    _request({
      route: '/Destiny/' + active.type + '/MyAccount/Vault/',
      method: 'GET',
      complete: callback
    });
  }
  this.inventory = function(characterId, callback) {
    _request({
      route: '/Destiny/' + active.type +
              '/Account/' + membershipId +
              '/Character/' + characterId +
              '/Inventory/',
      method: 'GET',
      complete: callback
    });
  }
  this.getItem = function(characterId, itemId, callback) {
      _request({
        route: '/Destiny/' + active.type +
                '/Account/' + membershipId +
                '/Character/' + characterId +
                '/Inventory/' + itemId,
        method: 'GET',
        complete: callback
      });
  }
  this.transfer = function(characterId, itemId, itemHash, amount, toVault, callback) {
    _request({
      route: '/Destiny/TransferItem/',
      method: 'POST',
      payload: {
        characterId: characterId,
        membershipType: active.type,
        itemId: itemId,
        itemReferenceHash: itemHash,
        stackSize: amount,
        transferToVault: toVault
      },
      complete: callback
    });
  }
  this.equip = function(characterId, itemId, callback) {
    _request({
      route: '/Destiny/EquipItem/',
      method: 'POST',
      payload: {
        membershipType: active.type,
        characterId: characterId,
        itemId: itemId
      },
      complete: callback
    })
  }
  // this function works and returns a behemoth response. very useful/scary.
  // .equipResults for more information on item equip messages
  // .character.inventory.buckets -useful to resync data maybe?
  // .summary - useful if we want to update character level/emblem/etc
  this.equipall = function(characterId, itemIds, callback) {
    _request({
      route: '/Destiny/EquipItems/',
      method: 'POST',
      payload: {
        membershipType: active.type,
        characterId: characterId,
        itemIds: itemIds
      },
      complete: callback
    })
  }
}
