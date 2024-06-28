import { AssumeArmorMasterwork, StatConstraint } from '@destinyitemmanager/dim-api-types';
import { getBuckets } from 'app/destiny2/d2-buckets';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { ProcessResult } from 'app/loadout-builder/process-worker/types';
import { getAutoMods } from 'app/loadout-builder/process/mappers';
import { runProcess } from 'app/loadout-builder/process/process-wrapper';
import { ArmorSet, LockableBucketHashes, StatRanges } from 'app/loadout-builder/types';
import { statTier } from 'app/loadout-builder/utils';
import { randomSubclassConfiguration } from 'app/loadout-drawer/auto-loadouts';
import { addItem, setLoadoutParameters } from 'app/loadout-drawer/loadout-drawer-reducer';
import {
  convertToLoadoutItem,
  newLoadout,
  newLoadoutFromEquipped,
} from 'app/loadout-drawer/loadout-utils';
import { Loadout } from 'app/loadout/loadout-types';
import { armorStats } from 'app/search/d2-known-values';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import { normalToReducedMod } from 'data/d2/reduced-cost-mod-mappings';
import { produce } from 'immer';
import _, { stubTrue } from 'lodash';
import {
  DestinyClass,
  DestinyProfileResponse,
} from 'node_modules/bungie-api-ts/destiny2/interfaces';
import { recoveryModHash } from 'testing/test-item-utils';
import { getTestDefinitions, getTestProfile, getTestStores } from 'testing/test-utils';
import { analyzeLoadout } from './analysis';
import { LoadoutAnalysisContext, LoadoutFinding } from './types';

let defs: D2ManifestDefinitions;
let allItems: DimItem[];
let store: DimStore;
let equippedLoadout: Loadout;
let context: LoadoutAnalysisContext;
const voidScavengerModHash = 802695661; // InventoryItem "Void Scavenger"

const analyze = async (
  loadout: Loadout,
  worker: typeof noopProcessWorkerMock = noopProcessWorkerMock,
) => await analyzeLoadout(context, store.id, store.classType, loadout, worker);

function noopProcessWorkerMock(..._args: Parameters<typeof runProcess>): {
  cleanup: () => void;
  resultPromise: Promise<Omit<ProcessResult, 'sets'> & { sets: ArmorSet[]; processTime: number }>;
} {
  return {
    cleanup: _.noop,
    resultPromise: Promise.resolve({
      combos: 0,
      processTime: 0,
      sets: [],
      processInfo: undefined,
      statRangesFiltered: Object.fromEntries(
        armorStats.map((h) => [
          h,
          {
            minTier: 10,
            maxTier: 0,
          },
        ]),
      ) as StatRanges,
    }),
  };
}

beforeAll(async () => {
  let stores: DimStore[];
  let profileResponse: DestinyProfileResponse;
  [defs, stores, profileResponse] = await Promise.all([
    getTestDefinitions(),
    getTestStores(),
    getTestProfile(),
  ]);
  allItems = stores.flatMap((store) => store.items);
  store = stores.find((s) => s.classType === DestinyClass.Hunter)!;
  equippedLoadout = newLoadoutFromEquipped('Test Loadout', store, /* artifactUnlocks */ undefined);
  const reducedVoidScavengerModHash = normalToReducedMod[voidScavengerModHash];
  const unlockedPlugs = new Set([reducedVoidScavengerModHash]);
  context = {
    allItems,
    itemCreationContext: {
      defs,
      profileResponse,
      buckets: getBuckets(defs),
      customStats: [],
      itemComponents: undefined,
    },
    savedLoStatConstraintsByClass: {
      [DestinyClass.Hunter]: armorStats.map((statHash) => ({ statHash })),
    },
    autoModDefs: getAutoMods(defs, unlockedPlugs),
    unlockedPlugs,
    // No idea how to test this
    filterFactory: () => stubTrue,
    validateQuery: () => ({ valid: true }),
  };
});

