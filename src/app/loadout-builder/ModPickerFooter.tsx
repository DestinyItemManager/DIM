import React from 'react';
import { t } from 'app/i18next-t';

import styles from './ModPickerFooter.m.scss';
import GlobalHotkeys from 'app/hotkeys/GlobalHotkeys';
import { LockedArmor2ModMap, LockedArmor2Mod } from './types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import LockedArmor2ModIcon from './LockedArmor2ModIcon';

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

  return (
    <div className={styles.footer}>
      <div>
        <button className={styles.submitButton} onClick={onSubmit}>
          {!isPhonePortrait && '⏎ '}
          {t('LoadoutBuilder.SelectPerks')}
        </button>
      </div>
      <div className={styles.selectedMods}>
        {categoryOrder.map(
          (category) =>
            lockedArmor2Mods[category.category] && (
              <React.Fragment key={category.category}>
                {lockedArmor2Mods[category.category]?.map((lockedItem) => (
                  <LockedArmor2ModIcon
                    key={lockedItem.mod.hash}
                    item={lockedItem}
                    defs={defs}
                    onModClicked={() => onModSelected(lockedItem)}
                  />
                ))}
              </React.Fragment>
            )
        )}
        <GlobalHotkeys
          hotkeys={[
            {
              combo: 'enter',
              description: t('LoadoutBuilder.SelectPerks'),
              callback: onSubmit
            }
          ]}
        />
      </div>
    </div>
  );
}

export default ModPickerFooter;
