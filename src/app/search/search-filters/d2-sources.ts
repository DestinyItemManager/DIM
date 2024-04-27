import D2Sources from 'data/d2/source-info-v2';

// Fill in extra entries for the aliased source names
for (const sourceAttrs of Object.values(D2Sources)) {
  if (sourceAttrs.aliases) {
    for (const alias of sourceAttrs.aliases) {
      D2Sources[alias] = sourceAttrs;
    }
  }
}

export default D2Sources;
