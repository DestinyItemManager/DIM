import { count } from '../util';
import * as _ from 'lodash';

export function dataStats(data) {
  const taggedItemsD1 = _.sumBy(
    Object.keys(data)
      .filter((k) => k.startsWith('dimItemInfo') && k.endsWith('-d1'))
      .map((k) => _.size(data[k])),
    (v) => v
  );
  const taggedItemsD2 = _.sumBy(
    Object.keys(data)
      .filter((k) => k.startsWith('dimItemInfo') && k.endsWith('-d2'))
      .map((k) => _.size(data[k])),
    (v) => v
  );

  const loadoutsD1 = count(
    data['loadouts-v3.0'] || [],
    (loadoutId: string) => data[loadoutId] && data[loadoutId].destinyVersion !== 2
  );
  const loadoutsD2 = count(
    data['loadouts-v3.0'] || [],
    (loadoutId: string) => data[loadoutId] && data[loadoutId].destinyVersion === 2
  );

  return {
    LoadoutsD1: loadoutsD1,
    LoadoutsD2: loadoutsD2,
    TagNotesD1: taggedItemsD1,
    TagNotesD2: taggedItemsD2,
    Settings: _.size(data['settings-v1.0']),
    IgnoredUsers: _.size(data.ignoredUsers)
  };
}