// One test per finding, each running the analysis twice - once where the finding gets triggered and one where it's not
describe('basic loadout analysis finding tests', () => {
  it('finds MissingItems', async () => {
    const results = await analyze(equippedLoadout);
    expect(results.findings).not.toContain(LoadoutFinding.MissingItems);
    const indexThatWillLikelyFailResolution = equippedLoadout.items.findIndex(
      (i) => !i.socketOverrides && !i.craftedDate,
    )!;
    const items = equippedLoadout.items.with(indexThatWillLikelyFailResolution, {
      ...equippedLoadout.items[indexThatWillLikelyFailResolution],
      id: '123',
    });
    const loadoutWithMissingItem: Loadout = { ...equippedLoadout, items };
    const resultsWithMissingItem = await analyze(loadoutWithMissingItem);
    expect(resultsWithMissingItem.findings).toContain(LoadoutFinding.MissingItems);
  });

  it('finds InvalidMods', async () => {
    expect(equippedLoadout.parameters!.mods!.length).toBeGreaterThan(0); // please use mods Ben
    const results = await analyze(equippedLoadout);
    expect(results.findings).not.toContain(LoadoutFinding.InvalidMods);
    const loadoutWithDeprecatedMods: Loadout = {
      ...equippedLoadout,
      parameters: {
        ...equippedLoadout.parameters,
        mods: [...equippedLoadout.parameters!.mods!, 987],
      },
    };
    const resultsWithMissingItem = await analyze(loadoutWithDeprecatedMods);
    expect(resultsWithMissingItem.findings).toContain(LoadoutFinding.InvalidMods);
  });

  it('finds EmptyFragmentSlots/TooManyFragments', async () => {
    const subclass = store.items.find((i) => i.sockets && i.bucket.hash === BucketHashes.Subclass)!;
    // Abusing this because it should fill the subclass exactly
    // it'd be neat to write some code for constructing a config that
    // doesn't exactly rely on running the code under test...
    let config = randomSubclassConfiguration(defs, subclass)!;
    const emptyLoadout = newLoadout('Subclass Loadout', [], store.classType);
    const results = await analyze(addItem(defs, subclass, true, config)(emptyLoadout));
    expect(results.findings).not.toContain(LoadoutFinding.EmptyFragmentSlots);
    expect(results.findings).not.toContain(LoadoutFinding.TooManyFragments);

    const maxFragmentIndex = _.max(Object.keys(config).map((idx) => parseInt(idx, 10)))!;
    const resultsWithTooManyFragments = await analyze(
      addItem(defs, subclass, true, {
        ...config,
        [maxFragmentIndex + 1]: config[maxFragmentIndex],
      })(emptyLoadout),
    );
    expect(resultsWithTooManyFragments.findings).not.toContain(LoadoutFinding.EmptyFragmentSlots);
    expect(resultsWithTooManyFragments.findings).toContain(LoadoutFinding.TooManyFragments);

    const config2 = { ...config };
    delete config2[maxFragmentIndex];
    const resultsWithEmptyFragmentSlots = await analyze(
      addItem(defs, subclass, true, config2)(emptyLoadout),
    );
    expect(resultsWithEmptyFragmentSlots.findings).toContain(LoadoutFinding.EmptyFragmentSlots);
    expect(resultsWithEmptyFragmentSlots.findings).not.toContain(LoadoutFinding.TooManyFragments);
  });

  it('finds InvalidSearchQuery', async () => {
    const results = await analyze(equippedLoadout);
    expect(results.findings).not.toContain(LoadoutFinding.InvalidSearchQuery);
    // FIXME more tests
  });

  it('finds UsesSeasonalMods/ModsDontFit', async () => {
    const items = LockableBucketHashes.map(
      (hash) =>
        allItems.find(
          (i) =>
            i.classType === store.classType &&
            i.bucket.hash === hash &&
            i.energy &&
            i.tier === 'Legendary',
        )!,
    );
    const loadout = newLoadout(
      'UsesSeasonalMods',
      items.map((item) => convertToLoadoutItem(item, true)),
      store.classType,
    );

    const loadoutWithParameters: Loadout = {
      ...loadout,
      parameters: {
        mods: [
          voidScavengerModHash,
          voidScavengerModHash,
          voidScavengerModHash,
          recoveryModHash,
          recoveryModHash,
          recoveryModHash,
          recoveryModHash,
          recoveryModHash,
        ],
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
      },
    };

    // Normal mod costs 3, reduced mod costs 1, but we also have 5 recovery mods for a 4 cost each
    const results = await analyze(loadoutWithParameters);
    expect(results.findings).toContain(LoadoutFinding.UsesSeasonalMods);
    expect(results.findings).not.toContain(LoadoutFinding.ModsDontFit);

    // Now without access to cheap mods
    const results2 = await analyzeLoadout(
      { ...context, unlockedPlugs: new Set() },
      store.id,
      store.classType,
      loadoutWithParameters,
      noopProcessWorkerMock,
    );
    expect(results2.findings).not.toContain(LoadoutFinding.UsesSeasonalMods);
    expect(results2.findings).toContain(LoadoutFinding.ModsDontFit);
  });

  it('finds DoesNotRespectExotic', async () => {
    const exotic = allItems.find(
      (item) => item.bucket.inArmor && item.classType === store.classType && item.isExotic,
    )!;
    let loadout = newLoadout(
      'exotic loadout',
      [convertToLoadoutItem(exotic, true)],
      store.classType,
    );
    loadout = setLoadoutParameters({ exoticArmorHash: exotic.hash })(loadout);
    const result = await analyze(loadout);
    expect(result.findings).not.toContain(LoadoutFinding.DoesNotRespectExotic);

    loadout.items[0] = { ...loadout.items[0], id: '86774' };
    const result2 = await analyze(loadout);
    expect(result2.findings).not.toContain(LoadoutFinding.DoesNotRespectExotic);
    expect(result2.findings).toContain(LoadoutFinding.MissingItems);

    const differentExotic = allItems.find(
      (item) =>
        item.bucket.inArmor &&
        item.classType === store.classType &&
        item.isExotic &&
        item.hash !== exotic.hash,
    )!;
    loadout.items[0] = convertToLoadoutItem(differentExotic, true);
    const result3 = await analyze(loadout);
    expect(result3.findings).toContain(LoadoutFinding.DoesNotRespectExotic);
  });

  it('finds DoesNotSatisfyStatConstraints', async () => {
    const nonMasterworkedArmor = LockableBucketHashes.map(
      (hash) =>
        allItems.find(
          (i) =>
            i.classType === store.classType &&
            i.bucket.hash === hash &&
            i.energy &&
            (i.bucket.hash !== BucketHashes.ClassArmor || i.energy.energyCapacity >= 2) &&
            i.tier === 'Legendary' &&
            !i.masterwork &&
            i.stats?.every((stat) => stat.statHash !== StatHashes.Recovery || stat.base <= 20),
        )!,
    );

    // Make sure we have an item from each bucket
    expect(nonMasterworkedArmor.every((i) => i !== undefined)).toBe(true);

    let loadout = newLoadout(
      'Non masterworked armor',
      nonMasterworkedArmor.map((item) => convertToLoadoutItem(item, true)),
      store.classType,
    );
    const baseArmorStatConstraints: StatConstraint[] = armorStats.map((statHash) => ({
      statHash,
      minTier: statTier(
        _.sumBy(
          nonMasterworkedArmor,
          (item) => item.stats?.find((s) => s.statHash === statHash)?.base ?? 0,
        ) + (statHash === StatHashes.Recovery ? 10 : 0),
      ),
    }));
    // The loadout as is hits stats and needs no upgrades to do that
    loadout = setLoadoutParameters({
      mods: [recoveryModHash],
      assumeArmorMasterwork: AssumeArmorMasterwork.None,
      statConstraints: baseArmorStatConstraints,
    })(loadout);
    const result = await analyze(loadout);
    expect(result.findings).not.toContain(LoadoutFinding.DoesNotSatisfyStatConstraints);
    expect(result.findings).not.toContain(LoadoutFinding.NeedsArmorUpgrades);

    // Higher tiers, but we're not allowed to upgrade armor
    const newConstraints = produce(baseArmorStatConstraints, (draft) => {
      for (const c of draft) {
        if (c.statHash !== StatHashes.Recovery) {
          c.minTier = Math.min(10, c.minTier! + 1);
        } else {
          // No constraint for recovery
          c.minTier = 0;
        }
      }
      // Ignore mobility
      const mobilityIndex = draft.findIndex((stat) => stat.statHash === StatHashes.Mobility);
      draft.splice(mobilityIndex, 1);
    });
    // Also assert that the background auto-optimizer gets called with the correct stat constraints
    const mockProcess = jest.fn(noopProcessWorkerMock);
    const result2 = await analyze(
      setLoadoutParameters({ statConstraints: newConstraints })(loadout),
      mockProcess,
    );
    expect(mockProcess).toHaveBeenCalled();
    const args = mockProcess.mock.calls[0][0].desiredStatRanges;
    for (const c of args) {
      if (c.statHash === StatHashes.Recovery) {
        // The loadout has no constraint for recovery, so it gets the existing loadout stats as the minimum
        expect(c.minTier).toBe(
          baseArmorStatConstraints.find((base) => base.statHash === c.statHash)!.minTier,
        );
      } else if (c.statHash !== StatHashes.Mobility) {
        // The loadout does not satisfy stat constraints, but LO gets called with the constraints as minimum
        expect(c.minTier).toBe(newConstraints.find((n) => n.statHash === c.statHash)!.minTier);
      }
    }

    expect(result2.findings).toContain(LoadoutFinding.DoesNotSatisfyStatConstraints);
    expect(result2.findings).not.toContain(LoadoutFinding.NeedsArmorUpgrades);

    // Now allow upgrading armor - we assume the user wants to upgrade armor as allowed, which
    // will hit stats (but point out the need for upgrades)
    const result3 = await analyze(
      setLoadoutParameters({
        statConstraints: newConstraints,
        assumeArmorMasterwork: AssumeArmorMasterwork.All,
      })(loadout),
    );
    expect(result3.findings).not.toContain(LoadoutFinding.DoesNotSatisfyStatConstraints);
    expect(result3.findings).toContain(LoadoutFinding.NeedsArmorUpgrades);
  });
});
