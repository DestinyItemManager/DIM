import _ from 'underscore';

/**
 * Filters a list of categories down to only categories that match a certain property.
 */
function vendorTab(categories, prop) {
  if (!prop || !prop.length) {
    return categories;
  }
  return _.filter(categories, prop);
}

/**
 * Filters a list of items down to items that match one of a set of named filters.
 */
function vendorTabItems(items, prop) {
  if (!prop || !prop.length) {
    return items;
  }
  return _.filter(items, {
    hasArmorWeaps: (saleItem) => (saleItem.item.bucket.sort === 'Weapons' || saleItem.item.bucket.sort === 'Armor' || saleItem.item.type === 'Artifact' || saleItem.item.type === 'Ghost'),
    hasVehicles: (saleItem) => (saleItem.item.type === 'Ship' || saleItem.item.type === 'Vehicle'),
    hasShadersEmbs: (saleItem) => (saleItem.item.type === "Emblem" || saleItem.item.type === "Shader"),
    hasEmotes: (saleItem) => (saleItem.item.type === "Emote"),
    hasConsumables: (saleItem) => (saleItem.item.type === "Material" || saleItem.item.type === "Consumable"),
    hasBounties: (saleItem) => (saleItem.item.type === 'Bounties')
  }[prop]);
}

export {
  vendorTab,
  vendorTabItems
};
