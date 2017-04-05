import angular from 'angular';

function percent(val) {
  return Math.min(100.0, Math.floor(100.0 * val)) + '%';
}

// Set the width of an element to a percentage, given a [0,1] input.
angular.module('dimApp')
  .directive('dimPercentWidth', PercentWidth)
  .filter('percent', function() { return percent; });

function PercentWidth() {
  return {
    bind: 'A',
    link: function(scope, element, attrs) {
      scope.$watch(attrs.dimPercentWidth, function(val) {
        if (!val) {
          val = 0;
        }
        element.css({ width: percent(val) });
      });
    }
  };
}

