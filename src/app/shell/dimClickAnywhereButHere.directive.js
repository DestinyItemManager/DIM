import angular from 'angular';

angular.module('dimApp')
  .directive('dimClickAnywhereButHere', ClickAnywhereButHere);


function ClickAnywhereButHere($document, $timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      const handler = function(event) {
        if (!element[0].contains(event.target)) {
          // This fixes an event ordering bug in Safari that can cause closed dialogs to reopen
          $timeout(() => {
            scope.$apply(attr.dimClickAnywhereButHere);
          }, 150);
        }
      };

      $document.on('click touchstart', handler);
      scope.$on('$destroy', () => {
        $document.off('click touchstart', handler);
      });
    }
  };
}

