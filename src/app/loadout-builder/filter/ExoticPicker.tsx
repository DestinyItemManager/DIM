import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { escapeRegExp } from 'app/search/search-filters/freeform';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { compareBy } from 'app/utils/comparators';
import { TierType } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { Dispatch, useMemo, useState } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { LockedExotic } from '../types';
import styles from './ExoticPicker.m.scss';

interface LockedExoticWithPerk extends LockedExotic {
  exoticPerk: PluggableInventoryItemDefinition;
  shortPerkDescription?: string;
}

interface Props {
  defs: D2ManifestDefinitions;
  /** A list of item hashes for unlocked exotics. */
  availableExotics?: DimItem[];
  isPhonePortrait: boolean;
  language: string;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

/** A drawer to select an exotic for your build. */
function ExoticPicker({
  defs,
  availableExotics,
  isPhonePortrait,
  language,
  lbDispatch,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');

  const lockableExotics = useMemo(() => {
    const rtn: LockedExoticWithPerk[] = [];

    if (availableExotics?.length) {
      const uniqueExotics = _.uniqBy(availableExotics, (item) => item.hash);

      for (const item of uniqueExotics) {
        const def = defs.InventoryItem.get(item.hash);
        const exoticPerk = item.sockets?.allSockets.find(
          (socket) =>
            socket.plugged &&
            socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics &&
            socket.plugged.plugDef.inventory?.tierType === TierType.Exotic
        )?.plugged?.plugDef;

        let shortPerkDescription;

        for (const perk of exoticPerk?.perks || []) {
          const description = defs.SandboxPerk.get(perk.perkHash)?.displayProperties.description;
          if (description) {
            shortPerkDescription = description;
            break;
          }
        }

        if (def?.displayProperties.hasIcon && exoticPerk) {
          rtn.push({ def, bucketHash: item.bucket.hash, exoticPerk, shortPerkDescription });
        }
      }
    }

    return rtn;
  }, [availableExotics, defs]);

  const filteredOrderedAndGroupedExotics = useMemo(() => {
    // Only some languages effectively use the \b regex word boundary
    const regexp = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
      ? new RegExp(`\\b${escapeRegExp(query)}`, 'i')
      : new RegExp(escapeRegExp(query), 'i');

    const filteredExotics = query.length
      ? lockableExotics.filter(
          (exotic) =>
            regexp.test(exotic.def.displayProperties.name) ||
            regexp.test(exotic.def.displayProperties.description) ||
            regexp.test(exotic.exoticPerk.displayProperties.name) ||
            regexp.test(exotic.exoticPerk.displayProperties.description)
        )
      : lockableExotics;

    // Group by itemTypeDisplayName then preserve the initial ordering as they were already
    // ordered helmet, arms, chest, and legs
    const groupedExotics = _.groupBy(filteredExotics, (exotic) => exotic.def.itemTypeDisplayName);
    const orderedAndGroupedExotics = Object.values(groupedExotics).sort(
      compareBy((exotics) => filteredExotics.indexOf(exotics[0]))
    );

    return orderedAndGroupedExotics;
  }, [language, query, lockableExotics]);

  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  return (
    <Sheet
      header={
        <div>
          <h1>{t('LB.ChooseAnExotic')}</h1>
          <div className="item-picker-search">
            <div className="search-filter" role="search">
              <AppIcon icon={searchIcon} className="search-bar-icon" />
              <input
                className="filter-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                autoFocus={autoFocus}
                placeholder={t('LB.SearchAnExotic')}
                type="text"
                name="filter"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
            </div>
          </div>
        </div>
      }
      onClose={onClose}
      freezeInitialHeight={true}
    >
      {({ onClose }) => (
        <div className={styles.container}>
          {filteredOrderedAndGroupedExotics.map((exotics) => (
            <div key={exotics[0].def.itemTypeDisplayName}>
              <div className={styles.header}>{exotics[0].def.itemTypeDisplayName}</div>
              <div className={styles.items}>
                {exotics.map((exotic) => (
                  <div
                    key={exotic.def.hash}
                    className={styles.exotic}
                    onClick={() => {
                      lbDispatch({ type: 'lockExotic', lockedExotic: exotic });
                      onClose();
                    }}
                  >
                    <div className={styles.itemImage}>
                      <DefItemIcon itemDef={exotic.def} defs={defs} />
                    </div>
                    <div className={styles.info}>
                      <div className={styles.itemName}>{exotic.def.displayProperties.name}</div>
                      <div className={styles.perkNameAndImage}>
                        <DefItemIcon
                          className={styles.perkImage}
                          itemDef={exotic.exoticPerk}
                          defs={defs}
                        />
                        <div className={styles.perkName}>
                          {exotic.exoticPerk.displayProperties.name}
                        </div>
                      </div>
                      <div className={styles.perkDescription}>{exotic.shortPerkDescription}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

export default ExoticPicker;
