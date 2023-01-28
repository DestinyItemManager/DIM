import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import ElementIcon from 'app/dim-ui/ElementIcon';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { itemCategoryIcons } from 'app/organizer/item-category-icons';
import { createPlugSearchPredicate } from 'app/search/plug-search';
import { SearchInput } from 'app/search/SearchInput';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isiOSBrowser } from 'app/utils/browsers';
import { Comparator } from 'app/utils/comparators';
import { DamageType } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import modsInfoFile from 'data/d2/mods.json';
import { t } from 'i18next';
import { produce } from 'immer';
import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import Footer from './Footer';
import styles from './PlugDrawer.m.scss';
import PlugSection from './PlugSection';
import { PlugSet } from './types';

interface Props {
  /**
   * A list of plug items that come from a PlugSet, along with the maximum
   * number of plugs that can be chosen from each set. The plugs shown in this
   * drawer are the union of plugs from these plug sets.
   */
  plugSets: PlugSet[];
  /** A restricted list of stat hashes to display for each plug. If not specified, no stats will be shown. */
  displayedStatHashes?: number[];
  /** Title of the sheet, displayed in the header. */
  title: string;
  /** The placeholder text for the search bar. */
  searchPlaceholder: string;
  /** A query that will be prepopulated in the search bar. */
  initialQuery?: string;
  /** The label for the "accept" button in the footer. */
  acceptButtonText: string;
  /** A function to determine if a given plug is currently selectable. */
  isPlugSelectable(
    plug: PluggableInventoryItemDefinition,
    selected: PluggableInventoryItemDefinition[]
  ): boolean;
  /** How plug groups (e.g. PlugSets) should be sorted in the display. */
  sortPlugGroups?: Comparator<PlugSet>;
  /** How to sort plugs within a group (PlugSet) */
  sortPlugs?: Comparator<PluggableInventoryItemDefinition>;
  /** Called with the full list of selected plugs when the user clicks the accept button. */
  onAccept(selectedPlugs: PluggableInventoryItemDefinition[]): void;
  /** Called when the user accepts the new plugset or closes the sheet. */
  onClose(): void;
}

/**
 * A sheet that allows picking some number of plugs (mods) from the union of
 * several set of plugs. You can choose more than one plug before accepting the
 * selection. This powers the mod selection in LO and the loadout drawer, and
 * subclass configuration.
 */
export default function PlugDrawer({
  plugSets,
  displayedStatHashes,
  title,
  searchPlaceholder,
  initialQuery,
  acceptButtonText,
  isPlugSelectable,
  sortPlugGroups,
  sortPlugs,
  onAccept,
  onClose,
}: Props) {
  const defs = useD2Definitions()!;
  const language = useSelector(languageSelector);
  const [query, setQuery] = useState(initialQuery || '');
  const [selectedFilters, setSelectedFilters] = useState<Option[]>([]);
  const [internalPlugSets, setInternalPlugSets] = useState(() =>
    plugSets
      .map((plugSet) => ({ ...plugSet, plugs: Array.from(plugSet.plugs).sort(sortPlugs) }))
      .sort(sortPlugGroups)
  );
  const isPhonePortrait = useIsPhonePortrait();

  const handlePlugSelected = useCallback(
    (
      plugSetHash: number,
      plug: PluggableInventoryItemDefinition,
      selectionType: 'multi' | 'single'
    ) => {
      setInternalPlugSets(
        produce((draft) => {
          const draftPlugSet = draft.find((plugSet) => plugSet.plugSetHash === plugSetHash);
          if (!draftPlugSet) {
            return;
          }

          if (selectionType === 'single') {
            draftPlugSet.selected = [plug];
          } else {
            draftPlugSet.selected.push(plug);
          }

          if (sortPlugs) {
            draftPlugSet.selected.sort(sortPlugs);
          }
        })
      );
    },
    [sortPlugs]
  );

  const handlePlugRemoved = useCallback(
    (plugSetHash: number, plug: PluggableInventoryItemDefinition) => {
      setInternalPlugSets(
        produce((draft) => {
          const draftPlugSet = draft.find((plugSet) => plugSet.plugSetHash === plugSetHash);
          if (!draftPlugSet) {
            return;
          }

          const firstIndex = draftPlugSet.selected.findIndex(
            (selected) => selected.hash === plug.hash
          );
          if (firstIndex >= 0) {
            draftPlugSet.selected.splice(firstIndex, 1);
          }
        })
      );
    },
    []
  );

  const handlePlugRemovedFromFooter = useCallback((plug: PluggableInventoryItemDefinition) => {
    setInternalPlugSets(
      produce((draft) => {
        // Remove the first plug matching this hash that we find in any plug set
        for (const draftPlugSet of draft) {
          const firstIndex = draftPlugSet.selected.findIndex(
            (selected) => selected.hash === plug.hash
          );
          if (firstIndex >= 0) {
            draftPlugSet.selected.splice(firstIndex, 1);
            return;
          }
        }
      })
    );
  }, []);

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    onAccept(internalPlugSets.flatMap((plugSet) => plugSet.selected));
    onClose();
  };

  /** Filter the plugs from each plugSet based on the query. This can leave plugSets with zero plugs */
  const queryFilteredPlugSets = useMemo(() => {
    if (!query.length) {
      return internalPlugSets;
    }

    const searchFilter = createPlugSearchPredicate(query, language, defs);

    return internalPlugSets.map((plugSet) => ({
      ...plugSet,
      plugs: plugSet.plugs.filter(searchFilter),
    }));
  }, [query, internalPlugSets, defs, language]);

  const handleIsPlugSelectable = useCallback(
    (plug: PluggableInventoryItemDefinition) =>
      isPlugSelectable(
        plug,
        internalPlugSets.flatMap((plugSet) => plugSet.selected)
      ),
    [internalPlugSets, isPlugSelectable]
  );

  const footer = ({ onClose }: { onClose(): void }) => (
    <Footer
      plugSets={internalPlugSets}
      isPhonePortrait={isPhonePortrait}
      acceptButtonText={acceptButtonText}
      onSubmit={(e) => onSubmit(e, onClose)}
      handlePlugSelected={handlePlugRemovedFromFooter}
    />
  );

  // On iOS at least, focusing the keyboard pushes the content off the screen
  const nativeAutoFocus = !isPhonePortrait && !isiOSBrowser();

  const header = (
    <div>
      <h1>{title}</h1>
      <div className="item-picker-search">
        <SearchInput
          query={query}
          onQueryChanged={setQuery}
          placeholder={searchPlaceholder}
          autoFocus={nativeAutoFocus}
        />
      </div>
    </div>
  );

  const [filterPillOptions, mapping] = useMemo(
    () => modFilterPillOptions(defs, queryFilteredPlugSets),
    [defs, queryFilteredPlugSets]
  );

  const finalFilteredPlugSets =
    selectedFilters.length > 0
      ? queryFilteredPlugSets.map((plugSet) => ({
          ...plugSet,
          plugs: filterPlugsFromPills(plugSet.plugs, selectedFilters, mapping),
        }))
      : queryFilteredPlugSets;

  return (
    <Sheet
      onClose={onClose}
      header={header}
      footer={footer}
      sheetClassName="item-picker"
      freezeInitialHeight={true}
    >
      {filterPillOptions.length > 0 && (
        <FilterPills
          darkBackground
          options={filterPillOptions}
          selectedOptions={selectedFilters}
          onOptionsSelected={setSelectedFilters}
        />
      )}
      {finalFilteredPlugSets.map((plugSet) => (
        <PlugSection
          key={plugSet.plugSetHash}
          plugSet={plugSet}
          displayedStatHashes={displayedStatHashes}
          isPlugSelectable={handleIsPlugSelectable}
          onPlugSelected={handlePlugSelected}
          onPlugRemoved={handlePlugRemoved}
        />
      ))}
    </Sheet>
  );
}

