import Tooltip from 'tooltip.js';
import './press-tip.scss';

export function PressTip() {
  'ngInject';

  return {
    restrict: 'A',
    link($scope, $element, $attrs) {
      let tooltip = null;
      let timer = null;

      function showTip() {
        let title = $attrs.pressTip;
        console.log($attrs, title);
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
        tooltip.show();
      }

      $element.on('mouseenter', (e) => {
        timer = setTimeout(() => {
          showTip();
        }, 100);
      });

      $element.on('mousedown touchstart', (e) => {
        e.preventDefault();
        showTip();
      });

      $element.on('mouseup mouseleave touchend', (e) => {
        e.preventDefault();
        if (tooltip) {
          tooltip.dispose();
          tooltip = null;
        }
        clearTimeout(timer);
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
