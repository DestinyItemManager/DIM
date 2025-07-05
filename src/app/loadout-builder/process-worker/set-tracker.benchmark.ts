/* eslint-disable no-console */
import { HeapSetTracker } from './heap-set-tracker';
import { SetTracker } from './set-tracker';
import { ProcessItem } from './types';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate more realistic stat distributions that match what the loadout optimizer sees.
 * Higher tier combinations are less common, matching real armor stat patterns.
 */
function generateRealisticStatMix(): [number, string, number[]] {
  // Generate stats that sum approximately to target tier
  const stats = Array.from({ length: 6 }, () => randomInt(55, 67));
  const tier = stats.reduce((a, b) => a + b, 0);
  const statMix = stats.map((n) => n.toString(16)).join('');
  return [tier, statMix, stats];
}

function createMockArmor(id: string, power: number): ProcessItem {
  return {
    id,
    hash: 123,
    name: `Item ${id}`,
    isExotic: false,
    isArtifice: false,
    remainingEnergyCapacity: 10,
    power,
    stats: {},
    compatibleModSeasons: [],
  };
}

/**
 * Benchmark that matches the real-world usage pattern from process.ts:
 * 1. Call couldInsert() for every potential set (millions of times)
 * 2. Only call insert() when couldInsert() returns true
 * 3. Call getArmorSets() once at the end
 */
function benchmarkRealisticUsage(
  name: string,
  TrackerClass: typeof SetTracker | typeof HeapSetTracker,
  testData: [number, string, number[], ProcessItem[]][],
  totalAttempts: number,
  capacity: number,
) {
  console.log(
    `\n=== ${name} - ${totalAttempts.toLocaleString()} attempts, capacity ${capacity} ===`,
  );

  const tracker = new TrackerClass(capacity);

  // Benchmark the critical path: couldInsert + insert pattern
  let couldInsertCalls = 0;
  let actualInserts = 0;

  const startTime = performance.now();

  for (const [tier, statMix, stats, armor] of testData) {
    couldInsertCalls++;

    // This is the hot path - called for every potential set
    if (tracker.couldInsert(tier)) {
      actualInserts++;
      tracker.insert(tier, statMix, armor, stats);
    }
  }

  const insertPhaseTime = performance.now() - startTime;

  // Benchmark getArmorSets (called once at end)
  const getStartTime = performance.now();
  const results = tracker.getArmorSets(); // Match RETURNED_ARMOR_SETS from process.ts
  const getTime = performance.now() - getStartTime;

  const totalTime = insertPhaseTime + getTime;

  console.log(`  couldInsert() calls: ${couldInsertCalls.toLocaleString()}`);
  console.log(
    `  actual inserts: ${actualInserts.toLocaleString()} (${((actualInserts / couldInsertCalls) * 100).toFixed(1)}%)`,
  );
  console.log(`  final sets returned: ${results.length}`);
  console.log(`  insert phase: ${insertPhaseTime.toFixed(2)}ms`);
  console.log(`  getArmorSets(): ${getTime.toFixed(2)}ms`);
  console.log(`  total time: ${totalTime.toFixed(2)}ms`);
  console.log(
    `  throughput: ${Math.floor((couldInsertCalls * 1000) / totalTime).toLocaleString()} ops/sec`,
  );

  return {
    insertTime: insertPhaseTime,
    getTime,
    totalTime,
    couldInsertCalls,
    actualInserts,
    throughput: (couldInsertCalls * 1000) / totalTime,
  };
}

/**
 * Run benchmarks that match the scale and patterns from real loadout optimization.
 * Based on process.ts analysis:
 * - SetTracker capacity is 10,000
 * - Millions of couldInsert() calls
 * - Only successful sets get inserted
 * - getArmorSets(200) called once at end
 */
