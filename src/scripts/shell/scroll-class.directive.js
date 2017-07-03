/**
 * A simple directive that will add or remove a class to the body of the document if the document has been scrolled.
 */
export function ScrollClass() {
  return {
    restrict: 'A',
    scope: {},
    link: function($scope, elem, attrs) {
      let prevScrolled;

      function stickyHeader(e) {
        const scrolled = document.body.scrollTop !== 0;
        if (scrolled !== prevScrolled) {
          $(document.body).toggleClass(attrs.scrollClass, scrolled);
        }
        prevScrolled = scrolled;
      }

      $(document).on('scroll', stickyHeader);

      $scope.$on('$destroy', () => {
        $(document).off('scroll', stickyHeader);
      });
    }
  };
}
