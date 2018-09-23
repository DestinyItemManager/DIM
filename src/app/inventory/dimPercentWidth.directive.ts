import { IDirective } from 'angular';

export function percent(val: number): string {
  return `${Math.min(100, Math.floor(100 * val))}%`;
}

// Set the width of an element to a percentage, given a [0,1] input.
export function PercentWidth(): IDirective {
  return {
    restrict: 'A',
    link(scope, element, attrs) {
      scope.$watch(attrs.dimPercentWidth, (val?: number) => {
        if (!val) {
          val = 0;
        }
        element.css({ width: percent(val) });
      });
    }
  };
}
