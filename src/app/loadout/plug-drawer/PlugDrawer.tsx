import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { startWordRegexp } from 'app/search/search-filters/freeform';
import { SearchFilterRef } from 'app/search/SearchBar';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isiOSBrowser } from 'app/utils/browsers';
import { Comparator } from 'app/utils/comparators';
import _ from 'lodash';
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sheet from '../../dim-ui/Sheet';
import '../../item-picker/ItemPicker.scss';
import Footer from './Footer';
import PlugSection from './PlugSection';

interface Props {
  /** A list of plugs the user can choose from */
  plugs: PluggableInventoryItemDefinition[];
  /**
   * An array of mods that are already locked.
   */
  initiallySelected: PluggableInventoryItemDefinition[];
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
  sortPlugGroups?: Comparator<PluggableInventoryItemDefinition[]>;
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
  plugs,
  initiallySelected,
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
  const [selected, setSelected] = useState(() => [...initiallySelected]);
  const filterInput = useRef<SearchFilterRef | null>(null);
  const isPhonePortrait = useIsPhonePortrait();

  useEffect(() => {
    if (!isPhonePortrait && filterInput.current) {
      filterInput.current.focusFilterInput();
    }
  }, [isPhonePortrait, filterInput]);

  const onPlugSelected = useCallback(
    (mod: PluggableInventoryItemDefinition) => {
      setSelected((oldState) => {
        const newState = [...oldState];
        newState.push(mod);
        if (sortPlugs) {
          newState.sort(sortPlugs);
        }
        return newState;
      });
    },
    [sortPlugs]
  );

  const onPlugRemoved = useCallback(
    (mod: PluggableInventoryItemDefinition) => {
      setSelected((oldState) => {
        const firstIndex = oldState.findIndex((locked) => locked.hash === mod.hash);

        if (firstIndex >= 0) {
          const newState = [...oldState];
          newState.splice(firstIndex, 1);
          return newState;
        }

        return oldState;
      });
    },
    [setSelected]
  );

  const onSubmit = (e: React.FormEvent | KeyboardEvent, onClose: () => void) => {
    e.preventDefault();
    onAccept(selected);
    onClose();
  };

  const queryFilteredPlugs = useMemo(() => {
    const regexp = startWordRegexp(query, language);
    return query.length
      ? plugs.filter(
          (plug) =>
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
            })
        )
      : plugs;
  }, [query, plugs, defs.SandboxPerk, language]);

  const groupedPlugs = Object.values(
    _.groupBy(queryFilteredPlugs, (plugItem) => plugItem.plug.plugCategoryHash)
  );

  if (sortPlugGroups) {
    groupedPlugs.sort(sortPlugGroups);
  }

  const autoFocus = !isPhonePortrait && !isiOSBrowser();

  const footer = ({ onClose }: { onClose(): void }) => (
    <Footer
      selected={selected}
      isPhonePortrait={isPhonePortrait}
      acceptButtonText={acceptButtonText}
      onSubmit={(e) => onSubmit(e, onClose)}
      onPlugSelected={onPlugRemoved}
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
      {groupedPlugs.map((plugItem) => (
        <PlugSection
          key={plugItem[0].plug.plugCategoryHash}
          plugs={plugItem}
          selected={selected}
          isPlugSelectable={(plug) => isPlugSelectable(plug, selected)}
          onPlugSelected={onPlugSelected}
          onPlugRemoved={onPlugRemoved}
        />
      ))}
    </Sheet>
  );
}
