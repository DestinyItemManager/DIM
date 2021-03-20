import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { bucketsSelector } from 'app/inventory/selectors';
import { escapeRegExp } from 'app/search/search-filters/freeform';
import { SearchFilterRef } from 'app/search/SearchBar';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { knownModPlugCategoryHashes, LockedModMap } from '../types';
import ModPickerFooter from './ModPickerFooter';
import PickerSectionMods from './PickerSectionMods';

interface ProvidedProps {
  lockedArmor2Mods: LockedModMap;
  classType: DestinyClass;
  initialQuery?: string;
  mods: PluggableInventoryItemDefinition[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

interface StoreProps {
  language: string;
  isPhonePortrait: boolean;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    isPhonePortrait: state.shell.isPhonePortrait,
    buckets: bucketsSelector(state)!,
    language: settingsSelector(state).language,
    defs: state.manifest.d2Manifest!,
  });
}

/**
 * A sheet to pick mods that are required in the final loadout sets.
 */
function ModPicker({
  defs,
  mods,
  language,
  isPhonePortrait,
  lockedArmor2Mods,
  initialQuery,
  lbDispatch,
  onClose,
}: Props) {
  const [query, setQuery] = useState(initialQuery || '');
  const [lockedArmor2ModsInternal, setLockedModsInternal] = useState(
    _.mapValues(lockedArmor2Mods, (mods) => mods?.map((mod) => mod.modDef))
  );
  const filterInput = useRef<SearchFilterRef | null>(null);

  useEffect(() => {
    if (!isPhonePortrait && filterInput.current) {
      filterInput.current.focusFilterInput();
    }
  }, [isPhonePortrait, filterInput]);

  const onModSelected = useCallback(
    (mod: PluggableInventoryItemDefinition) => {
      const { plugCategoryHash } = mod.plug;
      setLockedModsInternal((oldState) => ({
        ...oldState,
        [plugCategoryHash]: [...(oldState[plugCategoryHash] || []), { ...mod }],
      }));
    },
    [setLockedModsInternal]
  );

  const onModRemoved = useCallback(
    (mod: PluggableInventoryItemDefinition) => {
      const { plugCategoryHash } = mod.plug;
      setLockedModsInternal((oldState) => {
        const firstIndex =
          oldState[plugCategoryHash]?.findIndex((locked) => locked.hash === mod.hash) ?? -1;

        if (firstIndex >= 0) {
          const newState = [...(oldState[plugCategoryHash] || [])];
          newState.splice(firstIndex, 1);
          return {
            ...oldState,
            [plugCategoryHash]: newState,
          };
        }

        return oldState;
      });
    },
    [setLockedModsInternal]
  );

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    lbDispatch({
      type: 'lockedArmor2ModsChanged',
      lockedArmor2Mods: lockedArmor2ModsInternal,
    });
    onClose();
  };

  const queryFilteredMods = useMemo(() => {
    // Only some languages effectively use the \b regex word boundary
    const regexp = ['de', 'en', 'es', 'es-mx', 'fr', 'it', 'pl', 'pt-br'].includes(language)
      ? new RegExp(`\\b${escapeRegExp(query)}`, 'i')
      : new RegExp(escapeRegExp(query), 'i');
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

  // Group mods by itemTypeDisplayName as there are two hashes for charged with light mods
  const groupedModsByItemTypeDisplayName: {
    [title: string]: {
      title: string;
      mods: PluggableInventoryItemDefinition[];
      plugCategoryHashes: number[];
    };
  } = {};

  // We use this to sort the final groups so that it goes general, helmet, ..., classitem, raid, others.
  const groupHeaderOrder = [...knownModPlugCategoryHashes];

  for (const mod of queryFilteredMods) {
    const title =
      language === 'en'
        ? mod.itemTypeDisplayName.replaceAll(/armor/gi, '').replaceAll(/mod/gi, '').trim()
        : mod.itemTypeDisplayName;

    if (!groupedModsByItemTypeDisplayName[title]) {
      groupedModsByItemTypeDisplayName[title] = {
        title,
        mods: [mod],
        plugCategoryHashes: [mod.plug.plugCategoryHash],
      };
    } else {
      groupedModsByItemTypeDisplayName[title].mods.push(mod);
      if (
        !groupedModsByItemTypeDisplayName[title].plugCategoryHashes.includes(
          mod.plug.plugCategoryHash
        )
      ) {
        groupedModsByItemTypeDisplayName[title].plugCategoryHashes.push(mod.plug.plugCategoryHash);
      }
    }

    if (!groupHeaderOrder.includes(mod.plug.plugCategoryHash)) {
      groupHeaderOrder.push(mod.plug.plugCategoryHash);
    }
  }

  const groupedMods = Object.values(groupedModsByItemTypeDisplayName).sort(
    (groupA, groupB) =>
      groupHeaderOrder.indexOf(groupA.plugCategoryHashes[0]) -
      groupHeaderOrder.indexOf(groupB.plugCategoryHashes[0])
  );

  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  const footer = Object.values(lockedArmor2ModsInternal).some((f) => Boolean(f?.length))
    ? ({ onClose }) => (
        <ModPickerFooter
          defs={defs}
          groupOrder={groupedMods}
          lockedArmor2Mods={lockedArmor2ModsInternal}
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
      {groupedMods.map(({ mods, plugCategoryHashes, title }) => (
        <PickerSectionMods
          key={plugCategoryHashes.join('-')}
          mods={mods}
          defs={defs}
          locked={lockedArmor2ModsInternal}
          title={title}
          plugCategoryHashes={plugCategoryHashes}
          onModSelected={onModSelected}
          onModRemoved={onModRemoved}
        />
      ))}
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(ModPicker);
