describe('hashtag normalization logic', () => {
  test('should merge hashtags with different cases', () => {
    // Test hashtags with different cases
    const hashtags = ['#PVP', '#pvp', '#PvP'];
    const loadoutsByHashtag: { [hashtag: string]: number[] } = {};

    // Simulate the normalization logic from menu-hooks.tsx
    for (let index = 0; index < hashtags.length; index++) {
      const hashtag = hashtags[index];
      const normalizedHashtag = hashtag.replace('#', '').replace(/_/g, ' ').toLowerCase();
      (loadoutsByHashtag[normalizedHashtag] ??= []).push(index);
    }

    // All three should be grouped under the same normalized hashtag
    expect(loadoutsByHashtag.pvp).toHaveLength(3);
    expect(loadoutsByHashtag.pvp).toEqual([0, 1, 2]);

    // Should not have separate entries for different cases
    expect(loadoutsByHashtag.PVP).toBeUndefined();
    expect(loadoutsByHashtag.PvP).toBeUndefined();
  });

  test('should handle hashtags with underscores and different cases', () => {
    const hashtags = ['#Master_Work', '#master_work', '#MASTER_WORK'];
    const loadoutsByHashtag: { [hashtag: string]: number[] } = {};

    for (let index = 0; index < hashtags.length; index++) {
      const hashtag = hashtags[index];
      const normalizedHashtag = hashtag.replace('#', '').replace(/_/g, ' ').toLowerCase();
      (loadoutsByHashtag[normalizedHashtag] ??= []).push(index);
    }

    // All should be grouped under 'master work'
    expect(loadoutsByHashtag['master work']).toHaveLength(3);
    expect(loadoutsByHashtag['Master Work']).toBeUndefined();
    expect(loadoutsByHashtag['MASTER WORK']).toBeUndefined();
  });

  test('should sort options case-insensitively', () => {
    const options = [
      { key: 'ZZZ', value: null, content: null },
      { key: 'aaa', value: null, content: null },
      { key: 'BBB', value: null, content: null },
      { key: 'ccc', value: null, content: null },
    ];

    // Test case-insensitive sorting
    const sorted = options.sort((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase()));

    expect(sorted.map((o) => o.key)).toEqual(['aaa', 'BBB', 'ccc', 'ZZZ']);
  });
});
