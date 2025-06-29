import { MAX_STAT } from 'app/loadout/known-values';
import { armorStats } from 'app/search/d2-known-values';
import { resolveStatConstraints, unresolveStatConstraints } from './loadout-params';

describe('resolveStatConstraints', () => {
  const cases = [
    {
      name: 'fills in ignored stats',
      before: [
        { statHash: armorStats[0], minStat: 20, maxStat: 60 },
        { statHash: armorStats[2], minStat: 10 },
      ],
      after: [
        { statHash: armorStats[0], minStat: 20, maxStat: 60, ignored: false },
        // Order is preserved
        { statHash: armorStats[2], minStat: 10, maxStat: MAX_STAT, ignored: false },
        { statHash: armorStats[1], minStat: 0, maxStat: MAX_STAT, ignored: true },
        { statHash: armorStats[3], minStat: 0, maxStat: MAX_STAT, ignored: true },
        { statHash: armorStats[4], minStat: 0, maxStat: MAX_STAT, ignored: true },
        { statHash: armorStats[5], minStat: 0, maxStat: MAX_STAT, ignored: true },
      ],
    },
    {
      name: 'uses minTier/maxTier if minStat/maxStat are not provided',
      before: [{ statHash: armorStats[1], minTier: 3, maxTier: 5 }],
      after: [
        { statHash: armorStats[1], minStat: 30, maxStat: 50, ignored: false },
        { statHash: armorStats[0], minStat: 0, maxStat: MAX_STAT, ignored: true },
        { statHash: armorStats[2], minStat: 0, maxStat: MAX_STAT, ignored: true },
        { statHash: armorStats[3], minStat: 0, maxStat: MAX_STAT, ignored: true },
        { statHash: armorStats[4], minStat: 0, maxStat: MAX_STAT, ignored: true },
        { statHash: armorStats[5], minStat: 0, maxStat: MAX_STAT, ignored: true },
      ],
    },
  ];

  for (const { name, before, after } of cases) {
    it(name, () => {
      const result = resolveStatConstraints(before);
      expect(result).toEqual(after);
    });
  }
});

describe('unresolveStatConstraints', () => {
  const cases = [
    {
      name: 'converts resolved constraints back to StatConstraint[]',
      before: [
        { statHash: armorStats[2], minStat: 10, maxStat: MAX_STAT, ignored: false },
        { statHash: armorStats[0], minStat: 20, maxStat: 60, ignored: false },
        { statHash: armorStats[1], minStat: 0, maxStat: MAX_STAT, ignored: true },
      ],
      after: [
        { statHash: armorStats[2], minStat: 10 },
        { statHash: armorStats[0], minStat: 20, maxStat: 60 },
      ],
    },
    {
      name: 'omits minStat if 0 and maxStat if MAX_STAT',
      before: [{ statHash: armorStats[0], minStat: 0, maxStat: MAX_STAT, ignored: false }],
      after: [{ statHash: armorStats[0] }],
    },
  ];

  for (const { name, before, after } of cases) {
    it(name, () => {
      const result = unresolveStatConstraints(before);
      expect(result).toEqual(after);
    });
  }
});
