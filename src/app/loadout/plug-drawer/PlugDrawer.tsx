import { languageSelector } from 'app/dim-api/selectors';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { SearchInput } from 'app/search/SearchInput';
import { createPlugSearchPredicate } from 'app/search/plug-search';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isiOSBrowser } from 'app/utils/browsers';
import { Comparator, compareBy } from 'app/utils/comparators';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { produce } from 'immer';
import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Sheet from '../../dim-ui/Sheet';
import Footer from './Footer';
import PlugSection from './PlugSection';
import { PlugSelectionType, PlugSet } from './types';

interface Props {
  /**
   * A list of plug items that come from a PlugSet, along with the maximum
   * number of plugs that can be chosen from each set. The plugs shown in this
   * drawer are the union of plugs from these plug sets.
   */
  plugSets: PlugSet[];
  /** The class type we're choosing mods for */
  classType: DestinyClass;
  /** Title of the sheet, displayed in the header. */
  title: string;
  /** The placeholder text for the search bar. */
  searchPlaceholder: string;
  /** A query that will be prepopulated in the search bar. */
  initialQuery?: string;
  /** The label for the "accept" button in the footer. */
  acceptButtonText: string;
  /** A function to further refine whether a given plug is currently selectable. */
  isPlugSelectable?: (
    plug: PluggableInventoryItemDefinition,
    selected: PluggableInventoryItemDefinition[],
  ) => boolean;
  /** How plug groups (e.g. PlugSets) should be sorted in the display. */
  sortPlugGroups?: Comparator<PlugSet>;
  /** Called with the full list of selected plugs when the user clicks the accept button. */
  onAccept: (selectedPlugs: PluggableInventoryItemDefinition[]) => void;
  /** Called when the user accepts the new plugset or closes the sheet. */
  onClose: () => void;
}

const plugSetSort = (set: PlugSet) =>
  compareBy((plug: PluggableInventoryItemDefinition) =>
    set.plugs.findIndex((p) => p.hash === plug.hash),
  );

/**
 * A sheet that allows picking some number of plugs (mods) from the union of
 * several set of plugs. You can choose more than one plug before accepting the
 * selection. This powers the mod selection in LO and the loadout drawer, and
 * subclass configuration.
 */
export default function PlugDrawer({
  plugSets,
  classType,
  title,
  searchPlaceholder,
  initialQuery,
  acceptButtonText,
  isPlugSelectable,
  sortPlugGroups,
  onAccept,
  onClose,
}: Props) {
  const defs = useD2Definitions()!;
  const language = useSelector(languageSelector);
  const [query, setQuery] = useState(initialQuery || '');
  const [internalPlugSets, setInternalPlugSets] = useState(() =>
    plugSets
      .map((plugSet): PlugSet => ({ ...plugSet, plugs: Array.from(plugSet.plugs) }))
      .sort(sortPlugGroups),
  );
  const isPhonePortrait = useIsPhonePortrait();

  const allSelectedPlugs = useMemo(
    () => internalPlugSets.flatMap((set) => set.selected),
    [internalPlugSets],
  );

  const countsByPlugSetHash = useMemo(
    () =>
      Object.fromEntries(
        internalPlugSets.map((set) => [
          set.plugSetHash,
          [
            set.getNumSelected?.(allSelectedPlugs) ?? set.selected.length,
            typeof set.maxSelectable === 'number'
              ? set.maxSelectable
              : set.maxSelectable(allSelectedPlugs),
          ] as const,
        ]),
      ),
    [allSelectedPlugs, internalPlugSets],
  );

  const handlePlugSelected = useCallback(
    (
      plugSetHash: number,
      plug: PluggableInventoryItemDefinition,
      selectionType: PlugSelectionType,
    ) => {
      setInternalPlugSets(
        produce((draft) => {
          const draftPlugSet = draft.find((plugSet) => plugSet.plugSetHash === plugSetHash);
          if (!draftPlugSet) {
            return;
          }

          if (selectionType === PlugSelectionType.Single) {
            draftPlugSet.selected = [plug];
          } else {
            draftPlugSet.selected.push(plug);
          }

          draftPlugSet.selected.sort(plugSetSort(draftPlugSet));
        }),
      );
    },
    [],
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
            (selected) => selected.hash === plug.hash,
          );
          if (firstIndex >= 0) {
            draftPlugSet.selected.splice(firstIndex, 1);
          }
        }),
      );
    },
    [],
  );

  const handlePlugRemovedFromFooter = useCallback((plug: PluggableInventoryItemDefinition) => {
    setInternalPlugSets(
      produce((draft) => {
        // Remove the first plug matching this hash that we find in any plug set
        for (const draftPlugSet of draft) {
          const firstIndex = draftPlugSet.selected.findIndex(
            (selected) => selected.hash === plug.hash,
          );
          if (firstIndex >= 0) {
            draftPlugSet.selected.splice(firstIndex, 1);
            return;
          }
        }
      }),
    );
  }, []);

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    onAccept(allSelectedPlugs);
    onClose();
  };

  /** Filter the plugs from each plugSet based on the query. This can leave plugSets with zero plugs */
  const queryFilteredPlugSets = useMemo(() => {
    if (!query.length) {
      return Array.from(internalPlugSets);
    }

    const searchFilter = createPlugSearchPredicate(query, language, defs);

    return internalPlugSets.map((plugSet) => ({
      ...plugSet,
      plugs: plugSet.plugs.filter(searchFilter),
    }));
  }, [query, internalPlugSets, defs, language]);

  const handleIsPlugSelectable = useCallback(
    (plug: PluggableInventoryItemDefinition) => isPlugSelectable?.(plug, allSelectedPlugs) ?? true,
    [allSelectedPlugs, isPlugSelectable],
  );

  const footer = ({ onClose }: { onClose: () => void }) => (
    <Footer
      plugSets={internalPlugSets}
      classType={classType}
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
      <SearchInput
        query={query}
        onQueryChanged={setQuery}
        placeholder={searchPlaceholder}
        autoFocus={nativeAutoFocus}
      />
    </div>
  );

  return (
    <Sheet onClose={onClose} header={header} footer={footer} freezeInitialHeight={true}>
      {queryFilteredPlugSets.map((plugSet) => (
        <PlugSection
          key={plugSet.plugSetHash}
          plugSet={plugSet}
          classType={classType}
          numSelected={countsByPlugSetHash[plugSet.plugSetHash][0]}
          maxSelectable={countsByPlugSetHash[plugSet.plugSetHash][1]}
          isPlugSelectable={handleIsPlugSelectable}
          onPlugSelected={handlePlugSelected}
          onPlugRemoved={handlePlugRemoved}
        />
      ))}
    </Sheet>
  );
}