export enum ModEffect {
  None = 0, // Reserve 0
  // Standardized per-weapon mods
  Finder,
  Targeting,
  Dexterity,
  Loader,
  Reserves,
  Unflinching,
  Holster,
  Scavenger,
  // More like effects that any mod can have
  Resistance,
  Super,
  ClassAbility,
  Grenade,
  Orbs,
  Finisher,
  Champion,
  // These should be based on mod type, but they can also show up in the seasonal artifact
  ChargedWithLight,
  ElementalWell,
  WarmindCell,
  ArmorCharge,
}

/** Interesting things about mods that we can't figure out from the translated defs */
export interface ModInfo {
  effects?: ModEffect[];
  weapon?: ItemCategoryHashes[]; // Should be ItemSubType?
  element?: DamageType[]; // effects arc
  // element cost
  // modslot
  // raid
  // artifact mods
}

export type DefType = keyof ModInfo;

export interface BountyFilter {
  type: DefType;
  hash: number;
}

function modFilterPillOptions(
  defs: D2ManifestDefinitions,
  plugSets: PlugSet[]
): [options: Option[], mapping: { [type in DefType]: { [key: number]: number[] } }] {
  const mapped: { [type in DefType]: { [key: number]: number[] } } = {
    effects: {},
    weapon: {},
    element: {},
  };

  for (const plugSet of plugSets) {
    for (const plug of plugSet.plugs) {
      const info = modsInfoFile[plug.hash];
      if (info) {
        for (const key in info) {
          for (const value of info[key]) {
            (mapped[key][value] ??= []).push(plug.hash);
          }
        }
      }
    }
  }

  const flattened = Object.entries(mapped).flatMap(([type, mapping]) =>
    Object.entries(mapping).map(([value, plugHashes]) => ({
      type: type as DefType,
      value: parseInt(value, 10),
      plugHashes,
    }))
  );

  const options = flattened.map(({ type, value }) => {
    let content: React.ReactNode;
    switch (type) {
      case 'effects':
        content = t(`ModEffect.${ModEffect[value]}`, { metadata: { keys: 'modeffect' } });
        break;
      case 'element': {
        const damageType = Object.values(defs.DamageType.getAll()).find(
          (d) => d.enumValue === value
        )!;
        content = (
          <>
            <ElementIcon className={styles.elementIcon} element={damageType} />
            {damageType.displayProperties.name}
          </>
        );
        break;
      }
      case 'weapon':
        content = (
          <>
            <img height="16" className={styles.itemCategoryIcon} src={itemCategoryIcons[value]} />
            {defs.ItemCategory.get(value)?.displayProperties.name}
          </>
        );
        break;
    }

    return {
      key: `${type}.${value}`,
      content,
    };
  });

  return [options, mapped];
}

function filterPlugsFromPills(
  plugs: PluggableInventoryItemDefinition[],
  options: Option[],
  mapping: { [type in DefType]: { [key: number]: number[] } }
) {
  let allHashes = new Set(plugs.map((p) => p.hash));
  for (const { key } of options) {
    const [type, value] = key.split('.');
    const hashes = new Set(mapping[type][value] ?? []);
    console.log({ type, value, result: mapping[type][value] });
    allHashes = new Set([...allHashes].filter((h) => hashes.has(h)));
  }
  return plugs.filter((p) => allHashes.has(p.hash));
}
