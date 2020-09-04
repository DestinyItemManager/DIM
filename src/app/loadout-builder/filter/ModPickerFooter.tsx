import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import React from 'react';
import { LockedArmor2Mod, LockedArmor2ModMap } from '../types';
import LockedArmor2ModIcon from './LockedArmor2ModIcon';
import styles from './ModPickerFooter.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  categoryOrder: { category: number | 'seasonal'; translatedName: string }[];
  isPhonePortrait: boolean;
  lockedArmor2Mods: LockedArmor2ModMap;
  onSubmit(event: React.FormEvent | KeyboardEvent): void;
  onModSelected(item: LockedArmor2Mod): void;
}

function ModPickerFooter(props: Props) {
  const { defs, isPhonePortrait, categoryOrder, lockedArmor2Mods, onSubmit, onModSelected } = props;

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
        {categoryOrder.map(
          (category) =>
            lockedArmor2Mods[category.category] && (
              <React.Fragment key={category.category}>
                {lockedArmor2Mods[category.category]?.map((lockedItem) => (
                  <LockedArmor2ModIcon
                    key={lockedItem.key}
                    item={lockedItem}
                    defs={defs}
                    onModClicked={() => onModSelected(lockedItem)}
                  />
                ))}
              </React.Fragment>
            )
        )}
      </div>
    </div>
  );
}

export default ModPickerFooter;
