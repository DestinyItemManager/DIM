import { IDirective, IDocumentService, ITimeoutService } from 'angular';

export function ClickAnywhereButHere(
  $document: IDocumentService,
  $timeout: ITimeoutService
): IDirective {
  'ngInject';

  return {
    restrict: 'A',
    link(scope, element, attr) {
      const handler = (event) => {
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
