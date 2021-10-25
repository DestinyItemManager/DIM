import { DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';

export interface SocketWithOptions {
  title: string;
  plugCategoryHash?: number;
  socket: DimSocket;
  options: PluggableInventoryItemDefinition[];
}

export type SelectedPlugs = Record<number, PluggableInventoryItemDefinition[] | undefined>;
