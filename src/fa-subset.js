import { fontawesomeSubset } from 'fontawesome-subset';
import fs from 'node:fs/promises';
import * as icons from './app/shell/icons/Library.js';

const subset = {};

let fontCss = `
/* stylelint-disable */
@use 'sass:string';
@use './font-awesome-icon-variables.scss' as *;

// Convenience function used to set content property
@function fa-content($fa-var) {
  @return string.unquote('"#{ $fa-var }"');
}
`;

for (const icon of Object.values(icons)) {
  if (typeof icon === 'string') {
    const [lib, symbol] = icon.split(' ');
    const iconName = symbol.replace('fa-', '');
    const libName =
      lib === 'fas' ? 'solid' : lib === 'far' ? 'regular' : lib === 'fab' ? 'brands' : undefined;
    if (!libName) {
      throw new Error('Unknown library');
    }
    subset[libName] ||= [];
    subset[libName].push(iconName);
    fontCss = fontCss.concat(
      `.fa-${iconName}:before { content: fa-content($fa-var-${iconName}); }\n`,
    );
  }
}

await fontawesomeSubset(subset, 'src/data/webfonts');

await fs.writeFile('src/app/shell/icons/font-awesome.scss', fontCss);
