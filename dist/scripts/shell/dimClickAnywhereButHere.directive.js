(function () {
  angular.module('dimApp')
    .directive('dimClickAnywhereButHere', ClickAnywhereButHere);

  ClickAnywhereButHere.$inject = ['$document', '$parse'];

  function ClickAnywhereButHere($document, $parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attr, ctrl) {
        var handler = function (event) {
          if (!element[0].contains(event.target)) {
            scope.$apply(attr.dimClickAnywhereButHere);
            //scope.callback(event);
          }
        };

        $document.on('click', handler);
        scope.$on('$destroy', function () {
          $document.off('click', handler);
        });
      }
    };
  }
})();
