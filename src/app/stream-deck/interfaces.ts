import { InventoryBucket } from 'app/inventory/inventory-buckets';

export interface StreamDeckMessage {
  action:
    | 'search'
    | 'randomize'
    | 'collectPostmaster'
    | 'refresh'
    | 'farmingMode'
    | 'maxPower'
    | 'freeSlot'
    | 'pullItem'
    | 'selection'
    | 'loadout'
    | 'shareLoadout';
  args: {
    search: string;
    weaponsOnly: boolean;
    loadout: string;
    character: string;
    slot: InventoryBucket['type'];
    item: string;
    page: string;
    selection: 'loadout' | 'item';
  };
}
