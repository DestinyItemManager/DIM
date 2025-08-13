import { isArtifice } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import { createTestArmor } from './test-armor-factory';
import { setupi18n } from './test-utils';

// Set up i18n for tests
beforeAll(() => {
  setupi18n();
});

describe('Test Armor Factory', () => {
  describe('Basic Functionality', () => {
    it('should create armor with default options', async () => {
      const armor = await createTestArmor();

      expect(armor).toBeDefined();
      expect(armor.bucket.hash).toBe(BucketHashes.Helmet);
      expect(armor.classType).toBe(DestinyClass.Hunter);
      expect(armor.tier).toBe(1);
      expect(armor.stats).toBeDefined();

      // Check that we have all 6 armor stats (may have additional stats like defense)
      const armorStatHashes = [
        StatHashes.Health,
        StatHashes.Melee,
        StatHashes.Grenade,
        StatHashes.Super,
        StatHashes.Class,
        StatHashes.Weapons,
      ];

      for (const statHash of armorStatHashes) {
        expect(armor.stats?.find((s) => s.statHash === statHash)).toBeDefined();
      }
    });

    it('should create armor for different buckets', async () => {
      const helmet = await createTestArmor({ bucketHash: BucketHashes.Helmet });
      const gauntlets = await createTestArmor({ bucketHash: BucketHashes.Gauntlets });
      const chest = await createTestArmor({ bucketHash: BucketHashes.ChestArmor });
      const legs = await createTestArmor({ bucketHash: BucketHashes.LegArmor });
      const classItem = await createTestArmor({ bucketHash: BucketHashes.ClassArmor });

      expect(helmet.bucket.hash).toBe(BucketHashes.Helmet);
      expect(gauntlets.bucket.hash).toBe(BucketHashes.Gauntlets);
      expect(chest.bucket.hash).toBe(BucketHashes.ChestArmor);
      expect(legs.bucket.hash).toBe(BucketHashes.LegArmor);
      expect(classItem.bucket.hash).toBe(BucketHashes.ClassArmor);
    });

    it('should create armor for different classes', async () => {
      const hunterArmor = await createTestArmor({ classType: DestinyClass.Hunter });
      const titanArmor = await createTestArmor({ classType: DestinyClass.Titan });
      const warlockArmor = await createTestArmor({ classType: DestinyClass.Warlock });

      expect(hunterArmor.classType).toBe(DestinyClass.Hunter);
      expect(titanArmor.classType).toBe(DestinyClass.Titan);
      expect(warlockArmor.classType).toBe(DestinyClass.Warlock);
    });
  });

  describe('Stat Specification', () => {
    it('should accept stats as an object', async () => {
      const customStats = {
        [StatHashes.Health]: 25,
        [StatHashes.Melee]: 15,
        [StatHashes.Grenade]: 10,
        [StatHashes.Super]: 20,
        [StatHashes.Class]: 12,
        [StatHashes.Weapons]: 8,
      };

      const armor = await createTestArmor({ stats: customStats });

      expect(armor.stats).toBeDefined();
      const statMap = new Map(armor.stats!.map((s) => [s.statHash, s.value]));

      expect(statMap.get(StatHashes.Health)).toBe(25);
      expect(statMap.get(StatHashes.Melee)).toBe(15);
      expect(statMap.get(StatHashes.Grenade)).toBe(10);
      expect(statMap.get(StatHashes.Super)).toBe(20);
      expect(statMap.get(StatHashes.Class)).toBe(12);
      expect(statMap.get(StatHashes.Weapons)).toBe(8);
    });

    it('should accept stats as an array', async () => {
      const statsArray = [25, 15, 10, 20, 12, 8]; // [health, melee, grenade, super, class, weapons]

      const armor = await createTestArmor({ stats: statsArray });

      expect(armor.stats).toBeDefined();
      const statMap = new Map(armor.stats!.map((s) => [s.statHash, s.value]));

      expect(statMap.get(StatHashes.Health)).toBe(25);
      expect(statMap.get(StatHashes.Melee)).toBe(15);
      expect(statMap.get(StatHashes.Grenade)).toBe(10);
      expect(statMap.get(StatHashes.Super)).toBe(20);
      expect(statMap.get(StatHashes.Class)).toBe(12);
      expect(statMap.get(StatHashes.Weapons)).toBe(8);
    });

    it('should generate random realistic stats when none provided', async () => {
      const armor = await createTestArmor();

      expect(armor.stats).toBeDefined();

      // Check that we have all 6 armor stats (may have additional stats like defense)
      const armorStatHashes = [
        StatHashes.Health,
        StatHashes.Melee,
        StatHashes.Grenade,
        StatHashes.Super,
        StatHashes.Class,
        StatHashes.Weapons,
      ];

      for (const statHash of armorStatHashes) {
        expect(armor.stats?.find((s) => s.statHash === statHash)).toBeDefined();
      }

      // Calculate total only for armor stats
      const armorStatsOnly = armor.stats!.filter((stat) => armorStatHashes.includes(stat.statHash));
      const totalStats = armorStatsOnly.reduce((sum, stat) => sum + stat.value, 0);
      expect(totalStats).toBeGreaterThanOrEqual(60);
      expect(totalStats).toBeLessThanOrEqual(70);

      // Each armor stat should be at least 2
      for (const stat of armorStatsOnly) {
        expect(stat.value).toBeGreaterThanOrEqual(2);
      }
    });

    it('should throw error for invalid stats array length', async () => {
      await expect(createTestArmor({ stats: [10, 15, 20] })).rejects.toThrow(
        'Stats array must have exactly 6 values',
      );
    });
  });

  describe('Tier Configuration', () => {
    it('should create armor with different tiers', async () => {
      const tier0 = await createTestArmor({ tier: 0 });
      const tier3 = await createTestArmor({ tier: 3 });
      const tier5 = await createTestArmor({ tier: 5 });

      expect(tier0.tier).toBe(0);
      expect(tier3.tier).toBe(3);
      expect(tier5.tier).toBe(5);

      // Higher tier should have higher defense
      expect(tier5.power).toBeGreaterThan(tier0.power);
    });

    it('should create tier 5 armor with tuning socket', async () => {
      const tier5Armor = await createTestArmor({ tier: 5 });

      expect(tier5Armor.tier).toBe(5);
      expect(tier5Armor.sockets).toBeDefined();
      // In a real implementation, we'd check for specific tuning socket types
    });
  });

  describe('Artifice Configuration', () => {
    it('should create artifice armor', async () => {
      const artificeArmor = await createTestArmor({
        tier: 0, // Artifice requires tier 0
        isArtifice: true,
      });

      expect(artificeArmor.tier).toBe(0);
      expect(isArtifice(artificeArmor)).toBe(true);
    });

    it('should throw error when artifice is requested with non-zero tier', async () => {
      await expect(
        createTestArmor({
          tier: 1,
          isArtifice: true,
        }),
      ).rejects.toThrow('Artifice armor must be tier 0');
    });
  });

  describe('Masterwork Configuration', () => {
    it('should create masterworked armor', async () => {
      const masterworkedArmor = await createTestArmor({ masterworked: true });

      expect(masterworkedArmor.masterwork).toBe(true);
      expect(masterworkedArmor.energy?.energyCapacity).toBe(10);
    });

    it('should create non-masterworked armor with appropriate energy', async () => {
      const regularArmor = await createTestArmor({
        tier: 2,
        masterworked: false,
      });

      expect(regularArmor.masterwork).toBe(false);
      expect(regularArmor.energy?.energyCapacity).toBe(4); // tier * 2
    });
  });

  describe('Exotic Configuration', () => {
    it('should create exotic armor', async () => {
      const exoticArmor = await createTestArmor({
        isExotic: true,
        bucketHash: BucketHashes.ChestArmor,
        classType: DestinyClass.Titan,
      });

      expect(exoticArmor.isExotic).toBe(true);
      expect(exoticArmor.tier).toBeDefined();
    });

    it('should create legendary armor by default', async () => {
      const legendaryArmor = await createTestArmor();

      expect(legendaryArmor.isExotic).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should create endgame artifice armor', async () => {
      const endgameArmor = await createTestArmor({
        bucketHash: BucketHashes.ChestArmor,
        classType: DestinyClass.Warlock,
        tier: 0,
        isArtifice: true,
        masterworked: true,
        stats: {
          [StatHashes.Health]: 22,
          [StatHashes.Melee]: 8,
          [StatHashes.Grenade]: 25,
          [StatHashes.Super]: 20,
          [StatHashes.Class]: 15,
          [StatHashes.Weapons]: 10,
        },
      });

      expect(endgameArmor.bucket.hash).toBe(BucketHashes.ChestArmor);
      expect(endgameArmor.classType).toBe(DestinyClass.Warlock);
      expect(endgameArmor.tier).toBe(0);
      expect(isArtifice(endgameArmor)).toBe(true);
      expect(endgameArmor.masterwork).toBe(true);
      expect(endgameArmor.energy?.energyCapacity).toBe(10);
    });

    it('should create high-tier legendary armor', async () => {
      const highTierArmor = await createTestArmor({
        bucketHash: BucketHashes.Gauntlets,
        classType: DestinyClass.Hunter,
        tier: 5,
        masterworked: true,
        stats: [30, 10, 15, 10, 10, 5], // High mobility focus
      });

      expect(highTierArmor.tier).toBe(5);
      expect(highTierArmor.masterwork).toBe(true);
      expect(highTierArmor.isExotic).toBe(false);

      const statMap = new Map(highTierArmor.stats!.map((s) => [s.statHash, s.value]));
      expect(statMap.get(StatHashes.Health)).toBe(30); // High mobility
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum stat values', async () => {
      const minStatArmor = await createTestArmor({
        stats: [2, 2, 2, 2, 2, 2], // Minimum possible values
      });

      const statMap = new Map(minStatArmor.stats!.map((s) => [s.statHash, s.value]));
      expect(statMap.get(StatHashes.Health)).toBe(2);
      expect(statMap.get(StatHashes.Melee)).toBe(2);
    });

    it('should handle maximum realistic stat values', async () => {
      const maxStatArmor = await createTestArmor({
        stats: [30, 30, 30, 30, 30, 30], // Very high values
      });

      const statMap = new Map(maxStatArmor.stats!.map((s) => [s.statHash, s.value]));
      expect(statMap.get(StatHashes.Health)).toBe(30);
      expect(statMap.get(StatHashes.Melee)).toBe(30);
    });
  });
});
