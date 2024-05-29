import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import _ from 'lodash';
import memoizeOne from 'memoize-one';

export const getDamageDefsByDamageType = memoizeOne((defs: D2ManifestDefinitions) =>
  _.keyBy(Object.values(defs.DamageType.getAll()), (d) => d.enumValue),
);
