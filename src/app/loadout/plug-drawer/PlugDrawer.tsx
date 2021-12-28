import { languageSelector } from 'app/dim-api/selectors';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { startWordRegexp } from 'app/search/search-filters/freeform';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isiOSBrowser } from 'app/utils/browsers';
import { Comparator, compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { produce } from 'immer';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import Footer from './Footer';
import PlugSection, { PlugSet } from './PlugSection';

interface Props {
  /**
   * A list of plug items that come from a PlugSet, along with the maximum
   * number of plugs that can be chosen from each set. The plugs shown in this
   * drawer are the union of plugs from these plug sets.
   */
  plugSets: PlugSet[];
  /**
   * Plugs that have been selected or "locked" by the user already. These must
   * be a subset of the plugs in plugSets otherwise unknown plugs will be
   * discarded on accept.
   */
  initiallySelected: PluggableInventoryItemDefinition[];
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
  initiallySelected,
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
  const [selected, setSelected] = useState(() =>
    assignPlugsToPlugSets(plugSets, initiallySelected)
  );
  const filterInput = useRef<HTMLInputElement>(null);
  const isPhonePortrait = useIsPhonePortrait();

  useEffect(() => {
    if (!isPhonePortrait && filterInput.current) {
      filterInput.current.focus();
    }
  }, [isPhonePortrait, filterInput]);

  const handlePlugSelected = useCallback(
    (
      plugSetHash: number,
      plug: PluggableInventoryItemDefinition,
      selectionType: 'multi' | 'single'
    ) => {
      setSelected(
        produce((draft) => {
          const currentlySelected = draft[plugSetHash] || [];
          const selectedPlugs = selectionType === 'multi' ? currentlySelected : [];
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
        produce((plugsByPlugSetHash) => {
          // Since we know which plugset this plug was in, remove it from that set
          const selectedPlugs = plugsByPlugSetHash[plugSetHash];
          if (selectedPlugs) {
            const firstIndex = selectedPlugs.findIndex((selected) => selected.hash === plug.hash);
            if (firstIndex >= 0) {
              selectedPlugs.splice(firstIndex, 1);
            }
          }
        })
      );
    },
    []
  );

  const handlePlugRemovedFromFooter = useCallback((plug: PluggableInventoryItemDefinition) => {
    setSelected(
      produce((plugsByPlugSetHash) => {
        // Remove the first plug matching this hash that we find in any plug set
        for (const selectedPlugs of _.compact(Object.values(plugsByPlugSetHash))) {
          const firstIndex = selectedPlugs.findIndex((selected) => selected.hash === plug.hash);
          if (firstIndex >= 0) {
            selectedPlugs?.splice(firstIndex, 1);
            return;
          }
        }
      })
    );
  }, []);

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    onAccept(_.compact(Object.values(selected).flat()));
    onClose();
  };

  /** Filter the plugs from each plugSet based on the query. This can leave plugSets with zero plugs */
  const queryFilteredPlugSets = useMemo(() => {
    if (!query.length) {
      return plugSets;
    }

    const regexp = startWordRegexp(query, language);
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

    return plugSets.map((plugSet) => ({
      ...plugSet,
      plugs: plugSet.plugs.filter(searchFilter),
    }));
  }, [query, plugSets, defs.SandboxPerk, language]);

  if (sortPlugGroups) {
    queryFilteredPlugSets.sort(sortPlugGroups);
  }

  const autoFocus = !isPhonePortrait && !isiOSBrowser();

  // Flatten out the plugs and sort so the footer has a predictable order
  const flatSelectedPlugs = _.compact(Object.values(selected).flat());
  if (sortPlugs) {
    flatSelectedPlugs.sort(sortPlugs);
  }

  const footerPlugs = useMemo(
    () =>
      flatSelectedPlugs.map((plug) => ({
        plug,
        // We decorate each plug with its selection type so we can handle removal appropriately in the footer
        // This allows us to preserve the sort order
        selectionType:
          plugSets.find((set) => set.plugs.some((p) => p.hash === plug.hash))?.selectionType ||
          'multi',
      })),
    [flatSelectedPlugs, plugSets]
  );

  const footer = ({ onClose }: { onClose(): void }) => (
    <Footer
      selected={footerPlugs}
      isPhonePortrait={isPhonePortrait}
      acceptButtonText={acceptButtonText}
      onSubmit={(e) => onSubmit(e, onClose)}
      handlePlugSelected={handlePlugRemovedFromFooter}
    />
  );

  const header = (
    <div>
      <h1>{title}</h1>
      <div className="item-picker-search">
        <div className="search-filter" role="search">
          <AppIcon icon={searchIcon} className="search-bar-icon" />
          <input
            ref={filterInput}
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
  );

  return (
    <Sheet
      onClose={onClose}
      header={header}
      footer={footer}
      sheetClassName="item-picker"
      freezeInitialHeight={true}
    >
      {queryFilteredPlugSets.map((plugSet) => (
        <PlugSection
          key={plugSet.plugSetHash}
          plugSet={plugSet}
          selectedPlugs={selected[plugSet.plugSetHash] ?? emptyArray()}
          displayedStatHashes={displayedStatHashes}
          isPlugSelectable={(plug) => isPlugSelectable(plug, flatSelectedPlugs)}
          onPlugSelected={handlePlugSelected}
          onPlugRemoved={handlePlugRemoved}
          sortPlugs={sortPlugs}
        />
      ))}
    </Sheet>
  );
}

/**
 * A map of plugSetHashes to the selected plugs for that plugSetHash.
 */
type PlugsByPlugSetHash = {
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
function assignPlugsToPlugSets(
  plugSets: PlugSet[],
  initiallySelected: PluggableInventoryItemDefinition[]
) {
  const plugsByPlugSetHash: PlugsByPlugSetHash = {};

  for (const plug of initiallySelected) {
    // Find all the possible sets this plug could go in and sort them so the set with the
    // smallest number of options is first. Because artificer armor has a socket that is a
    // subset of the normal slot specific sockets, this ensure we will fill it with plugs
    // first.
    const possibleSets = plugSets
      .filter((set) => set.plugs.some((p) => p.hash === plug.hash))
      .sort(compareBy((set) => set.plugs.length));

    for (const set of possibleSets) {
      const selectedForPlugSet = plugsByPlugSetHash[set.plugSetHash] || [];
      if (selectedForPlugSet.length < set.maxSelectable) {
        selectedForPlugSet.push(plug);
        plugsByPlugSetHash[set.plugSetHash] = selectedForPlugSet;
        break;
      }
    }
  }

  return plugsByPlugSetHash;
}
