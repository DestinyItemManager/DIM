import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, profileResponseSelector } from 'app/inventory/selectors';
import { plugIsInsertable } from 'app/item-popup/SocketDetails';
import { d2ManifestSelector, useD2Definitions } from 'app/manifest/selectors';
import { itemsForPlugSet } from 'app/records/plugset-helpers';
import { startWordRegexp } from 'app/search/search-filters/freeform';
import { SearchFilterRef } from 'app/search/SearchBar';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { DestinyClass, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import { isArmor2WithStats } from '../item-utils';
import { isInsertableArmor2Mod, sortModGroups, sortMods } from '../mod-utils';
import ModPickerFooter from './ModPickerFooter';
import ModPickerSection from './ModPickerSection';

interface ProvidedProps {
  /**
   * An array of mods that are already locked.
   */
  lockedMods: PluggableInventoryItemDefinition[];
  /**
   * The DestinyClass instance that is used to filter items on when building up the
   * set of available mods.
   */
  classType: DestinyClass;
  /** A query string that is passed to the filtering logic to prefilter the available mods. */
  initialQuery?: string;
  /** Called with the new lockedMods when the user accepts the new modset. */
  onAccept(newLockedMods: PluggableInventoryItemDefinition[]): void;
  /** Called when the user accepts the new modset of closes the sheet. */
  onClose(): void;
}

interface StoreProps {
  language: string;
  /**
   * An array of mods built from looking at the current DestinyClass's
   * items and finding all the available mods that could be socketed.
   */
  mods: PluggableInventoryItemDefinition[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  /** Build the hashes of all plug set item hashes that are unlocked by any character/profile. */
  const unlockedModsSelector = createSelector(
    profileResponseSelector,
    allItemsSelector,
    d2ManifestSelector,
    (_state: RootState, props: ProvidedProps) => props.classType,
    (
      profileResponse: DestinyProfileResponse,
      allItems: DimItem[],
      defs: D2ManifestDefinitions,
      classType?: DestinyClass
    ): PluggableInventoryItemDefinition[] => {
      const plugSets: { [bucketHash: number]: Set<number> } = {};
      if (!profileResponse || classType === undefined) {
        return [];
      }

      // 1. loop through all items, build up a map of mod sockets by bucket
      for (const item of allItems) {
        if (
          !item ||
          !item.sockets ||
          // Makes sure its an armour 2.0 item
          !isArmor2WithStats(item) ||
          // If classType is passed in only use items from said class otherwise use
          // items from all characters. Usefull if in loadouts and only mods and guns.
          !(classType === DestinyClass.Unknown || item.classType === classType)
        ) {
          continue;
        }
        if (!plugSets[item.bucket.hash]) {
          plugSets[item.bucket.hash] = new Set<number>();
        }
        // build the filtered unique mods
        item.sockets.allSockets
          .filter((s) => !s.isPerk)
          .forEach((socket) => {
            if (socket.socketDefinition.reusablePlugSetHash) {
              plugSets[item.bucket.hash].add(socket.socketDefinition.reusablePlugSetHash);
            }
          });
      }

      // 2. for each unique socket (type?) get a list of unlocked mods
      const allUnlockedMods = Object.values(plugSets).flatMap((sets) => {
        const unlockedPlugs: number[] = [];

        for (const plugSetHash of sets) {
          const plugSetItems = itemsForPlugSet(profileResponse, plugSetHash);
          for (const plugSetItem of plugSetItems) {
            if (plugIsInsertable(plugSetItem)) {
              unlockedPlugs.push(plugSetItem.plugItemHash);
            }
          }
        }

        const finalMods: PluggableInventoryItemDefinition[] = [];

        for (const plug of unlockedPlugs) {
          const def = defs.InventoryItem.get(plug);

          if (isInsertableArmor2Mod(def)) {
            finalMods.push(def);
          }
        }

        return finalMods.sort(sortMods);
      });

      return _.uniqBy(allUnlockedMods, (unlocked) => unlocked.hash);
    }
  );
  return (state: RootState, props: ProvidedProps): StoreProps => ({
    language: languageSelector(state),
    mods: unlockedModsSelector(state, props),
  });
}

/**
 * A sheet to pick mods that are required in the final loadout sets.
 */
function ModPicker({ mods, language, lockedMods, initialQuery, onAccept, onClose }: Props) {
  const defs = useD2Definitions()!;
  const [query, setQuery] = useState(initialQuery || '');
  const [lockedModsInternal, setLockedModsInternal] = useState(() => [...lockedMods]);
  const filterInput = useRef<SearchFilterRef | null>(null);
  const isPhonePortrait = useIsPhonePortrait();

  useEffect(() => {
    if (!isPhonePortrait && filterInput.current) {
      filterInput.current.focusFilterInput();
    }
  }, [isPhonePortrait, filterInput]);

  /** Add a new mod to the internal mod picker state */
  const onModSelected = useCallback(
    (mod: PluggableInventoryItemDefinition) => {
      setLockedModsInternal((oldState) => {
        const newState = [...oldState];
        newState.push(mod);
        return newState.sort(sortMods);
      });
    },
    [setLockedModsInternal]
  );

  /** Remove a mod from the internal mod picker state */
  const onModRemoved = useCallback(
    (mod: PluggableInventoryItemDefinition) => {
      setLockedModsInternal((oldState) => {
        const firstIndex = oldState.findIndex((locked) => locked.hash === mod.hash);

        if (firstIndex >= 0) {
          const newState = [...oldState];
          newState.splice(firstIndex, 1);
          return newState;
        }

        return oldState;
      });
    },
    [setLockedModsInternal]
  );

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    onAccept(lockedModsInternal);
    onClose();
  };

  const queryFilteredMods = useMemo(() => {
    const regexp = startWordRegexp(query, language);
    return query.length
      ? mods.filter(
          (mod) =>
            regexp.test(mod.displayProperties.name) ||
            regexp.test(mod.displayProperties.description) ||
            regexp.test(mod.itemTypeDisplayName) ||
            (query.startsWith('plugCategoryHash:in:') &&
              query.includes(`${mod.plug.plugCategoryHash}`)) ||
            mod.perks.some((perk) => {
              const perkDef = defs.SandboxPerk.get(perk.perkHash);
              return (
                perkDef &&
                (regexp.test(perkDef.displayProperties.name) ||
                  regexp.test(perkDef.displayProperties.description) ||
                  regexp.test(perk.requirementDisplayString))
              );
            })
        )
      : mods;
  }, [language, query, mods, defs.SandboxPerk]);

  const groupedMods = Object.values(
    _.groupBy(queryFilteredMods, (mod) => mod.plug.plugCategoryHash)
  ).sort(sortModGroups);

  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  const footer = lockedModsInternal.length
    ? ({ onClose }: { onClose(): void }) => (
        <ModPickerFooter
          lockedModsInternal={lockedModsInternal}
          isPhonePortrait={isPhonePortrait}
          onSubmit={(e) => onSubmit(e, onClose)}
          onModSelected={onModRemoved}
        />
      )
    : undefined;

  return (
    <Sheet
      onClose={onClose}
      header={
        <div>
          <h1>{t('LB.ChooseAMod')}</h1>
          <div className="item-picker-search">
            <div className="search-filter" role="search">
              <AppIcon icon={searchIcon} className="search-bar-icon" />
              <input
                className="filter-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                autoFocus={autoFocus}
                placeholder={t('LB.SearchAMod')}
                type="text"
                name="filter"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
            </div>
          </div>
        </div>
      }
      footer={footer}
      sheetClassName="item-picker"
      freezeInitialHeight={true}
    >
      {groupedMods.map((mods) => (
        <ModPickerSection
          key={mods[0].plug.plugCategoryHash}
          mods={mods}
          lockedModsInternal={lockedModsInternal}
          onModSelected={onModSelected}
          onModRemoved={onModRemoved}
        />
      ))}
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
