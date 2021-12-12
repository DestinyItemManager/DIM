import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { startWordRegexp } from 'app/search/search-filters/freeform';
import { SearchFilterRef } from 'app/search/SearchBar';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isiOSBrowser } from 'app/utils/browsers';
import { Comparator, compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import _ from 'lodash';
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import Footer from './Footer';
import PlugSection from './PlugSection';

export interface PlugsWithMaxSelectable {
  plugSetHash: number;
  plugs: PluggableInventoryItemDefinition[];
  maxSelectable: number;
}

interface Props {
  /**
   * A list of plug items that come from a PlugSet, along with the maximum number of these plugs that can be chosen.
   */
  plugsWithMaxSelectableSets: PlugsWithMaxSelectable[];
  /**
   * An array of mods that are already locked.
   */
  initiallySelected: PluggableInventoryItemDefinition[];
  /** A list of stat hashes that if present will be displayed for each plug. */
  displayedStatHashes?: number[];
  /** Title of the sheet, displayed in the header. */
  title: string;
  /** The input placeholder for the search bar. */
  searchPlaceholder: string;
  /** Language for the search filter. */
  language: string;
  /** A query string that is passed to the filtering logic to prefilter the available mods. */
  initialQuery?: string;
  /** Displayed on the accept button in the footer. */
  acceptButtonText: string;
  /** A ref passed down to the sheets container. */
  sheetRef?: RefObject<HTMLDivElement>;
  /** The min height for the sheet. */
  minHeight?: number;
  /** A function to determine if a given plug is currently selectable. */
  isPlugSelectable(
    plug: PluggableInventoryItemDefinition,
    selected: PluggableInventoryItemDefinition[]
  ): boolean;
  sortPlugGroups?: Comparator<PlugsWithMaxSelectable>;
  sortPlugs?: Comparator<PluggableInventoryItemDefinition>;
  /** Called with the new lockedMods when the user accepts the new modset. */
  onAccept(newLockedMods: PluggableInventoryItemDefinition[]): void;
  /** Called when the user accepts the new modset of closes the sheet. */
  onClose(): void;
}

/**
 * A sheet to pick plugs.
 */
export default function PlugDrawer({
  plugsWithMaxSelectableSets,
  initiallySelected,
  displayedStatHashes,
  title,
  searchPlaceholder,
  language,
  initialQuery,
  acceptButtonText,
  sheetRef,
  minHeight,
  isPlugSelectable,
  sortPlugGroups,
  sortPlugs,
  onAccept,
  onClose,
}: Props) {
  const defs = useD2Definitions()!;
  const [query, setQuery] = useState(initialQuery || '');
  const [selected, setSelected] = useState(() =>
    createInternalSelectedState(plugsWithMaxSelectableSets, initiallySelected)
  );
  const filterInput = useRef<SearchFilterRef | null>(null);
  const isPhonePortrait = useIsPhonePortrait();

  useEffect(() => {
    if (!isPhonePortrait && filterInput.current) {
      filterInput.current.focusFilterInput();
    }
  }, [isPhonePortrait, filterInput]);

  const handlePlugSelected = useCallback(
    (plugSetHash: number, mod: PluggableInventoryItemDefinition) => {
      // TODO (ryan) use immer
      setSelected((oldState) => {
        const newState = { ...oldState };
        const oldSelected = oldState[plugSetHash];
        const newSelected = oldSelected ? [...oldSelected] : [];
        newSelected.push(mod);
        if (sortPlugs) {
          newSelected.sort(sortPlugs);
        }
        newState[plugSetHash] = newSelected;
        return newState;
      });
    },
    [sortPlugs]
  );

  const handlePlugRemoved = useCallback(
    (plugSetHash: number, mod: PluggableInventoryItemDefinition) => {
      // TODO (ryan) use immer
      setSelected((oldState) => {
        const oldSelected = oldState[plugSetHash] || [];
        const firstIndex = oldSelected.findIndex((locked) => locked.hash === mod.hash);

        if (firstIndex >= 0) {
          const newSelected = [...oldSelected];
          newSelected.splice(firstIndex, 1);
          const newState = { ...oldState };
          newState[plugSetHash] = newSelected;
          return newState;
        }

        return oldState;
      });
    },
    [setSelected]
  );

  const handlePlugRemovedFromFooter = useCallback(
    (plug: PluggableInventoryItemDefinition) => {
      // TODO (ryan) use immer
      setSelected((oldState) => {
        for (const plugSetHashAsString of Object.keys(oldState)) {
          const plugSetHash = parseInt(plugSetHashAsString, 10);
          const selected = oldState[plugSetHash] || [];
          const firstIndex = selected.findIndex((s) => s.hash === plug.hash);
          if (firstIndex !== -1) {
            const newSelected = [...selected];
            newSelected.splice(firstIndex, 1);
            const newState = { ...oldState };
            newState[plugSetHash] = newSelected;
            return newState;
          }
        }
        return oldState;
      });
    },
    [setSelected]
  );

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    onAccept(_.compact(Object.values(selected).flat()));
    onClose();
  };

  const queryFilteredPlugSets = useMemo(() => {
    const regexp = startWordRegexp(query, language);
    const rtn: PlugsWithMaxSelectable[] = [];

    const searchFilter = (plug: PluggableInventoryItemDefinition) =>
      regexp.test(plug.displayProperties.name) ||
      regexp.test(plug.displayProperties.description) ||
      regexp.test(plug.itemTypeDisplayName) ||
      plug.perks.some((perk) => {
        const perkDef = defs.SandboxPerk.get(perk.perkHash);
        return (
          perkDef &&
          (regexp.test(perkDef.displayProperties.name) ||
            regexp.test(perkDef.displayProperties.description) ||
            regexp.test(perk.requirementDisplayString))
        );
      });

    for (const { plugs, maxSelectable, plugSetHash } of plugsWithMaxSelectableSets) {
      rtn.push({
        plugSetHash,
        maxSelectable,
        plugs: query.length ? plugs.filter(searchFilter) : plugs,
      });
    }

    return rtn;
  }, [query, plugsWithMaxSelectableSets, defs.SandboxPerk, language]);

  if (sortPlugGroups) {
    queryFilteredPlugSets.sort(sortPlugGroups);
  }

  const autoFocus = !isPhonePortrait && !isiOSBrowser();

  const flatSelectedMods = _.compact(Object.values(selected).flat());

  const footer = ({ onClose }: { onClose(): void }) => (
    <Footer
      selected={flatSelectedMods}
      isPhonePortrait={isPhonePortrait}
      acceptButtonText={acceptButtonText}
      onSubmit={(e) => onSubmit(e, onClose)}
      handlePlugSelected={handlePlugRemovedFromFooter}
    />
  );

  return (
    <Sheet
      ref={sheetRef}
      minHeight={minHeight}
      onClose={onClose}
      header={
        <div>
          <h1>{title}</h1>
          <div className="item-picker-search">
            <div className="search-filter" role="search">
              <AppIcon icon={searchIcon} className="search-bar-icon" />
              <input
                className="filter-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                autoFocus={autoFocus}
                placeholder={searchPlaceholder}
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
      {queryFilteredPlugSets.map((plugsWithMaxSelectable) => (
        <PlugSection
          key={plugsWithMaxSelectable.plugSetHash}
          plugsWithMaxSelectable={plugsWithMaxSelectable}
          selected={selected[plugsWithMaxSelectable.plugSetHash] ?? emptyArray()}
          displayedStatHashes={displayedStatHashes}
          isPlugSelectable={(plug) => isPlugSelectable(plug, flatSelectedMods)}
          handlePlugSelected={handlePlugSelected}
          handlePlugRemoved={handlePlugRemoved}
          sortPlugs={sortPlugs}
        />
      ))}
    </Sheet>
  );
}

/**
 * This creates the internally used state for the selected plugs.
 * We want to split the selected plugs up into groups based on the plugSetHash we attribute them too.
 *
 * We need to do this to correctly handle artificer armor sockets. The plugsets that they can take are
 * a subset of the bucket specific sockets on an item (as in they just take the artifact mods). So
 * to track which plugset they chose a mod from, we key the selected mods by the plugset they were
 * picked from.
 */
function createInternalSelectedState(
  plugsWithMaxSelectableSets: PlugsWithMaxSelectable[],
  initiallySelected: PluggableInventoryItemDefinition[]
) {
  const rtn: { [plugSetHash: number]: PluggableInventoryItemDefinition[] | undefined } = {};

  for (const plug of initiallySelected) {
    // Find all the possible sets this plug could go in and sort them so the set with the
    // smallest number of options is first. Because artificer armor has a socket that is a
    // subset of the normal slot specific sockets, this ensure we will it first.
    const possibleSets = plugsWithMaxSelectableSets
      .filter((set) => set.plugs.some((p) => p.hash === plug.hash))
      .sort(compareBy((set) => set.plugs.length));

    for (const set of possibleSets) {
      const selectedForPlugSet = rtn[set.plugSetHash] || [];
      if (selectedForPlugSet.length < set.maxSelectable) {
        selectedForPlugSet.push(plug);
        rtn[set.plugSetHash] = selectedForPlugSet;
        break;
      }
    }
  }

  return rtn;
}
