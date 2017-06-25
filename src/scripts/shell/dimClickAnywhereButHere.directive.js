import angular from 'angular';

angular.module('dimApp')
  .directive('dimClickAnywhereButHere', ClickAnywhereButHere);


function ClickAnywhereButHere($document) {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      const handler = function(event) {
        if (!element[0].contains(event.target)) {
          scope.$apply(attr.dimClickAnywhereButHere);
          // scope.callback(event);
        }
      };

      $document.on('click', handler);
      scope.$on('$destroy', () => {
        $document.off('click', handler);
      });
    }
  };
}

