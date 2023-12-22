import { I18nKey } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';

/** The select behavior of the plug set. */
export const enum PlugSelectionType {
  /** How armor mods are selected in game, you need to manually remove ones that have been added. */
  Multi = 1,
  /** How aspects/fragments are selected - similar to 'multi' except no dupes are allowed */
  Unique,
  /** How abilities in subclasses are selected, selecting an option replaces the current one. */
  Single,
}

/**
 * a list of plugs, plus some metadata about:
 * - the maximum we should let the user choose at once
 * - the plugset whence these plugs originate
 * - the behavior we use for selecting plugs
 */
export interface PlugSet {
  /** The hash that links to the PlugSet definition. */
  plugSetHash: number;
  /** A list of plug items in this plugset. */
  plugs: PluggableInventoryItemDefinition[];
  /** A list of plugs that are currently selected. */
  selected: PluggableInventoryItemDefinition[];
  /** The maximum number of plugs a user can select from this plug set. */
  maxSelectable: number | ((allSelectedPlugs: PluggableInventoryItemDefinition[]) => number);
  /** The number of plugs selected from this plug set - used for plug sets that share mod slots, e.g. activity mods. Falls back to `selected.length` */
  getNumSelected?: (allSelectedPlugs: PluggableInventoryItemDefinition[]) => number;
  /** Overrides the `selected`/`maxSelectable` localization shown in the plugSet header */
  overrideSelectedAndMax?: I18nKey;
  /** The select behavior of the plug set. */
  selectionType: PlugSelectionType;
  /** A bit of text to add on to the header. This is currently used to distinguish Artificer slot-specific sockets. */
  headerSuffix?: string;
}
