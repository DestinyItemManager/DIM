import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { VENDORS } from 'app/search/d2-known-values';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { uniqBy } from 'app/utils/util';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import rahoolMats from 'data/d2/spider-mats.json';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import BungieImage from '../dim-ui/BungieImage';
import { PressTip } from '../dim-ui/PressTip';
import FactionIcon from '../progress/FactionIcon';
import VendorItemComponent from './VendorItemComponent';
import styles from './VendorItems.m.scss';
import { D2Vendor } from './d2-vendors';
import { VendorItem } from './vendor-item';

function vendorItemIndex(item: VendorItem) {
  return item.key;
}

function itemSort(vendorHash: number, category: string) {
  if (category === 'category.rank_rewards_seasonal') {
    return chainComparator<VendorItem>(
      compareBy((item) => item.item?.tier),
      compareBy(vendorItemIndex)
    );
  } else if (category === 'category_bounties') {
    if (vendorHash === VENDORS.ADA_TRANSMOG) {
      return compareBy<VendorItem>((item) => item.item?.bungieIndex);
    } else {
      return chainComparator<VendorItem>(
        compareBy((item) => item.item?.typeName),
        compareBy(vendorItemIndex)
      );
    }
  } else if (category === 'category_weapon') {
    return chainComparator<VendorItem>(compareBy((item) => item.item?.itemCategoryHashes[0]));
  } else if (category.startsWith('category_tier')) {
    return undefined;
  } else if (vendorHash === VENDORS.WAR_TABLE_UPGRADES_RISEN) {
    // Purchasing an upgrade from the vendor swaps it out with a different item
    // 10 positions later in the array.
    return compareBy<VendorItem>((item) => item.key - (item.owned ? 10 : 0));
  } else if (vendorHash === VENDORS.STAR_CHART_UPGRADES_PLUNDER) {
    // Basically the same thing
    return compareBy<VendorItem>((item) => item.key - (item.owned ? 21 : 0));
  } else {
    return chainComparator<VendorItem>(compareBy(vendorItemIndex));
  }
}

// ignore what i think is the loot pool preview on some tower vendors?
// ignore the "reset artifact" button on artifact "vendor"
const ignoreCategories = ['category_preview', 'category_reset'];

/**
 * Display the items for a single vendor, organized by category.
 */
export default function VendorItems({
  vendor,
  ownedItemHashes,
  currencyLookups,
  filtering,
  characterId,
}: {
  vendor: D2Vendor;
  ownedItemHashes?: Set<number>;
  currencyLookups?: {
    [itemHash: number]: number;
  };
  filtering?: boolean;
  characterId: string;
}) {
  const defs = useD2Definitions()!;

  if (!vendor.items.length) {
    return <div className={styles.vendorContents}>{t('Vendors.NoItems')}</div>;
  }

  // remove deprecated mods from seasonal artifact
  if (vendor.def.hash === VENDORS.ARTIFACT) {
    vendor.items = vendor.items.filter(
      (i) => i.item?.hash && !deprecatedMods.includes(i.item.hash)
    );
  }

  const itemsByCategory = _.groupBy(vendor.items, (item) => item?.displayCategoryIndex);

  const faction = vendor.def.factionHash ? defs.Faction[vendor.def.factionHash] : undefined;
  const rewardVendorHash = faction?.rewardVendorHash || undefined;
  const rewardItem =
    rewardVendorHash !== undefined ? defs.InventoryItem.get(faction!.rewardItemHash) : undefined;
  const factionProgress = vendor?.component?.progression;

  let currencies = vendor.currencies;

  // add in faction tokens if this vendor has them
  if (!filtering && faction?.tokenValues) {
    currencies = uniqBy(
      [
        ...Object.keys(faction.tokenValues)
          .map((h) => defs.InventoryItem.get(parseInt(h, 10)))
          .filter(Boolean),
        ...currencies,
      ],
      (i) => i.hash
    );
  }

  // add all traded planetmats if this vendor is the spider
  if (vendor?.component?.vendorHash === VENDORS.RAHOOL) {
    currencies = uniqBy(
      [...rahoolMats.map((h) => defs.InventoryItem.get(h)), ...currencies],
      (i) => i.hash
    );
  }

  return (
    <div className={styles.vendorContents}>
      {currencies.length > 0 && (
        <div className={styles.currencies}>
          {currencies.map((currency) => (
            <div className={styles.currency} key={currency.hash}>
              {(currencyLookups?.[currency.hash] || 0).toLocaleString()}{' '}
              <BungieImage
                src={currency.displayProperties.icon}
                title={currency.displayProperties.name}
              />
            </div>
          ))}
        </div>
      )}
      <div className={styles.itemCategories}>
        {((Boolean(rewardVendorHash) && rewardItem) || (factionProgress && faction)) && (
          <div className={styles.vendorRow}>
            <h3 className={styles.categoryTitle}>{t('Vendors.Engram')}</h3>
            <div className={styles.vendorItems}>
              {factionProgress && faction && (
                <PressTip
                  minimal
                  tooltip={`${factionProgress.progressToNextLevel}/${factionProgress.nextLevelAt}`}
                >
                  <div>
                    <FactionIcon
                      factionProgress={factionProgress}
                      factionDef={faction}
                      vendor={vendor.component}
                    />
                  </div>
                </PressTip>
              )}
              {Boolean(rewardVendorHash) && rewardItem && (
                <Link to={`../vendors/${rewardVendorHash}?characterId=${characterId}`}>
                  <div className="item" title={rewardItem.displayProperties.name}>
                    <BungieImage
                      className="item-img transparent"
                      src={rewardItem.displayProperties.icon}
                    />
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
        {Object.entries(itemsByCategory).map(([categoryIndexStr, items]) => {
          const categoryIndex = parseInt(categoryIndexStr, 10);
          return (
            vendor.def.displayCategories[categoryIndex] &&
            !ignoreCategories.includes(vendor.def.displayCategories[categoryIndex].identifier) && (
              <div className={styles.vendorRow} key={categoryIndex}>
                <h3 className={styles.categoryTitle}>
                  <RichDestinyText
                    text={
                      vendor.def.displayCategories[categoryIndex]?.displayProperties.name ||
                      'Unknown'
                    }
                    ownerId={characterId}
                  />
                </h3>
                <div className={styles.vendorItems}>
                  {items
                    .sort(
                      itemSort(
                        vendor.def.hash,
                        vendor.def.displayCategories[categoryIndex]?.identifier
                      )
                    )
                    .map(
                      (vendorItem) =>
                        vendorItem.item && (
                          <VendorItemComponent
                            key={vendorItem.key}
                            item={vendorItem}
                            owned={Boolean(
                              ownedItemHashes?.has(vendorItem.item.hash) || vendorItem.owned
                            )}
                            characterId={characterId}
                          />
                        )
                    )}
                </div>
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
