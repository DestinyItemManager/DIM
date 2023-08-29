import { PressTip } from 'app/dim-ui/PressTip';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import FactionIcon from 'app/progress/FactionIcon';
import { ReputationRank } from 'app/progress/ReputationRank';
import { VENDORS } from 'app/search/d2-known-values';
import { uniqBy } from 'app/utils/util';
import { DestinyVendorProgressionType } from 'bungie-api-ts/destiny2';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import focusingItemOutputs from 'data/d2/focusing-item-outputs.json';
import rahoolMats from 'data/d2/spider-mats.json';
import _ from 'lodash';
import BungieImage from '../dim-ui/BungieImage';
import VendorItemComponent from './VendorItemComponent';
import styles from './VendorItems.m.scss';
import { D2Vendor } from './d2-vendors';

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
  characterId,
}: {
  vendor: D2Vendor;
  ownedItemHashes?: Set<number>;
  currencyLookups?: {
    [itemHash: number]: number;
  };
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
  const factionProgress = vendor?.component?.progression;

  let currencies = vendor.currencies;

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
                height={16}
                width={16}
                src={currency.displayProperties.icon}
                title={currency.displayProperties.name}
              />
            </div>
          ))}
        </div>
      )}
      <div className={styles.itemCategories}>
        {faction && factionProgress && (
          <div className={styles.vendorRow}>
            <h3 className={styles.categoryTitle}>{t('Vendors.Engram')}</h3>
            <div className={styles.vendorItems}>
              {factionProgress &&
                (vendor.def.vendorProgressionType !== DestinyVendorProgressionType.Default ? (
                  <ReputationRank progress={factionProgress} />
                ) : (
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
                ))}
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
                  {items.map(
                    (vendorItem) =>
                      vendorItem.item && (
                        <VendorItemComponent
                          key={vendorItem.key}
                          item={vendorItem}
                          owned={Boolean(
                            ownedItemHashes?.has(vendorItem.item.hash) ||
                              vendorItem.owned ||
                              (vendorItem.item.hash in focusingItemOutputs &&
                                ownedItemHashes?.has(focusingItemOutputs[vendorItem.item.hash]!))
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
