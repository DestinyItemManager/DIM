import { PressTip } from 'app/dim-ui/PressTip';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import FactionIcon from 'app/progress/FactionIcon';
import { ReputationRank } from 'app/progress/ReputationRank';
import { DestinyVendorProgressionType } from 'bungie-api-ts/destiny2';
import focusingItemOutputs from 'data/d2/focusing-item-outputs.json';
import BungieImage from '../dim-ui/BungieImage';
import VendorItemComponent from './VendorItemComponent';
import * as styles from './VendorItems.m.scss';
import { D2Vendor } from './d2-vendors';

// ignore what i think is the loot pool preview on some tower vendors?
const ignoreCategories = ['category_preview'];

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

  const itemsByCategory = Map.groupBy(vendor.items, (item) => item.displayCategoryIndex);
  itemsByCategory.delete(undefined);

  const faction = vendor.def.factionHash ? defs.Faction.get(vendor.def.factionHash) : undefined;
  const factionProgress = vendor?.component?.progression;

  return (
    <div className={styles.vendorContents}>
      {vendor.currencies.length > 0 && (
        <div className={styles.currencies}>
          {vendor.currencies.map((currency) => (
            <div key={currency.hash}>
              {(currencyLookups?.[currency.hash] || 0).toLocaleString()}{' '}
              <BungieImage
                height={16}
                width={16}
                className={styles.currencyIcon}
                src={currency.displayProperties.icon}
                title={currency.displayProperties.name}
              />
            </div>
          ))}
        </div>
      )}
      <div className={styles.itemCategories}>
        {faction && factionProgress && (
          <div>
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
        {[...itemsByCategory.entries()].map(
          ([categoryIndex, items]) =>
            categoryIndex !== undefined &&
            vendor.def.displayCategories[categoryIndex] &&
            !ignoreCategories.includes(vendor.def.displayCategories[categoryIndex].identifier) && (
              <div key={categoryIndex}>
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
                          key={vendorItem.vendorItemIndex}
                          item={vendorItem}
                          owned={Boolean(
                            ownedItemHashes?.has(vendorItem.item.hash) ||
                            vendorItem.owned ||
                            (vendorItem.item.hash in focusingItemOutputs &&
                              ownedItemHashes?.has(focusingItemOutputs[vendorItem.item.hash]!)),
                          )}
                          characterId={characterId}
                        />
                      ),
                  )}
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
