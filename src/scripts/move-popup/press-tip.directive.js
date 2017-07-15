import angular from 'angular';
import Tooltip from 'tooltip.js';
import './press-tip.scss';

angular.module('dimApp')
  .directive('pressTip', PressTip);

function PressTip() {
  'ngInject';

  return {
    restrict: 'A',
    link($scope, $element, $attrs) {
      let tooltip = null;

      function showTip() {
        if (!tooltip) {
          let title = $attrs.pressTip;
          if ($attrs.pressTipTitle) {
            title = `<h2>${$attrs.pressTipTitle}</h2>${title}`;
          }
          tooltip = new Tooltip($element[0], {
            placement: 'top', // or bottom, left, right, and variations
            title,
            html: true,
            trigger: 'manual',
            container: 'body'
          });
        }
        tooltip.show();
      }

      $element.on('mousedown', () => {
        showTip();
      });

      $element.on('mouseup mouseleave', () => {
        if (tooltip) {
          tooltip.hide();
        }
      });

      $scope.$on('$destroy', () => {
        if (tooltip) {
          tooltip.dispose();
          tooltip = null;
        }
      });
    }
  };
}
