import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { startWordRegexp } from 'app/search/search-filters/freeform';
import { SearchFilterRef } from 'app/search/SearchBar';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isiOSBrowser } from 'app/utils/browsers';
import { Comparator, compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { produce } from 'immer';
import _ from 'lodash';
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import Footer from './Footer';
import PlugSection, { PlugsWithMaxSelectable } from './PlugSection';

interface Props {
  /**
   * A list of plug items that come from a PlugSet, along with the maximum number of these plugs
   * that can be chosen.
   */
  plugsWithMaxSelectableSets: PlugsWithMaxSelectable[];
  /**
   * An array of plugs that are pre selected.
   *
   * These must be a subset of the plugs in plugsWithMaxSelectableSets otherwise unknown plugs
   * will be discarded on accept.
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
  /** A query string that is passed to the filtering logic to prefilter the available plugs. */
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
  /** Called with the new selected plugs when the user clicks the accept button. */
  onAccept(selectedPlugs: PluggableInventoryItemDefinition[]): void;
  /** Called when the user accepts the new plugset or closes the sheet. */
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
    (plugSetHash: number, plug: PluggableInventoryItemDefinition) => {
      setSelected(
        produce((draft) => {
          const selectedPlugs = draft[plugSetHash] || [];
          selectedPlugs.push(plug);
          if (sortPlugs) {
            selectedPlugs.sort(sortPlugs);
          }
          draft[plugSetHash] = selectedPlugs;
        })
      );
    },
    [sortPlugs]
  );

  const handlePlugRemoved = useCallback(
    (plugSetHash: number, plug: PluggableInventoryItemDefinition) => {
      setSelected(
        produce((draft) => {
          const selectedPlugs = draft[plugSetHash];
          if (selectedPlugs) {
            const firstIndex = selectedPlugs.findIndex((selected) => selected.hash === plug.hash);
            if (firstIndex >= 0) {
              selectedPlugs.splice(firstIndex, 1);
            }
          }
        })
      );
    },
    [setSelected]
  );

  const handlePlugRemovedFromFooter = useCallback(
    (plug: PluggableInventoryItemDefinition) => {
      setSelected(
        produce((draft) => {
          for (const selectedPlugs of _.compact(Object.values(draft))) {
            const firstIndex = selectedPlugs.findIndex((selected) => selected.hash === plug.hash);
            if (firstIndex >= 0) {
              selectedPlugs?.splice(firstIndex, 1);
              return;
            }
          }
        })
      );
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

    for (const { plugs, maxSelectable, plugSetHash, headerSuffix } of plugsWithMaxSelectableSets) {
      rtn.push({
        plugSetHash,
        maxSelectable,
        headerSuffix,
        plugs: query.length ? plugs.filter(searchFilter) : plugs,
      });
    }

    return rtn;
  }, [query, plugsWithMaxSelectableSets, defs.SandboxPerk, language]);

  if (sortPlugGroups) {
    queryFilteredPlugSets.sort(sortPlugGroups);
  }

  const autoFocus = !isPhonePortrait && !isiOSBrowser();

  const flatSelectedPlugs = _.compact(Object.values(selected).flat());

  if (sortPlugs) {
    flatSelectedPlugs.sort(sortPlugs);
  }

  const footer = ({ onClose }: { onClose(): void }) => (
    <Footer
      selected={flatSelectedPlugs}
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
          isPlugSelectable={(plug) => isPlugSelectable(plug, flatSelectedPlugs)}
          handlePlugSelected={handlePlugSelected}
          handlePlugRemoved={handlePlugRemoved}
          sortPlugs={sortPlugs}
        />
      ))}
    </Sheet>
  );
}

/**
 * A map of plugSetHashes to the selected plugs for that plugSetHash.
 */
type InternalSelectedState = {
  [plugSetHash: number]: PluggableInventoryItemDefinition[] | undefined;
};

/**
 * This creates the internally used state for the selected plugs.
 *
 * We need to associate each selected plug with a plugSetHash to correctly handle artificer
 * sockets. The plugsets that they can take are a subset of the bucket specific sockets
 * plugsets on an item, specifically they are just the artifact mods.
 *
 * To do this we create a map from plugSet to a list of plugs selected. This ensure that when
 * a user selects a plug from the artificer set, it won't appear to the user that a plug was
 * selected from the bucket specific set.
 */
function createInternalSelectedState(
  plugsWithMaxSelectableSets: PlugsWithMaxSelectable[],
  initiallySelected: PluggableInventoryItemDefinition[]
) {
  const rtn: InternalSelectedState = {};

  for (const plug of initiallySelected) {
    // Find all the possible sets this plug could go in and sort them so the set with the
    // smallest number of options is first. Because artificer armor has a socket that is a
    // subset of the normal slot specific sockets, this ensure we will fill it with plugs
    // first.
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
