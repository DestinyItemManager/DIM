(function() {
'use strict';

angular.module('dimApp')
    .factory('dimWebWorker', dimWebWorker);

  dimWebWorker.$inject = ['$q', '$location'];

  // heavily based on http://stackoverflow.com/questions/29282817/running-a-background-task-in-javascript/29283013#29283013
  function dimWebWorker($q, $location) {
      var _worker;
      var _blobURL;

      var DIMWorker = function(settings) {
        _init(settings);
      };

      DIMWorker.prototype.do = function(args) {
        var deferred = $q.defer();

        _worker.onmessage = function(message) {
          deferred.resolve(message.data);
        };

        //Fire up the blades.
        if (args) {
          _worker.postMessage(args);
        }
        else {
          _worker.postMessage();
        }

        return deferred.promise;
      };

      DIMWorker.prototype.destroy = function() {
        _worker.terminate();
        window.URL.revokeObjectURL(_blobURL);
      };

      function _init(settings) {
        if (settings.script) {
          _worker = new Worker(settings.script);
        }
        else if (settings.fn) {
          var includeScripts = '';
          if (settings.include && settings.include.constructor === Array) {
            var basePath = $location.protocol() + '://' + $location.host() + '/';
            _.each(settings.include, function(script, index) { // quote wrap
              settings.include[index] = '\'' + basePath + script + '\'';
            });
            var list = settings.include.join(',');
            includeScripts = 'self.importScripts(' + list + ');\n';
          }

          var onmsg = 'this.onmessage = ' + settings.fn.toString();
          var fn = 'function() {\n' + includeScripts + onmsg + '\n}';
          _blobURL = window.URL.createObjectURL(new Blob(
              ['(', fn, ')()'],
              { type: 'application/javascript' }
          ));

          _worker = new Worker(_blobURL);
        }
      };

      return DIMWorker;
  }
})();