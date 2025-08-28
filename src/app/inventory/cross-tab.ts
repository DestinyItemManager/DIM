import { infoLog } from 'app/utils/log';
import { BucketHashes } from 'data/d2/generated-enums';
import { useEffect } from 'react';

export const crossTabChannel =
  'BroadcastChannel' in globalThis ? new BroadcastChannel('dim') : undefined;

export interface StoreUpdatedMessage {
  type: 'stores-updated';
}

export interface ItemMovedMessage {
  type: 'item-moved';
  itemHash: number;
  itemId: string;
  itemLocation: BucketHashes;
  sourceId: string;
  targetId: string;
  equip: boolean;
  amount: number;
}

// TODO: other inventory changes, dim api changes, etc.

export type CrossTabMessage = StoreUpdatedMessage | ItemMovedMessage;

export function useCrossTabUpdates(callback: (m: CrossTabMessage) => void) {
  useEffect(() => {
    if (!crossTabChannel) {
      return;
    }
    const onMsg = (m: MessageEvent<CrossTabMessage>) => {
      const message = m.data;
      infoLog('cross-tab', 'message', message.type, message);
      if (message.type) {
        callback(message);
      }
    };
    crossTabChannel.addEventListener('message', onMsg);
    return () => crossTabChannel.removeEventListener('message', onMsg);
  }, [callback]);
}

export function notifyOtherTabsStoreUpdated() {
  if (!crossTabChannel) {
    return;
  }
  crossTabChannel.postMessage({ type: 'stores-updated' } satisfies StoreUpdatedMessage);
}

export function notifyOtherTabsItemMoved(args: Omit<ItemMovedMessage, 'type'>) {
  if (!crossTabChannel) {
    return;
  }
  crossTabChannel.postMessage({ type: 'item-moved', ...args } satisfies ItemMovedMessage);
}
