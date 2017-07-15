import angular from 'angular';
import Tooltip from 'tooltip.js';
import './press-tip.scss';

angular.module('dimApp')
  .directive('pressTip', PressTip);

function PressTip($timeout) {
  'ngInject';

  return {
    restrict: 'A',
    link($scope, $element, $attrs) {
      'ngInject';
      console.log('link');

      let tooltip = null;
      let timer = null;

      function showTip() {
        console.log('show');
        if (timer) {
          timer.cancel();
        }
        if (!tooltip) {
          tooltip = new Tooltip($element[0], {
            placement: 'top', // or bottom, left, right, and variations
            title: $attrs.pressTip,
            trigger: 'manual',
            container: 'body'
          });
        }
        tooltip.show();
      }

      $element.on('mousedown', () => {
        showTip();
      });

      $element.on('mouseenter', () => {
        timer = $timeout(showTip, 2000);
      });

      $element.on('mouseup mouseleave', () => {
        if (timer) {
          timer.cancel();
        }
        if (tooltip) {
          tooltip.hide();
        }
      });

      $scope.$on('$destroy', () => {
        if (timer) {
          timer.cancel();
        }
        if (tooltip) {
          tooltip.dispose();
          tooltip = null;
        }
      });
    }
  };
}
