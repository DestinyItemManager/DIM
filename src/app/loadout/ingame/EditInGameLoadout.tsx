import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import Sheet from 'app/dim-ui/Sheet';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { compareBy } from 'app/utils/comparators';
import clsx from 'clsx';
import { t } from 'i18next';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './EditInGameLoadout.m.scss';
import InGameLoadoutIcon from './InGameLoadoutIcon';
import { editInGameLoadout, snapshotInGameLoadout } from './ingame-loadout-apply';
import { availableLoadoutSlotsSelector, inGameLoadoutsForCharacterSelector } from './selectors';

/** An editor sheet for whatever we can edit with ingame loadouts. Name, color, icon. */
export default function EditInGameLoadout({
  loadout,
  characterId,
  onClose,
}: {
  loadout?: InGameLoadout;
  characterId?: string;
  onClose: () => void;
} & (
  | { loadout: InGameLoadout; characterId?: undefined }
  | { loadout?: undefined; characterId: string }
)) {
  const defs = useD2Definitions()!;
  const dispatch = useThunkDispatch();

  const names = Object.values(defs.LoadoutName.getAll())
    .filter((i) => !i.redacted)
    .sort(compareBy((n) => n.index));
  const colors = Object.values(defs.LoadoutColor.getAll())
    .filter((i) => !i.redacted)
    .sort(compareBy((n) => n.index));
  const icons = Object.values(defs.LoadoutIcon.getAll())
    .filter((i) => !i.redacted)
    .sort(compareBy((n) => n.index));

  const [nameHash, setNameHash] = useState(loadout?.nameHash ?? names[0].hash);
  const [colorHash, setColorHash] = useState(loadout?.colorHash ?? colors[0].hash);
  const [iconHash, setIconHash] = useState(loadout?.iconHash ?? icons[0].hash);

  const loadouts = useSelector((state: RootState) =>
    inGameLoadoutsForCharacterSelector(state, characterId!)
  );
  const numSlots = useSelector(availableLoadoutSlotsSelector);
  let firstAvailableSlot = 0;
  for (let i = 0; i < numSlots; i++) {
    if (!loadouts.some((l) => l.index === i)) {
      firstAvailableSlot = i;
      break;
    }
  }
  const [slot, setSlot] = useState(firstAvailableSlot);
  const overwriting = loadouts.some((l) => l.index === slot);

  const name = defs.LoadoutName.get(nameHash)?.name ?? 'Unknown';
  const colorIcon = defs.LoadoutColor.get(colorHash)?.colorImagePath ?? '';
  const icon = defs.LoadoutIcon.get(iconHash)?.iconImagePath ?? '';

  const creating = loadout === undefined;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (creating) {
        await dispatch(
          snapshotInGameLoadout({
            nameHash,
            colorHash,
            iconHash,
            name,
            colorIcon,
            icon,
            index: slot,
            characterId: characterId!,
            items: [],
            id: `ingame-${characterId}-${slot}`,
          })
        );
      } else {
        await dispatch(
          editInGameLoadout({ ...loadout, nameHash, name, colorHash, colorIcon, iconHash, icon })
        );
      }
    } finally {
      onClose();
    }
  };

  const footer = (
    <form onSubmit={handleSave}>
      <button type="submit" className="dim-button">
        {creating
          ? overwriting
            ? t('InGameLoadout.Replace')
            : t('InGameLoadout.Create')
          : t('InGameLoadout.Save')}
      </button>
    </form>
  );

  console.log({ numSlots });

  return (
    <Sheet
      onClose={onClose}
      footer={footer}
      header={
        <h1 className={styles.header}>
          {creating ? t('InGameLoadout.CreateTitle') : t('InGameLoadout.EditTitle')}
        </h1>
      }
    >
      <div className={styles.content}>
        {creating && (
          <div className={styles.slots}>
            {Array.from(new Array(numSlots), (_value, i) => {
              const loadout = loadouts.find((l) => l.index === i);
              return (
                <RadioButton key={i} name="slot" option={i} value={slot} onSelected={setSlot}>
                  {loadout ? (
                    <InGameLoadoutIcon loadout={loadout} />
                  ) : (
                    <div className={styles.emptySlot} />
                  )}
                  <div className={styles.slotNum}>{i + 1}</div>
                </RadioButton>
              );
            })}
          </div>
        )}
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
              onSelected={setNameHash}
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
              name="color"
              option={color.hash}
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
  option: hash,
  name,
  value,
  onSelected,
  children,
  className,
}: {
  option: number;
  name: string;
  value: number;
  onSelected: (value: number) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      key={hash}
      className={clsx(styles.button, className, {
        [styles.checked]: value === hash,
      })}
    >
      <input
        type="radio"
        name={name}
        value={hash}
        checked={value === hash}
        readOnly={true}
        onClick={() => onSelected(hash)}
      />
      {children}
    </label>
  );
}
