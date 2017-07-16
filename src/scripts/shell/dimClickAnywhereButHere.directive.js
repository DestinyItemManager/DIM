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
        }
      };

      $document.on('click touchstart', handler);
      scope.$on('$destroy', () => {
        $document.off('click touchstart', handler);
      });
    }
  };
}

