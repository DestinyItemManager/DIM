const QUOTE = 0x22; // "
const COMMA = 0x2c; // ,
const BACKSLASH = 0x5c; // \
const SQUARE_OPEN = 0x5b; // [
const SQUARE_CLOSE = 0x5d; // ]
const CURLY_OPEN = 0x7b; // {
const CURLY_CLOSE = 0x7d; // }

/**
 * Incrementally consume a streamed JSON object of the shape
 * `{ "key": {...}, "key": {...}, ... }` (e.g. a Destiny manifest table),
 * yielding JSON strings that each contain a batch of top-level entries and
 * can be JSON.parsed independently.
 *
 * This exists so we can parse (and trim) a huge table a slice at a time
 * instead of materializing the entire parsed table at once - JSON.parse of
 * the whole DestinyInventoryItemDefinition table peaks at hundreds of MB,
 * which gets the page killed on iOS Safari.
 */
export async function* batchJsonEntries(
  stream: ReadableStream<Uint8Array>,
  batchSizeBytes = 4 * 1024 * 1024,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buf = new Uint8Array(0);
  let pos = 0; // how far into buf we've scanned
  let depth = 0; // brace/bracket nesting depth
  let inString = false;
  let escaped = false;
  let firstBatch = true;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const newBuf = new Uint8Array(buf.length + value.length);
      newBuf.set(buf);
      newBuf.set(value, buf.length);
      buf = newBuf;

      while (pos < buf.length) {
        const c = buf[pos];
        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (c === BACKSLASH) {
            escaped = true;
          } else if (c === QUOTE) {
            inString = false;
          }
        } else if (c === QUOTE) {
          inString = true;
        } else if (c === CURLY_OPEN || c === SQUARE_OPEN) {
          depth++;
        } else if (c === CURLY_CLOSE || c === SQUARE_CLOSE) {
          depth--;
        } else if (c === COMMA && depth === 1 && pos >= batchSizeBytes) {
          // A comma between top-level entries, and we have enough bytes for a
          // batch: emit everything before the comma as its own JSON object.
          // The first batch begins with the table's opening brace; later
          // batches need one prepended.
          yield `${firstBatch ? '' : '{'}${decoder.decode(buf.subarray(0, pos))}}`;
          firstBatch = false;
          buf = buf.slice(pos + 1);
          pos = 0;
          continue;
        }
        pos++;
      }
    }

    // Whatever remains is the last batch, already terminated by the table's
    // closing brace.
    yield `${firstBatch ? '' : '{'}${decoder.decode(buf)}`;
  } finally {
    reader.releaseLock();
  }
}
