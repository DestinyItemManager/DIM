/**
 * @jest-environment node
 */
import { batchJsonEntries } from './json-batch-stream';

/** Stream a string as UTF-8 bytes in chunks of chunkSize bytes. */
function streamOf(text: string, chunkSize: number): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
      } else {
        controller.enqueue(bytes.subarray(offset, offset + chunkSize));
        offset += chunkSize;
      }
    },
  });
}

async function parseViaBatches(obj: object, chunkSize: number, batchSizeBytes: number) {
  const result: Record<string, unknown> = {};
  let batches = 0;
  for await (const batch of batchJsonEntries(
    streamOf(JSON.stringify(obj), chunkSize),
    batchSizeBytes,
  )) {
    batches++;
    Object.assign(result, JSON.parse(batch));
  }
  return { result, batches };
}

// Entries designed to confuse a naive splitter: braces, commas, quotes and
// escapes inside strings, nested arrays/objects, multi-byte characters.
const trickyTable = {
  '1': { name: 'simple', value: 1 },
  '2': { name: 'br,ace }{ in string', arr: [1, 2, { deep: '],}' }] },
  '3': { name: 'escaped quote \\" and backslash \\\\', other: '"' },
  '4': { name: '日本語のテキスト🎉', desc: 'emoji 🦄 and accents éàü' },
  '5': { nested: { a: { b: { c: [{ d: 'x,y' }] } } } },
  '6': { empty: {}, emptyArr: [], nul: null, bool: false },
  '74624: 39': { 'weird: key, with "stuff"': '}{,' },
  '8': {
    s: 'backslash runs \\ \\\\ \\\\\\ before quotes',
    t: '\\\\',
    u: 'ends in backslashes \\\\\\',
  },
};

describe('batchJsonEntries', () => {
  test.each([1, 3, 7, 64, 1024])('round-trips with chunk size %d', async (chunkSize) => {
    const { result } = await parseViaBatches(trickyTable, chunkSize, 16);
    expect(result).toEqual(trickyTable);
  });

  test('splits into multiple batches when entries exceed the batch size', async () => {
    const { result, batches } = await parseViaBatches(trickyTable, 8, 32);
    expect(result).toEqual(trickyTable);
    expect(batches).toBeGreaterThan(1);
  });

  test('one giant batch size yields a single batch', async () => {
    const { result, batches } = await parseViaBatches(trickyTable, 16, 1024 * 1024);
    expect(result).toEqual(trickyTable);
    expect(batches).toBe(1);
  });

  test('empty table', async () => {
    const { result } = await parseViaBatches({}, 1, 16);
    expect(result).toEqual({});
  });

  test('single entry larger than the batch size', async () => {
    const table = { '99': { blob: 'x'.repeat(500) } };
    const { result } = await parseViaBatches(table, 13, 16);
    expect(result).toEqual(table);
  });

  test('many entries, realistic shape', async () => {
    const table: Record<string, unknown> = {};
    for (let i = 0; i < 500; i++) {
      table[`${i * 31 + 7}`] = {
        hash: i,
        displayProperties: { name: `Item ${i}`, description: `Description, with "comma" ${i}` },
        sockets: { socketEntries: [{ plugItems: [i, i + 1] }] },
      };
    }
    const { result, batches } = await parseViaBatches(table, 256, 1024);
    expect(result).toEqual(table);
    expect(batches).toBeGreaterThan(5);
  });
});
