import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import Sheet from 'app/dim-ui/Sheet';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { t } from 'i18next';
import { useState } from 'react';
import styles from './EditInGameLoadout.m.scss';
import { editInGameLoadout } from './ingame-loadout-apply';

/** An editor sheet for whatever we can edit with ingame loadouts. Name, color, icon. */
export default function EditInGameLoadout({
  loadout,
  onClose,
}: {
  loadout: InGameLoadout;
  onClose: () => void;
}) {
  const [nameHash, setNameHash] = useState(loadout.nameHash);
  const [colorHash, setColorHash] = useState(loadout.colorHash);
  const [iconHash, setIconHash] = useState(loadout.iconHash);

  const defs = useD2Definitions()!;
  const dispatch = useThunkDispatch();

  const names = Object.values(defs.LoadoutName.getAll()).filter((i) => !i.redacted);
  const colors = Object.values(defs.LoadoutColor.getAll()).filter((i) => !i.redacted);
  const icons = Object.values(defs.LoadoutIcon.getAll()).filter((i) => !i.redacted);

  const name = defs.LoadoutName.get(nameHash)?.name ?? 'Unknown';
  const colorIcon = defs.LoadoutColor.get(colorHash)?.colorImagePath ?? '';
  const icon = defs.LoadoutIcon.get(iconHash)?.iconImagePath ?? '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(
        editInGameLoadout({ ...loadout, nameHash, name, colorHash, colorIcon, iconHash, icon })
      );
    } finally {
      onClose();
    }
  };

  const footer = (
    <form onSubmit={handleSave}>
      <button type="submit" className="dim-button">
        {t('InGameLoadout.Save')}
      </button>
    </form>
  );

  return (
    <Sheet
      onClose={onClose}
      footer={footer}
      header={<h1 className={styles.header}>{t('InGameLoadout.EditTitle')}</h1>}
    >
      <div className={styles.content}>
        <div className={styles.preview}>
          <BungieImage style={bungieBackgroundStyle(colorIcon)} src={icon} height={64} width={64} />{' '}
          {name}
        </div>
        <div className={styles.row}>
          {names.map((name) => (
            <RadioButton key={name.hash} item={name} value={nameHash} onSelected={setNameHash}>
              {name.name}
            </RadioButton>
          ))}
        </div>
        <div className={styles.row}>
          {icons.map((icon) => (
            <RadioButton
              key={icon.hash}
              item={icon}
              value={iconHash}
              onSelected={setIconHash}
              className={styles.imageButton}
            >
              <BungieImage key={icon.hash} src={icon.iconImagePath} height={32} width={32} />
            </RadioButton>
          ))}
        </div>
        <div className={styles.row}>
          {colors.map((color) => (
            <RadioButton
              key={color.hash}
              item={color}
              value={colorHash}
              onSelected={setColorHash}
              className={styles.imageButton}
            >
              <BungieImage key={color.hash} src={color.colorImagePath} height={32} width={32} />
            </RadioButton>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function RadioButton({
  item,
  value,
  onSelected,
  children,
  className,
}: {
  item: { hash: number };
  value: number;
  onSelected: (value: number) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const hash = item.hash;
  return (
    <label
      key={hash}
      className={clsx(styles.button, className, {
        [styles.checked]: value === hash,
      })}
    >
      <input
        type="radio"
        name="name"
        value={item.hash}
        checked={value === hash}
        readOnly={true}
        onClick={() => onSelected(hash)}
      />
      {children}
    </label>
  );
}
