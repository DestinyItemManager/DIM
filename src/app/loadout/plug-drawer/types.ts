import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';

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
  maxSelectable: number;
  /**
   * The select behavior of the plug set.
   * multi: how armour mods are selected in game, you need to manually remove ones that have been added.
   * single: how abilities in subclasses are selected, selecting an option replaces the current one.
   */
  selectionType: 'multi' | 'single';
  /** A bit of text to add on to the header. This is currently used to distinguish Artificer slot-specific sockets. */
  headerSuffix?: string;
}
