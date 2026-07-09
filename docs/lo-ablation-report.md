# Loadout Optimizer optimization ablation study

**Date:** 2026-07-09. **Branch:** `lo-ablation-bench` (master + #11873 + #11874 + bench-only toggles; never to be merged).
**Context:** bhollis's #11868 review suggested that once the optimization PRs landed it would be worth "undoing optimizations that aren't that meaningful." This measures each optimization's individual contribution.

## Method

Eleven toggles (`ablation-toggles.ts`) disable one optimization each, read once per `process()` run so the instrumented hot loop pays only a predicted branch on a local. A matrix runner (`process.ablation.bench.test.ts`) interleaves each toggle ON and OFF within every round and reports min over 5 rounds, so ratios are immune to this machine's ~2.5x clock drift. "Removal cost" is `off_min / on_min`: 15x means removing that one optimization makes the whole search 15x slower; 1.00x means it does nothing on that scenario.

Guards:

- The parity suite (candidate vs frozen baseline, 11 invariant tests) passes with every single toggle ablated.
- The matrix runner asserts OFF runs return byte-equal results to ON runs (valid-set counts, returned sets, stat ranges), except the two order/tie-sensitive toggles (`strictBeat`, `highStatSort`) where only stat-range equality is asserted, matching what the parity invariants guarantee.
- No instrumentation overhead: the standard baseline-vs-candidate bench on the instrumented branch reports equal or better ratios than the un-instrumented same-day run.

Corpora: the synthetic 18/18/18/18/4 corpus from `process.bench.test.ts` (five scenario variants), and Rob's real profile (`LO_BENCH_PROFILE`), 25 items per bucket, 9.77M combos.

## Results (removal cost, min over 5 interleaved rounds)

Synthetic (419,904 combos):

| Toggle | minimums | showAll | anyExotic | mods+energy | setBonus+perks |
|---|---|---|---|---|---|
| subtreePrune | **14.52x** | **12.99x** | **2.46x** | **10.43x** | **7.09x** |
| highStatSort | **1.74x** | **1.64x** | 1.09x | **3.32x** | **2.13x** |
| rangeSeeding | **1.23x** | **1.20x** | 1.01x | **1.24x** | 0.98x |
| autoModsMemo | 1.06x | 1.08x | 1.02x | **0.53x** | 1.04x |
| strictBeat | 1.06x | 1.03x | 1.04x | 1.04x | 1.00x |
| coarseLevelPrunes | 1.00x | 0.99x | 0.99x | 1.00x | 1.11x |
| convergenceGate | 1.02x | 0.99x | 1.03x | 1.01x | 1.00x |
| energyCache | 1.03x | 1.00x | 1.01x | 1.02x | 1.00x |
| maxBoostMemo | 1.01x | 0.98x | 0.98x | 0.96x | 1.00x |
| unrolledAdds | 1.00x | 1.02x | 0.98x | 0.98x | 1.00x |

Real vault (Rob's profile, 25/bucket, 9.77M combos):

With exotics included (see gap 2 below; predicate fixed, memo gate applied, so autoModsMemo rows reflect the gated memo):

| Toggle | showAll | minimums (90/90/60) | anyExotic |
|---|---|---|---|
| subtreePrune | **46.34x** (162ms vs 7.5s) | **6.12x** (1.6s vs 9.8s) | **77.14x** (23ms vs 1.8s) |
| coarseLevelPrunes | 1.00x | 1.00x | **16.38x** |
| strictBeat | **1.09x** | 1.03x | **1.60x** |
| tuningPreGate | **1.07x** | **1.14x** | **1.52x** |
| rangeSeeding | **1.28x** | 1.01x | 1.02x |
| autoModsMemo (gated) | 1.00x | **1.10x** | **1.10x** |
| convergenceGate | 1.05x | 1.01x | 1.03x |
| everything else | 0.99-1.00x | 0.99-1.01x | 1.00-1.02x |

Earlier run with the broken exotic-free corpus (kept for reference; it exaggerates some rows): subtreePrune 1003.84x showAll / 11.45x minimums, strictBeat 8.34x showAll, rangeSeeding 1.72x showAll, coarseLevelPrunes 226x on a fully-degenerate anyExotic.

Slicing (bench test 3, real profile, 60/bucket, 6 slices, minimums, exotic-free corpus): contiguous wall 5464ms, interleaved wall 5444ms (0.4% apart, imbalance 1.51x vs 1.55x). **No measurable benefit from interleaved slicing on this profile.**

## Recommendations

**Keep, clearly earning their weight:**

- **subtreePrune** (B&B, #11868): 2.5x to 77x on realistic corpora (up to 1000x on the exotic-free one). The headline result; without it a real-vault show-everything search takes seconds instead of tens of milliseconds.
- **coarseLevelPrunes** (#11860): free normally, **16.38x** on real-vault anyExotic, and its partial-sum accumulators are shared infrastructure for subtreePrune anyway.
- **strictBeat** (#11860): 1.09-1.60x on the real vault (8.34x on the exotic-free corpus with its mass boundary ties); ~5 lines of code. Synthetic data (uncorrelated stats, few ties) hid most of its value.
- **tuningPreGate** (#11862): 1.07-1.52x on the real vault once exotics are actually in the corpus. Earns its ~35 lines.
- **rangeSeeding** (#11868): 1.2-1.28x in showAll modes, free elsewhere; ~90 lines.
- **highStatSort** (#11860): 1.6-3.3x when the input isn't already sorted; 1.00x on the real-vault bench only because that harness pre-sorts while capping. 24 lines, keeps the heap floor rising early.

**Change (concrete follow-up, answers bhollis's #11860 string-key comment):**

- **autoModsMemo** (#11860): helps 1.06-1.20x when there's a single energy vector (packed number keys) but **hurts** badly with locked activity mods, where multiple energy vectors force the string-key path: removing the memo made that scenario 1.9x faster (60ms vs 32ms). Recommendation: keep the memo but bypass it when `remainingEnergyCapacities.length > 1`, i.e. never build string keys. bhollis was right to be suspicious of that path.
  **Validated:** with the gate applied (branch `lo-automods-memo-gate`, based on origin/master), the locked-mods scenario's all-on time dropped from ~60ms to 29.6ms, the memo ablation there flattened to 1.00x (no downside left), and the single-vector wins survived unchanged (1.22x vault showAll, 1.08x vault minimums). Results byte-identical in every scenario.

**Removal candidates (no measurable value anywhere, per the <2% criterion):**

- **maxBoostMemo** (#11860, +62/-33 lines): 0.96-1.01x everywhere. The convergence gate and the cheap upper-bound check inside updateMaxStats already keep the binary search rare; the second memo layer never pays for itself.
- **energyCache** (#11860, +43/-7 lines): 0.99-1.03x everywhere, including the locked-activity-mods scenario it targets.
- **unrolledAdds** (#11860, ~12 lines): 0.98-1.02x. After the helper extraction in #11874 the manual unrolling no longer measures; plain loops read better.
- **convergenceGate** (#11860, +28/-9 lines): 0.97-1.05x, borderline. Cheap to keep, cheap to drop; grouping it with the removals is defensible.
- **interleaved slicing** (#11868, process-wrapper): no difference vs contiguous on this profile (5444 vs 5464ms). The code delta vs contiguous is small either way; reverting is optional but the data doesn't support keeping it on merit.

**Not measured, with reasons:**

- **SoA layout** (#11860): structurally load-bearing; every prune reads it. Unmeasurable without a rewrite.
- **Tail-resolved exotic tuning** (#11862): a feature as much as an optimization (its bounds feed subtreePrune); ablating it means restoring per-mod item expansion.
- **Warm worker pool** (#11868): real Workers don't run under jest; it's a latency feature (saves worker spawn + comlink handshake per run), not throughput. Not measured in this study; a browser-side timing would be needed and wasn't attempted.

## Bugs and gaps found by the harness

1. **Range-seeding minStat bug (on master, fixed on this branch):** the min seed summed unconstrained per-bucket floors, which can combine two exotics into a "set" the loop skips as double-exotic, seeding a displayed stat minimum no valid set reaches (observed: 28 seeded vs 29 real). Fixed by computing the floor from non-exotic minimums plus the single best exotic swap (commit "Fix range seeding minStat undershooting with double-exotic floors"). **Needs extraction into a real PR.** Parity missed it because the parity corpus never trips it; the ablation ON/OFF equality assertion caught it immediately.
2. **The bench mapped zero exotics from a real profile**: the `isArmor2*` predicates in `testing/test-item-utils.ts` require Legendary rarity and no equippingLabel, so they exclude every exotic by construction (not an armor 3.0 thing). Fixed in the ablation bench with an inclusive energy-bearing-armor predicate; the vault tables above are from the fixed corpus. **The real-vault test in `process.bench.test.ts` on master has the same blind spot** and its historical "real vault" numbers were all-legendary.
3. **Bonus measurement:** #11873 (sort energy vectors once) measured ~35% on the locked-mods synthetic scenario (frozen-baseline ratio moved from 6.75x to 10.18x) and ~20% on unconstrained, before the ablation toggles were added.

## Reproducing

```
git checkout lo-ablation-bench
# flip test.skip -> test in process.ablation.bench.test.ts, then:
LO_BENCH_PROFILE=path/to/profile.json npx jest process.ablation --silent=false
# parity under any ablation:
LO_ABLATE=autoModsMemo npx jest process-parity
```
