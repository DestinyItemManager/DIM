import { icon as faIcon } from '@fortawesome/fontawesome-svg-core';
import * as Library from './Library';

export const renderToHtmlByLibraryName = (icon: string) => {
  const iconDef = Library[icon];
  const rendered = faIcon(iconDef);

  if (rendered) {
    return `${rendered.html[0]}`;
  }

  return undefined;
};
