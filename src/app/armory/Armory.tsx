import ItemGrid from 'app/armory/ItemGrid';
import { addCompareItem } from 'app/compare/actions';
import { stripAdept } from 'app/compare/compare-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage, { bungieNetPath } from 'app/dim-ui/BungieImage';
import { DestinyTooltipText } from 'app/dim-ui/DestinyTooltipText';
import ElementIcon from 'app/dim-ui/ElementIcon';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import ItemIcon, { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, createItemContextSelector } from 'app/inventory/selectors';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import {
  SocketOverrides,
  applySocketOverrides,
  useSocketOverrides,
} from 'app/inventory/store/override-sockets';
import { getEvent, getSeason } from 'app/inventory/store/season';
import { AmmoIcon } from 'app/item-popup/AmmoIcon';
import BreakerType from 'app/item-popup/BreakerType';
import EmblemPreview from 'app/item-popup/EmblemPreview';
import ItemSockets from 'app/item-popup/ItemSockets';
import ItemStats from 'app/item-popup/ItemStats';
import MetricCategories from 'app/item-popup/MetricCategories';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { useD2Definitions } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import { Reward } from 'app/progress/Reward';
import { AppIcon, compareIcon, thumbsUpIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { getItemYear, itemTypeName } from 'app/utils/item-utils';
import { wishListsByHashSelector } from 'app/wishlists/selectors';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info-v2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AllWishlistRolls from './AllWishlistRolls';
import styles from './Armory.m.scss';
import ArmorySheet from './ArmorySheet';
import Links from './Links';
import WishListEntry from './WishListEntry';

export default function Armory({
  itemHash,
  realItemSockets,
  realAvailablePlugHashes,
}: {
  itemHash: number;
  /** this is used to pass a real DimItem's current "plugged" plugs, into the fake DimItem that Armory creates */
  realItemSockets?: SocketOverrides;
  /**
   * non-plugged, but available, plugs, from the real item this was spawned from.
   * used to mark sockets as available
   */
  realAvailablePlugHashes?: number[];
}) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);
  const isPhonePortrait = useIsPhonePortrait();
  const [socketOverrides, onPlugClicked] = useSocketOverrides();
  const itemCreationContext = useSelector(createItemContextSelector);
  const [armoryItemHash, setArmoryItemHash] = useState<number | undefined>(undefined);
  const wishlistsByHash = useSelector(wishListsByHashSelector);
  const itemDef = defs.InventoryItem.get(itemHash);

  const itemWithoutSockets = makeFakeItem(itemCreationContext, itemHash, { allowWishList: true });

  if (!itemWithoutSockets) {
    return (
      <div>
        <h1>{t('Armory.Unknown')}</h1>
      </div>
    );
  }

  const item = applySocketOverrides(itemCreationContext, itemWithoutSockets, {
    // Start with the item's current sockets
    ...realItemSockets,
    // Then apply whatever the user chose in the Armory UI
    ...socketOverrides,
  });

  const storeItems = allItems.filter((i) => i.hash === itemHash);

  const collectible = item.collectibleHash ? defs.Collectible.get(item.collectibleHash) : undefined;

  // Use the ornament's screenshot if available
  const ornamentSocket = item.sockets?.allSockets.find((s) => s.plugged?.plugDef.screenshot);
  const screenshot = ornamentSocket?.plugged?.plugDef.screenshot || itemDef.screenshot;
  const flavorText = itemDef.flavorText || itemDef.displaySource;

  // TODO: Show Catalyst benefits for exotics
  const alternates = getAlternateItems(item, defs);

  return (
    <div
      className={clsx(styles.armory, 'armory')}
      style={
        screenshot && !isPhonePortrait
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.75) 0px, rgba(0,0,0,0) 200px), linear-gradient(180deg, rgba(0,0,0,0) 400px, #0b0c0f 500px), url("${bungieNetPath(
                screenshot,
              )}")`,
            }
          : undefined
      }
    >
      <Links item={item} />
      <div className={styles.header}>
        <div className="item">
          <ItemIcon item={item} />
        </div>
        <h1>{item.name}</h1>
        <div className={styles.headerContent}>
          <div className={styles.subtitle}>
            <ElementIcon element={item.element} className={styles.element} />
            <BreakerType item={item} />
            {item.destinyVersion === 2 && item.ammoType > 0 && <AmmoIcon type={item.ammoType} />}
            <div>{itemTypeName(item)}</div>
            {item.pursuit?.questLine && (
              <div>
                {t('MovePopup.Subtitle.QuestProgress', {
                  questStepNum: item.pursuit.questLine.questStepNum,
                  questStepsTotal: item.pursuit.questLine.questStepsTotal ?? '?',
                })}
              </div>
            )}
            <SeasonInfo defs={defs} item={item} />
          </div>
          <DestinyTooltipText item={item} />
          {item.classified && <div>{t('ItemService.Classified2')}</div>}
          {collectible?.sourceString && (
            <div className={styles.source}>{collectible?.sourceString}</div>
          )}
          {item.description && (
            <p>
              <RichDestinyText text={item.description} />
            </p>
          )}
          {flavorText && <p className={styles.flavor}>{flavorText}</p>}
        </div>
      </div>

      {isPhonePortrait && screenshot && (
        <div className="item-details">
          <BungieImage width="100%" src={screenshot} />
        </div>
      )}

      {defs.isDestiny2 && item.itemCategoryHashes.includes(ItemCategoryHashes.Emblems) && (
        <div className="item-details">
          <EmblemPreview item={item} />
        </div>
      )}

      {defs.isDestiny2 && item.availableMetricCategoryNodeHashes && (
        <div className="item-details">
          <MetricCategories
            availableMetricCategoryNodeHashes={item.availableMetricCategoryNodeHashes}
          />
        </div>
      )}

      {item.stats && !item.bucket.inArmor && (
        <div className={styles.section}>
          <ItemStats item={item} />
        </div>
      )}

      {item.sockets && (
        <div className={styles.section}>
          <ItemSockets item={item} grid onPlugClicked={onPlugClicked} />
        </div>
      )}
      {item.pursuit && (
        <>
          {defs && item.objectives && (
            <div className={styles.section}>
              {item.objectives.map((objective) => (
                <Objective objective={objective} key={objective.objectiveHash} />
              ))}
            </div>
          )}
          {defs.isDestiny2 && item.pursuit.rewards.length !== 0 && (
            <div className={styles.section}>
              <div>{t('MovePopup.Rewards')}</div>
              {item.pursuit.rewards.map((reward) => (
                <Reward key={reward.itemHash} reward={reward} />
              ))}
            </div>
          )}
          {item.pursuit?.questLine?.description && (
            <p>
              <RichDestinyText text={item.pursuit.questLine.description} ownerId={item.owner} />
            </p>
          )}
          {itemDef.setData?.itemList && (
            <ol>
              {itemDef.setData.itemList.map((h) => {
                const stepItem = makeFakeItem(itemCreationContext, h.itemHash);
                return (
                  stepItem && (
                    <li
                      key={h.itemHash}
                      style={{ fontWeight: h.itemHash === itemHash ? 'bold' : 'normal' }}
                    >
                      <RichDestinyText text={stepItem.description} />
                    </li>
                  )
                );
              })}
            </ol>
          )}
        </>
      )}

      {!isPhonePortrait && item.wishListEnabled && <WishListEntry item={item} />}

      {alternates.length > 0 && (
        <>
          <h2>{t('Armory.AlternateItems')}</h2>
          <div className={styles.list}>
            {alternates.map((alternate) => {
              const diffs = compareItemPerks(item.hash, alternate.hash, defs);
              return (
                <button
                  type="button"
                  key={alternate.hash}
                  className={styles.alternate}
                  onClick={() => setArmoryItemHash(alternate.hash)}
                >
                  <div className="item">
                    <DefItemIcon itemDef={alternate} />
                  </div>
                  <div>
                    <b>{alternate.displayProperties.name}</b>
                    <SeasonInfo defs={defs} item={alternate} />
                    {wishlistsByHash.has(alternate.hash) && (
                      <div>
                        <AppIcon icon={thumbsUpIcon} />{' '}
                        {`This version has loaded wishlist entries (${wishlistsByHash.has(item.hash) ? `current ^ Armory version also has some` : `current ^ Armory version has none`})`}
                      </div>
                    )}
                    {diffs?.map(([i1, i2]) => (
                      <React.Fragment key={`${i1.join()}${i2.join()}`}>
                        <div>
                          {i1.length > 0 &&
                            `<- Cannot roll ${i1.map((h) => defs.InventoryItem.get(h).displayProperties.name).join()} (current ^ Armory version can)`}
                          <br />
                          {i2.length > 0 &&
                            `<- Can roll ${i2.map((h) => defs.InventoryItem.get(h).displayProperties.name).join()} (current ^ Armory version cannot)`}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {storeItems.length > 0 && (
        <>
          <h2>
            {t('Armory.YourItems')}
            {storeItems[0].comparable && (
              <button
                className="dim-button"
                type="button"
                onClick={() => {
                  hideItemPopup();
                  dispatch(addCompareItem(storeItems[0]));
                }}
              >
                <AppIcon icon={compareIcon} /> {t('Compare.Button')}
              </button>
            )}
          </h2>
          <ItemGrid items={storeItems} noLink />
        </>
      )}
      {item.wishListEnabled && (
        <AllWishlistRolls item={item} realAvailablePlugHashes={realAvailablePlugHashes} />
      )}
      {armoryItemHash !== undefined && (
        <ArmorySheet itemHash={armoryItemHash} onClose={() => setArmoryItemHash(undefined)} />
      )}
    </div>
  );
}

/** Find the definitions for other versions of this item. */
function getAlternateItems(
  item: DimItem,
  defs: D2ManifestDefinitions,
): DestinyInventoryItemDefinition[] {
  const alternates: DestinyInventoryItemDefinition[] = [];
  const allDefs = defs.InventoryItem.getAll();

  for (const hash in allDefs) {
    const i = allDefs[hash];
    if (
      i.hash !== item.hash &&
      i.inventory?.bucketTypeHash === item.bucket.hash &&
      !i.itemCategoryHashes?.includes(ItemCategoryHashes.Dummies) &&
      stripAdept(i.displayProperties.name) === stripAdept(item.name)
    ) {
      alternates.push(i);
    }
  }

  alternates.sort(
    chainComparator(
      compareBy((i) => i.displayProperties.name),
      compareBy((i) => getSeason(i, defs) ?? 0),
    ),
  );

  return alternates;
}

const typeHashes = new Set([1215804696, 1215804697, 3993098925]);

function compareItemPerks(itemHash1: number, itemHash2: number, defs: D2ManifestDefinitions) {
  const socketInfo1 = defs.InventoryItem.get(itemHash1).sockets;
  const socketInfo2 = defs.InventoryItem.get(itemHash2).sockets;
  if (!socketInfo1 || !socketInfo2) {
    return;
  }

  const sockets1 = socketInfo1.socketEntries.filter((s) => typeHashes.has(s.socketTypeHash));
  const sockets2 = socketInfo2.socketEntries.filter((s) => typeHashes.has(s.socketTypeHash));

  if (sockets1.length !== sockets2.length) {
    return;
  }
  const diff: [number[], number[]][] = [];
  for (let i = 0; i < sockets1.length; i++) {
    const rph1 = sockets1[i].randomizedPlugSetHash || sockets1[i].reusablePlugSetHash;
    const rph2 = sockets2[i].randomizedPlugSetHash || sockets2[i].reusablePlugSetHash;
    const ps1 = new Set(
      (rph1 && defs.PlugSet.get(rph1).reusablePlugItems.map((pi) => pi.plugItemHash)) || [],
    );
    const ps2 = new Set(
      (rph2 && defs.PlugSet.get(rph2).reusablePlugItems.map((pi) => pi.plugItemHash)) || [],
    );
    for (const set of [ps1, ps2]) {
      for (const h of set) {
        if (ps1.has(h) && ps2.has(h)) {
          ps1.delete(h);
          ps2.delete(h);
        }
      }
    }
    if (ps1.size || ps2.size) {
      diff.push([[...ps1], [...ps2]]);
    }
  }
  return diff;
}

function SeasonInfo({
  defs,
  item,
  className,
}: {
  item: DestinyInventoryItemDefinition | DimItem;
  defs: D2ManifestDefinitions;
  className?: string;
}) {
  const seasonNum = getSeason(item);
  const season = seasonNum
    ? Object.values(defs.Season.getAll()).find((s) => s.seasonNumber === seasonNum)
    : undefined;
  const event = 'displayProperties' in item ? undefined : getEvent(item);
  return (
    season && (
      <div className={clsx(styles.season, className)}>
        {season.displayProperties.hasIcon && (
          <BungieImage height={15} width={15} src={season.displayProperties.icon} />
        )}{' '}
        {season.displayProperties.name} (
        {t('Armory.Season', {
          season: season.seasonNumber,
          year: getItemYear(item) ?? '?',
        })}
        ){Boolean(event) && ` - ${D2EventInfo[event!].name}`}
      </div>
    )
  );
}
