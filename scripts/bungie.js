function bungie() {
  // private vars
  var domain = 'bungie.net';
  var url = 'https://www.bungie.net/Platform';
  var apikey = '57c5ff5864634503a0340ffdfbeb20c0';

  var gamertag = null;
  var membershipType = 1;
  var membershipId = 0;
  var characterIds = [];

  // private methods
  function _getAllCookies(callback){
    chrome.cookies.getAll({ domain: '.' + domain }, function(){
      callback.apply(null, arguments);
    });
  }

  function _getCookie(name, callback){
    _getAllCookies(function(cookies){
      var c = null;
      for(var i = 0, l = cookies.length; i < l; ++i){
        if(cookies[i].name === name){
          c = cookies[i];
          break;
        }
      }
      if(c)
      callback(c.value);
    });
  }

  function _getToken(callback) {
    _getCookie('bungled', function(token) {
      callback(token);
    });
  }

  function _request(opts) {
    var r = new XMLHttpRequest();
    // console.log('looking at ', opts.route)
    r.open(opts.method, url + opts.route, true);
    r.setRequestHeader('X-API-Key', apikey);
    // r.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    // r.setRequestHeader('accept', 'accept:application/json, text/javascript, */*; q=0.01');
    // r.setRequestHeader('x-requested-with', 'XMLHttpRequest');
    // r.setRequestHeader('referer', 'https://www.bungie.net/en/Legend/1/4611686018443852891/2305843009263222646');
    // r.setRequestHeader('origin', 'https://www.bungie.net');
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
      }
    });
  }

  // privileged methods
  this.gamertag = function() {
    return gamertag;
  }
  this.user = function(callback) {
    _request({
      route: '/User/GetBungieNetUser/',
      method: 'GET',
      complete: function(res) {
        if(res === undefined) {
          callback({error: true})
          return;
        }
        gamertag = res.gamerTag;
        if(res.psnId) {
          membershipType = 2;
          gamertag = res.psnId;
        }
        callback(res);
      }
    });
  }
  this.search = function(callback) {
    _request({
      route: '/Destiny/SearchDestinyPlayer/' + membershipType + '/' + gamertag + '/',
      method: 'GET',
      complete: function(membership) {
        if(membership[0] === undefined) {
          console.log('error finding bungie account!', membership)
          callback({error: true})
          return;
        }
        membershipId = membership[0].membershipId;
        _request({
          route: '/Destiny/Tiger' + (membershipType == 1 ? 'Xbox' : 'PSN') +
                  '/Account/' + membershipId + '/',
          method: 'GET',
          complete: callback
        });
      }
    });
  }
  this.vault = function(callback) {
    _request({
      route: '/Destiny/' + membershipType + '/MyAccount/Vault/?definitions=true',
      method: 'GET',
      complete: callback
    });
  }
  this.inventory = function(characterId, callback) {
    _request({
      route: '/Destiny/' + membershipType +
              '/Account/' + membershipId +
              '/Character/' + characterId +
              '/Inventory/?definitions=true',
      method: 'GET',
      complete: callback
    });
  }
  this.transfer = function(characterId, itemId, itemHash, amount, toVault, callback) {
    _request({
      route: '/Destiny/TransferItem/?lc=en&fmt=true&lcin=true',
      method: 'POST',
      payload: {
        characterId: characterId,
        membershipType: membershipType,
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
        membershipType: membershipType,
        characterId: characterId,
        itemId: itemId
      },
      complete: callback
    })
  }
}
