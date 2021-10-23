import { DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';

export interface SocketWithOptions {
  socket: DimSocket;
  options: DestinyInventoryItemDefinition[];
}

export type SelectedPlugs = Record<number, PluggableInventoryItemDefinition[] | undefined>;
