import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export const makeCustomIcon = (name, width, height, pathData): IconDefinition => ({
  iconName: `dim${name}` as any,
  prefix: 'dim' as any,
  icon: [width, height, [], '', pathData]
});
