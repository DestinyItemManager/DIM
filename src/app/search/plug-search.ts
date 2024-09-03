import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimLanguage } from 'app/i18n';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { startWordRegexp } from './text-utils';

export function createPlugSearchPredicate(
  query: string,
  language: DimLanguage,
  defs: D2ManifestDefinitions,
) {
  if (!query.length) {
    return (_plug: PluggableInventoryItemDefinition) => true;
  }

  const regexp = startWordRegexp(query, language);
  return (plug: PluggableInventoryItemDefinition) =>
    regexp.test(plug.displayProperties.name) ||
    regexp.test(plug.displayProperties.description) ||
    regexp.test(plug.itemTypeDisplayName) ||
    plug.perks.some((perk) => {
      const perkDef = defs.SandboxPerk.get(perk.perkHash);
      return (
        perkDef &&
        (regexp.test(perkDef.displayProperties.name) ||
          regexp.test(perkDef.displayProperties.description) ||
          regexp.test(perk.requirementDisplayString))
      );
    });
}
