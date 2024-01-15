import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './EditInGameLoadout.m.scss';
import InGameLoadoutIcon from './InGameLoadoutIcon';
import { RadioButton } from './RadioButton';
import SelectInGameLoadoutIdentifiers, {
  useIdentifierValues,
} from './SelectInGameLoadoutIdentifiers';
import { availableLoadoutSlotsSelector, inGameLoadoutsForCharacterSelector } from './selectors';

export type EditInGameLoadoutSaveHandler = (
  nameHash: number,
  colorHash: number,
  iconHash: number,
  slot: number,
) => Promise<void>;

/** An editor sheet for whatever we can edit with ingame loadouts. Name, color, icon. */
export default function EditInGameLoadout({
  loadout,
  characterId,
  onClose,
  onSave,
}: {
  loadout?: InGameLoadout;
  characterId?: string;
  onSave: EditInGameLoadoutSaveHandler;
  onClose: () => void;
} & (
  | { loadout: InGameLoadout; characterId?: undefined }
  | { loadout?: undefined; characterId: string }
)) {
  const defs = useD2Definitions()!;

  const [names, colors, icons] = useIdentifierValues(defs);
  const defaultName = names[0].hash;
  const defaultColor = colors[0].hash;
  const defaultIcon = icons[0].hash;

  const loadouts = useSelector((state: RootState) =>
    inGameLoadoutsForCharacterSelector(state, characterId!),
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
  const overwrittenLoadout = loadouts.find((l) => l.index === slot);
  const wouldOverwrite = Boolean(overwrittenLoadout);

  const [nameHash, setNameHash] = useState(
    loadout?.nameHash ?? overwrittenLoadout?.nameHash ?? defaultName,
  );
  const [colorHash, setColorHash] = useState(
    loadout?.colorHash ?? overwrittenLoadout?.colorHash ?? defaultColor,
  );
  const [iconHash, setIconHash] = useState(
    loadout?.iconHash ?? overwrittenLoadout?.iconHash ?? defaultIcon,
  );

  const handleSetSlot = (newSlotNum: number) => {
    const destSlotLoadout = loadouts.find((l) => l.index === newSlotNum);

    if (
      destSlotLoadout &&
      ((nameHash === defaultName && colorHash === defaultColor && iconHash === defaultIcon) ||
        (overwrittenLoadout &&
          nameHash === overwrittenLoadout.nameHash &&
          colorHash === overwrittenLoadout.colorHash &&
          iconHash === overwrittenLoadout.iconHash))
    ) {
      setNameHash(destSlotLoadout.nameHash);
      setColorHash(destSlotLoadout.colorHash);
      setIconHash(destSlotLoadout.iconHash);
    }

    setSlot(newSlotNum);
  };

  const creating = loadout === undefined;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(nameHash, colorHash, iconHash, slot);
    } finally {
      onClose();
    }
  };

  const footer = (
    <form onSubmit={handleSave}>
      <button type="submit" className="dim-button">
        {creating
          ? wouldOverwrite
            ? t('InGameLoadout.Replace', { index: slot + 1 })
            : t('InGameLoadout.Create')
          : t('InGameLoadout.Save')}
      </button>
    </form>
  );

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
                <RadioButton
                  key={i}
                  name="slot"
                  option={i}
                  value={slot}
                  onSelected={handleSetSlot}
                  hasLoadout={Boolean(loadout)}
                  spaced
                >
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
        <SelectInGameLoadoutIdentifiers
          nameHash={nameHash}
          colorHash={colorHash}
          iconHash={iconHash}
          onNameHashChanged={setNameHash}
          onColorHashChanged={setColorHash}
          onIconHashChanged={setIconHash}
        />
      </div>
    </Sheet>
  );
}
