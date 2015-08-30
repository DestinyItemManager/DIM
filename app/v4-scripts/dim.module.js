(function() {
  'use strict';

  angular.module('dim', [
      'ngHammer'
    ]);
})();




/**
 * @license ngHammer.js v1.0.0
 * (c) 2014 Daniel Smith http://www.danmasta.com
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

/**
 * @ngdoc module
 * @name ngHammer
 * @description
 *
 * # ngHammer
 *
 * The ngHammer module provides angular directives for all touch events handled by hammer.js
 * The implementation is the same as default angular event handlers. Event object is available as $event.
 * http://eightmedia.github.io/hammer.js/
 */

// define ngHammer module
var ngHammer = angular.module('ngHammer', []);

// Normalize directive name
function capitalize(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Programatically create directives using the same method as angular.js default events
angular.forEach('hold tap doubletap drag dragstart dragend dragup dragdown dragleft dragright swipe swipeup swipedown swipeleft swiperight transform transformstart transformend rotate pinch pinchin pinchout touch release'.split(' '), function(value, key){
  var directiveName = 'ng' + capitalize(value);
  angular.module('ngHammer').directive(directiveName, ['$parse', function($parse){
    return{
      compile: function($element, attr) {
        var fn = $parse(attr[directiveName]);
        return function(scope, element, attr) {
          Hammer(element[0]).on(value.toLowerCase(), function(event) {
            scope.$apply(function() {
              fn(scope, {$event:event});
            });
          });
        };
      }
    }
  }]);
});

})(window, window.angular);
