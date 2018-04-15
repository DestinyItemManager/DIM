import Popper from 'popper.js';
import { IDirective } from 'angular';

/**
 * Common functionality for positioning a popup next to an item (or
 * item-like thing).  To use, add the "item-popup" attribute to the
 * root of your ngDialog template, and pass the element you want to
 * pop next to in the "data" option of the ngDialog call.  If you want
 * an arrow to show, also include a (properly styled) element with the
 * class "arrow" somewhere in your popup template.
 */
export function ItemPopup(): IDirective {
  return {
    restrict: 'A',
    link: ItemPopupLink
  };
}

function ItemPopupLink($scope, _$element, $attrs) {
  'ngInject';

  // Capture the dialog element
  let dialog: any = null;
  $scope.$on('ngDialog.opened', (_event, $dialog) => {
    dialog = $dialog;
    reposition();
  });

  let popper;
  $scope.$on('$destroy', () => {
    if (popper) {
      popper.destroy();
    }
  });

  $scope.$on('popup-size-changed', reposition);

  function findDialogData() {
    let scope = $scope;
    let element = scope.ngDialogData;
    while (!element && scope.$parent) {
      scope = scope.$parent;
      element = scope.ngDialogData;
    }
    return element;
  }

  // Reposition the popup as it is shown or if its size changes
  function reposition() {
    const element = findDialogData();
    if (element) {
      if (popper) {
        popper.scheduleUpdate();
      } else {
        const popperOptions = {
          placement: 'top-start',
          eventsEnabled: false,
          modifiers: {
            preventOverflow: {
              priority: ['bottom', 'top', 'right', 'left']
            },
            flip: {
              behavior: ['top', 'bottom', 'right', 'left']
            },
            offset: {
              offset: '0,5px'
            },
            arrow: {
              element: '.arrow'
            }
          }
        } as any;

        const boundariesElement = $attrs.itemPopupBoundaryClass ? document.getElementsByClassName($attrs.itemPopupBoundaryClass)[0] : undefined;
        if (boundariesElement) {
          popperOptions.modifiers.preventOverflow.boundariesElement = boundariesElement;
          popperOptions.modifiers.flip.boundariesElement = boundariesElement;
        }

        popper = new Popper(element, dialog[0], popperOptions);
        popper.scheduleUpdate(); // helps fix arrow position
      }
    }
  }
}