function runRealisticBenchmarks() {
  console.log('='.repeat(80));
  console.log('LOADOUT OPTIMIZER SET TRACKER BENCHMARK');
  console.log('Realistic usage patterns based on process.ts analysis');
  console.log('='.repeat(80));

  const capacity = 200; // Match process.ts SetTracker capacity
  const testSizes = [
    100_000, // Small test
    5_000_000, // Normal complexity
  ];

  for (const testSize of testSizes) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST SIZE: ${testSize.toLocaleString()} combinations`);
    console.log(`${'='.repeat(60)}`);

    // Pre-generate all test data to avoid measuring data generation
    const testData: [number, string, number[], ProcessItem[]][] = [];
    for (let i = 0; i < testSize; i++) {
      const [tier, statMix, stats] = generateRealisticStatMix();
      const armor = [createMockArmor(`id${i}`, randomInt(1000, 2000))];
      testData.push([tier, statMix, stats, armor]);
    }

    const setTrackerResults = benchmarkRealisticUsage(
      'SetTracker',
      SetTracker,
      testData,
      testSize,
      capacity,
    );
    const heapTrackerResults = benchmarkRealisticUsage(
      'HeapSetTracker',
      HeapSetTracker,
      testData,
      testSize,
      capacity,
    );

    console.log(`\n--- COMPARISON ---`);
    const speedupInsert = setTrackerResults.insertTime / heapTrackerResults.insertTime;
    const speedupGet = setTrackerResults.getTime / heapTrackerResults.getTime;
    const speedupTotal = setTrackerResults.totalTime / heapTrackerResults.totalTime;
    const throughputRatio = heapTrackerResults.throughput / setTrackerResults.throughput;

    console.log(
      `Insert phase speedup: ${speedupInsert.toFixed(2)}x ${speedupInsert > 1 ? '(HeapSetTracker faster)' : '(SetTracker faster)'}`,
    );
    console.log(
      `getArmorSets speedup: ${speedupGet.toFixed(2)}x ${speedupGet > 1 ? '(HeapSetTracker faster)' : '(SetTracker faster)'}`,
    );
    console.log(
      `Total speedup: ${speedupTotal.toFixed(2)}x ${speedupTotal > 1 ? '(HeapSetTracker faster)' : '(SetTracker faster)'}`,
    );
    console.log(`Throughput improvement: ${throughputRatio.toFixed(2)}x`);

    if (speedupTotal > 1) {
      console.log(`🎉 HeapSetTracker is ${speedupTotal.toFixed(2)}x faster overall!`);
    } else {
      console.log(`⚠️  SetTracker is still ${(1 / speedupTotal).toFixed(2)}x faster`);
    }
  }
}

// Additional micro-benchmark for the critical couldInsert() path
function benchmarkCouldInsert() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('MICRO-BENCHMARK: couldInsert() hot path');
  console.log(`${'='.repeat(60)}`);

  const capacity = 10000;
  const iterations = 10_000_000; // 10M calls to measure nanosecond differences

  const setTracker = new SetTracker(capacity);
  const heapTracker = new HeapSetTracker(capacity);

  // Pre-fill with some data to make couldInsert more realistic
  for (let i = 0; i < 100; i++) {
    const [tier, statMix, stats] = generateRealisticStatMix();
    const armor = [createMockArmor(`warmup${i}`, 1500)];
    setTracker.insert(tier, statMix, armor, stats);
    heapTracker.insert(tier, statMix, armor, stats);
  }

  console.log(`\nTesting ${iterations.toLocaleString()} couldInsert() calls...`);

  // Test SetTracker
  let start = performance.now();
  for (let i = 0; i < iterations; i++) {
    setTracker.couldInsert(30 + (i % 20)); // Vary the tier to prevent optimization
  }
  const setTrackerTime = performance.now() - start;

  // Test HeapSetTracker
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    heapTracker.couldInsert(30 + (i % 20)); // Same pattern
  }
  const heapTrackerTime = performance.now() - start;

  console.log(`SetTracker couldInsert(): ${setTrackerTime.toFixed(2)}ms`);
  console.log(`HeapSetTracker couldInsert(): ${heapTrackerTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(setTrackerTime / heapTrackerTime).toFixed(2)}x`);
  console.log(
    `Nanoseconds per call: SetTracker ${((setTrackerTime * 1000000) / iterations).toFixed(2)}ns, HeapSetTracker ${((heapTrackerTime * 1000000) / iterations).toFixed(2)}ns`,
  );
}

// Run all benchmarks
if (import.meta.url === `file://${process.argv[1]}`) {
  runRealisticBenchmarks();
  benchmarkCouldInsert();
}
