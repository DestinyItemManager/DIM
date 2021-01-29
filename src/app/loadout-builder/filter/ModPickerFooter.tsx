import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import React from 'react';
import { LockedArmor2Mod, LockedArmor2ModMap } from '../types';
import LockedArmor2ModIcon from './LockedArmor2ModIcon';
import styles from './ModPickerFooter.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  groupOrder: { plugCategoryHashes: number[] }[];
  isPhonePortrait: boolean;
  lockedArmor2Mods: LockedArmor2ModMap;
  onSubmit(event: React.FormEvent | KeyboardEvent): void;
  onModSelected(item: LockedArmor2Mod): void;
}

function ModPickerFooter({
  defs,
  isPhonePortrait,
  groupOrder,
  lockedArmor2Mods,
  onSubmit,
  onModSelected,
}: Props) {
  useHotkey('enter', t('LB.SelectMods'), onSubmit);

  return (
    <div className={styles.footer}>
      <div>
        <button type="button" className={styles.submitButton} onClick={onSubmit}>
          {!isPhonePortrait && '⏎ '}
          {t('LB.SelectMods')}
        </button>
      </div>
      <div className={styles.selectedMods}>
        {groupOrder.map((group) =>
          group.plugCategoryHashes.map(
            (pch) =>
              pch in lockedArmor2Mods && (
                <React.Fragment key={pch}>
                  {lockedArmor2Mods[pch]?.map((lockedItem) => (
                    <LockedArmor2ModIcon
                      key={lockedItem.key}
                      item={lockedItem}
                      defs={defs}
                      onModClicked={() => onModSelected(lockedItem)}
                    />
                  ))}
                </React.Fragment>
              )
          )
        )}
      </div>
    </div>
  );
}

export default ModPickerFooter;
