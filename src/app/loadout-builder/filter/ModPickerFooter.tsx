import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import React from 'react';
import LockedModIcon from './LockedModIcon';
import styles from './ModPickerFooter.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  groupOrder: { plugCategoryHashes: number[] }[];
  isPhonePortrait: boolean;
  lockedMods: { [plugCategoryHash: number]: PluggableInventoryItemDefinition[] | undefined };
  onSubmit(event: React.FormEvent | KeyboardEvent): void;
  onModSelected(item: PluggableInventoryItemDefinition): void;
}

function ModPickerFooter({
  defs,
  isPhonePortrait,
  groupOrder,
  lockedMods,
  onSubmit,
  onModSelected,
}: Props) {
  useHotkey('enter', t('LB.SelectMods'), onSubmit);

  // used for creating unique keys for the mods
  const modCounts = {};

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
              pch in lockedMods && (
                <React.Fragment key={pch}>
                  {lockedMods[pch]?.map((mod) => {
                    if (!modCounts[mod.hash]) {
                      modCounts[mod.hash] = 0;
                    }

                    return (
                      <LockedModIcon
                        key={`${mod.hash}-${++modCounts[mod.hash]}`}
                        mod={mod}
                        defs={defs}
                        onModClicked={() => onModSelected(mod)}
                      />
                    );
                  })}
                </React.Fragment>
              )
          )
        )}
      </div>
    </div>
  );
}

export default ModPickerFooter;
