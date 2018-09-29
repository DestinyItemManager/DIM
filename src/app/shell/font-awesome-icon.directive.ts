import { IDirective } from 'angular';
import { renderToHtmlByLibraryName } from './icons';

export function FontAwesomeIcon(): IDirective {
  'ngInject';

  return {
    restrict: 'E',
    replace: true,
    scope: {
      icon: '@icon'
    },
    template(_, attr) {
      const { icon } = attr;

      const iconDefinition = renderToHtmlByLibraryName(`${icon}Icon`);

      if (iconDefinition) {
        return `<i class="fa">${iconDefinition}</i>`;
      }

      return '';
    }
  };
}
