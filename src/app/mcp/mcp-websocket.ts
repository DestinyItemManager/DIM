/* eslint-disable no-console */
import type { TagValue } from 'app/inventory/dim-item-info';
import type { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, getTagSelector, storesSelector } from 'app/inventory/selectors';
import { buildSocketNames, csvStatNamesForDestinyVersion } from 'app/inventory/spreadsheets';
import { D1_StatHashes } from 'app/search/d1-known-values';
import store from 'app/store/store';
import { StatHashes } from 'data/d2/generated-enums';

const MCP_PORT = 9130;
const MCP_URL = `wss://localhost:${MCP_PORT}`;
let socket: WebSocket | null = null;
let sending = false;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildWeaponSummary(
  item: DimItem,
  getTag: (item: DimItem) => TagValue | undefined,
  statNames: Map<number, string>,
) {
  const stats: Record<string, number> = {};
  for (const stat of item.stats ?? []) {
    const name = statNames.get(stat.statHash) ?? stat.displayProperties.name;
    stats[name] = stat.value;
  }

  return {
    name: item.name,
    type: item.typeName,
    tier: item.tier,
    element: item.element?.displayProperties.name,
    power: item.power,
    stats,
    perks: buildSocketNames(item),
    tag: getTag(item),
  };
}

async function sendWeapons() {
  const state = store.getState();
  const allItems = allItemsSelector(state);
  const getTag = getTagSelector(state);
  const destinyVersion = allItems[0]?.destinyVersion ?? 2;
  const statNames = csvStatNamesForDestinyVersion(destinyVersion);

  const weapons = allItems
    .filter(
      (item) =>
        item.primaryStat &&
        (item.primaryStat.statHash === D1_StatHashes.Attack ||
          item.primaryStat.statHash === StatHashes.Attack),
    )
    .map((item) => buildWeaponSummary(item, getTag, statNames));

  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'weapons', data: weapons }));
  }
}

async function sendInventory() {
  if (sending) {
    console.log('🔄 Skipping sendInventory — already in progress');
    return;
  }
  sending = true;
  console.log('🚀 Sending inventory data (per-store streaming)...');

  const state = store.getState();
  const stores = storesSelector(state);
  const currencies = state.inventory.currencies;

  try {
    // 1) Tell server how many stores to expect
    socket?.send(JSON.stringify({ type: 'inventoryStart', storeCount: stores.length }));
    await sleep(10);

    // 2) Send currencies separately (small)
    socket?.send(JSON.stringify({ type: 'currencies', data: currencies }));
    await sleep(10);

    // 3) Send each store as its own chunked blob
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB

    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      const seen = new WeakSet<object>();
      const sjson = JSON.stringify(store, function (_: any, value: any) {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value as object)) {
            return '[Circular]';
          }
          seen.add(value as object);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return value;
      });

      const totalChunks = Math.ceil(sjson.length / CHUNK_SIZE) || 1;
      for (let c = 0; c < totalChunks; c++) {
        const chunk = sjson.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
        const message = JSON.stringify({
          type: 'storeChunk',
          storeIndex: i,
          chunkIndex: c,
          totalChunks,
          data: chunk,
        });
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(message);
          await sleep(20); // throttle a bit to avoid buffer backpressure
        }
      }
      console.log(`📤 Store ${i} sent in ${Math.ceil(sjson.length / CHUNK_SIZE) || 1} chunks`);
      await sleep(30);
    }

    console.log('✅ All stores sent');
  } catch (err) {
    console.error('❌ sendInventory failed:', err);
  } finally {
    sending = false;
  }
}

function handleMessage(event: MessageEvent) {
  let message: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    message = JSON.parse(String(event.data));
  } catch {
    if (event.data === 'ping') {
      sendInventory();
      sendWeapons();
      return;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (message && message.type === 'ping') {
    sendInventory();
    sendWeapons();
  }
}

function connect() {
  socket = new WebSocket(MCP_URL);

  socket.onopen = async () => {
    console.log('MCP WebSocket connected');
    try {
      socket?.send(JSON.stringify({ type: 'hello' }));
    } catch {}
    await sendInventory();
    await sendWeapons();
  };

  socket.onmessage = handleMessage;

  socket.onerror = (err) => {
    console.error('MCP WebSocket error', err);
    try {
      socket?.close();
    } catch {}
  };

  socket.onclose = () => {
    console.warn('MCP WebSocket closed, retrying in 3s');
    setTimeout(connect, 3000);
  };
}

export function startMcpSocket() {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    connect();
  }
}
