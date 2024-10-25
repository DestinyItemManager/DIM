import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { keyBy } from 'es-toolkit';
import memoizeOne from 'memoize-one';

export const getDamageDefsByDamageType = memoizeOne((defs: D2ManifestDefinitions) =>
  keyBy(Object.values(defs.DamageType.getAll()), (d) => d.enumValue),
);
