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
 *
 * Each incoming chunk is scanned exactly once, with string contents skipped
 * at native speed via indexOf; chunks are accumulated in a list and only
 * copied once per emitted batch.
 */
export async function* batchJsonEntries(
  stream: ReadableStream<Uint8Array>,
  batchSizeBytes = 4 * 1024 * 1024,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  // A single sequential decoder (stream: true) handles multi-byte characters
  // that span chunk boundaries. Batch boundaries are always at structural
  // ASCII bytes, so the decoder state is empty between batches.
  const decoder = new TextDecoder();

  // Bytes accumulated since the last emitted batch.
  let chunks: Uint8Array[] = [];
  let pendingBytes = 0;

  let depth = 0; // brace/bracket nesting depth
  let inString = false;
  // Length of the backslash run at the end of the last scanned chunk, for
  // detecting escaped quotes that span chunk boundaries.
  let carryBackslashes = 0;
  let firstBatch = true;

  /** Copy the accumulated chunks (plus an optional final piece) into one buffer. */
  const assemble = (last?: Uint8Array) => {
    const total = pendingBytes + (last?.length ?? 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    if (last) {
      out.set(last, offset);
    }
    chunks = [];
    pendingBytes = 0;
    return out;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      let chunk = value;
      let i = 0;
      while (i < chunk.length) {
        if (inString) {
          const q = chunk.indexOf(QUOTE, i);
          if (q === -1) {
            // The string continues into the next chunk. Carry over the length
            // of any backslash run touching the chunk end, to resolve quote
            // escaping across the boundary.
            let k = chunk.length - 1;
            while (k >= i && chunk[k] === BACKSLASH) {
              k--;
            }
            const run = chunk.length - 1 - k;
            carryBackslashes = k < i && i === 0 ? carryBackslashes + run : run;
            i = chunk.length;
            break;
          }
          // The quote is escaped iff the backslash run immediately before it
          // has odd length.
          let k = q - 1;
          while (k >= i && chunk[k] === BACKSLASH) {
            k--;
          }
          let run = q - 1 - k;
          if (k < i && i === 0) {
            run += carryBackslashes;
          }
          carryBackslashes = 0;
          if (run % 2 === 0) {
            inString = false;
          }
          i = q + 1;
          continue;
        }

        const c = chunk[i];
        if (c === QUOTE) {
          inString = true;
          carryBackslashes = 0;
        } else if (c === CURLY_OPEN || c === SQUARE_OPEN) {
          depth++;
        } else if (c === CURLY_CLOSE || c === SQUARE_CLOSE) {
          depth--;
        } else if (c === COMMA && depth === 1 && pendingBytes + i >= batchSizeBytes) {
          // A comma between top-level entries, and we have enough bytes for a
          // batch: emit everything before the comma as its own JSON object.
          // The first batch begins with the table's opening brace; later
          // batches need one prepended.
          const text = decoder.decode(assemble(chunk.subarray(0, i)), { stream: true });
          yield `${firstBatch ? '' : '{'}${text}}`;
          firstBatch = false;
          chunk = chunk.subarray(i + 1);
          i = 0;
          continue;
        }
        i++;
      }

      chunks.push(chunk);
      pendingBytes += chunk.length;
    }

    // Whatever remains is the last batch, already terminated by the table's
    // closing brace.
    yield `${firstBatch ? '' : '{'}${decoder.decode(assemble())}`;
  } finally {
    reader.releaseLock();
  }
}
