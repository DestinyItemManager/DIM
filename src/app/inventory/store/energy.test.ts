import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { energyUpgrade } from './energy';

describe('energyUpgrade', () => {
  test('can upgrade capacity by 1', () =>
    expect(energyUpgrade(DestinyEnergyType.Arc, 1, DestinyEnergyType.Arc, 2)).toEqual([
      4048086883,
    ]));
  test('can upgrade capacity to 10', () =>
    expect(energyUpgrade(DestinyEnergyType.Arc, 1, DestinyEnergyType.Arc, 10)).toEqual([
      4048086883,
      4048086882,
      4048086885,
      4048086884,
      4048086887,
      4048086886,
      4048086889,
      4048086888,
      902052880,
    ]));

  test('can change energy', () =>
    expect(energyUpgrade(DestinyEnergyType.Arc, 1, DestinyEnergyType.Thermal, 1)).toEqual([
      3020065861,
    ]));

  test('can change energy and capacity', () =>
    expect(energyUpgrade(DestinyEnergyType.Arc, 1, DestinyEnergyType.Thermal, 4)).toEqual([
      838280182,
    ]));
});
