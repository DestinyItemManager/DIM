import { IDirective } from 'angular';

/**
 * A simple directive that will add or remove a class to the body of the document if the document has been scrolled.
 */
export function ScrollClass(): IDirective {
  return {
    restrict: 'A',
    scope: {},
    link($scope, elem, attrs) {
      const threshold = attrs.scrollClassThreshold || 0;

      function stickyHeader() {
        const scrolled = Boolean(
          document.body.scrollTop > threshold ||
            (document.documentElement && document.documentElement.scrollTop > threshold)
        );
        elem[0].classList.toggle(attrs.scrollClass, scrolled);
      }

      let rafTimer;
      function scrollHandler() {
        cancelAnimationFrame(rafTimer);
        rafTimer = requestAnimationFrame(stickyHeader);
      }

      document.addEventListener('scroll', scrollHandler, false);

      $scope.$on('$destroy', () => {
        document.removeEventListener('scroll', scrollHandler);
        cancelAnimationFrame(rafTimer);
      });
    }
  };
}
