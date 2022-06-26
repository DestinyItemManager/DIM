import { fontawesomeSubset } from 'fontawesome-subset';

import * as icons from './app/shell/icons/Library.mjs';

const subset = {};

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
  }
}

fontawesomeSubset(subset, 'src/data/webfonts');
