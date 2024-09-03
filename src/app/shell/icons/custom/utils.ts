import { IconDefinition, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

export const makeCustomIcon = (
  name: string,
  width: number,
  height: number,
  pathData: string,
): IconDefinition => ({
  iconName: `dim${name}` as unknown as IconName,
  prefix: 'dim' as IconPrefix,
  icon: [width, height, [], '', pathData],
});
