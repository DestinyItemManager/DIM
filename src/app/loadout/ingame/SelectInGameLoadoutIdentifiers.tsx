import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { resolveInGameLoadoutIdentifiers } from 'app/loadout/loadout-type-converters';
import { useD2Definitions } from 'app/manifest/selectors';
import { compareBy } from 'app/utils/comparators';
import { useMemo } from 'react';
import { RadioButton } from './RadioButton';
import * as styles from './SelectInGameLoadoutIdentifiers.m.scss';

/** Selection controls for choosing an in-game loadout identifier (name, color,
 * icon). A controlled component. */
export default function SelectInGameLoadoutIdentifiers({
  nameHash,
  colorHash,
  iconHash,
  onNameHashChanged,
  onColorHashChanged,
  onIconHashChanged,
}: {
  nameHash: number;
  colorHash: number;
  iconHash: number;
  onNameHashChanged: (nameHash: number) => void;
  onColorHashChanged: (colorHash: number) => void;
  onIconHashChanged: (iconHash: number) => void;
}) {
  const defs = useD2Definitions()!;

  const [names, colors, icons] = useIdentifierValues(defs);
  const { name, colorIcon, icon } = resolveInGameLoadoutIdentifiers(defs, {
    nameHash,
    colorHash,
    iconHash,
  });

  return (
    <>
      <div className={styles.preview}>
        <BungieImage style={bungieBackgroundStyle(colorIcon)} src={icon} height={48} width={48} />{' '}
        {name}
      </div>
      <div className={styles.row}>
        {names.map((name) => (
          <RadioButton
            key={name.hash}
            name="name"
            option={name.hash}
            value={nameHash}
            onSelected={onNameHashChanged}
          >
            {name.name}
          </RadioButton>
        ))}
      </div>
      <div className={styles.row}>
        {icons.map((icon) => (
          <RadioButton
            key={icon.hash}
            name="icon"
            option={icon.hash}
            value={iconHash}
            onSelected={onIconHashChanged}
            spaced
          >
            <BungieImage key={icon.hash} src={icon.iconImagePath} height={32} width={32} />
          </RadioButton>
        ))}
      </div>
      <div className={styles.row}>
        {colors.map((color) => (
          <RadioButton
            key={color.hash}
            name="color"
            option={color.hash}
            value={colorHash}
            onSelected={onColorHashChanged}
            spaced
          >
            <BungieImage key={color.hash} src={color.colorImagePath} height={32} width={32} />
          </RadioButton>
        ))}
      </div>
    </>
  );
}

export function useIdentifierValues(defs: D2ManifestDefinitions) {
  return useMemo(() => {
    const names = Object.values(defs.LoadoutName.getAll())
      .filter((i) => !i.redacted)
      .sort(compareBy((n) => n.index));
    const colors = Object.values(defs.LoadoutColor.getAll())
      .filter((i) => !i.redacted)
      .sort(compareBy((n) => n.index));
    const icons = Object.values(defs.LoadoutIcon.getAll())
      .filter((i) => !i.redacted)
      .sort(compareBy((n) => n.index));
    return [names, colors, icons] as const;
  }, [defs]);
}
