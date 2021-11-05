import { DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';

/** Holds the information about a socket with the plugs that can possibly be slotted into it. */
export interface SocketWithOptions {
  /** The title of the socket, used to render a header on the option displays. */
  title: string;
  plugCategoryHash?: number;
  socket: DimSocket;
  /** The plugs available from the profile response which can fit into the socket. */
  options: PluggableInventoryItemDefinition[];
}

export type SelectedPlugs = Record<number, PluggableInventoryItemDefinition[] | undefined>;
