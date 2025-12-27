import ItemGrid from 'app/armory/ItemGrid';
import { addCompareItem } from 'app/compare/actions';
import { stripAdept } from 'app/compare/compare-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
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
import { AppIcon, compareIcon, faMinusSquare, faPlusSquare, thumbsUpIcon } from 'app/shell/icons';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { localizedListFormatter } from 'app/utils/intl';
import { getItemYear, itemTypeName } from 'app/utils/item-utils';
import { wishListsByHashSelector } from 'app/wishlists/selectors';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info-v2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AllWishlistRolls from './AllWishlistRolls';
import * as styles from './Armory.m.scss';
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

  const seasonNum = getSeason(item);

  return (
    <div
      className={clsx(styles.armory, 'armory')}
      style={
        screenshot && !isPhonePortrait
          ? {
              backgroundImage: `linear-gradient(180deg, rgb(0,0,0,.75) 0px, rgb(0,0,0,0) 200px), linear-gradient(180deg, rgb(0,0,0,0) 400px, #0b0c0f 500px), url("${bungieNetPath(
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
            {seasonNum >= 0 && <SeasonInfo defs={defs} item={item} seasonNum={seasonNum} />}
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
              <RichDestinyText
                text={item.pursuit.questLine.description}
                ownerId={item.vendor?.characterId ?? item.owner}
              />
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
              const altSeasonNum = getSeason(alternate);
              return (
                <div key={alternate.hash} className={styles.alternate}>
                  <button
                    type="button"
                    onClick={() => setArmoryItemHash(alternate.hash)}
                    className={styles.alternateButton}
                  >
                    <DefItemIcon itemDef={alternate} />
                  </button>
                  <div>
                    <b>{alternate.displayProperties.name}</b>
                    {altSeasonNum >= 0 && (
                      <SeasonInfo defs={defs} item={alternate} seasonNum={altSeasonNum} />
                    )}
                    {wishlistsByHash.has(alternate.hash) && (
                      <div className={styles.alternateWishlist}>
                        <AppIcon icon={thumbsUpIcon} />{' '}
                        {t('Armory.WishlistedRolls', {
                          count: wishlistsByHash.get(alternate.hash)?.length ?? 0,
                        })}
                      </div>
                    )}
                    {altSeasonNum === seasonNum ? (
                      <AlternatePerkDiffs itemDef={itemDef} alternate={alternate} defs={defs} />
                    ) : (
                      <div>{t('Armory.DifferentSeason')}</div>
                    )}
                  </div>
                </div>
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
      reverseComparator(compareBy((i) => getSeason(i, defs) ?? 0)),
      compareBy((i) => i.displayProperties.name),
    ),
  );

  return alternates;
}

const typeHashes = new Set([1215804696, 1215804697, 3993098925]);

function AlternatePerkDiffs({
  itemDef,
  alternate,
  defs,
}: {
  itemDef: DestinyInventoryItemDefinition;
  alternate: DestinyInventoryItemDefinition;
  defs: D2ManifestDefinitions;
}) {
  const diffs = compareItemPerks(itemDef, alternate, defs);
  const language = useSelector(languageSelector);
  const listFormat = localizedListFormatter(language);
  return (
    <>
      {diffs.map(([i1, i2]) => {
        const removals = i1
          .map((h) => defs.InventoryItem.get(h).displayProperties.name)
          .filter(Boolean);
        const additions = i2
          .map((h) => defs.InventoryItem.get(h).displayProperties.name)
          .filter(Boolean);
        return (
          (additions.length > 0 || removals.length > 0) && (
            <React.Fragment key={`diff-${additions.join()}-${removals.join()}`}>
              {removals.length > 0 && (
                <div key={`rem-${removals.join()}`}>
                  <AppIcon icon={faMinusSquare} /> {listFormat.format(removals)}
                </div>
              )}
              {additions.length > 0 && (
                <div key={`add-${additions.join()}`}>
                  <AppIcon icon={faPlusSquare} /> {listFormat.format(additions)}
                </div>
              )}
            </React.Fragment>
          )
        );
      })}
    </>
  );
}

/**
 * Compare the perks of two item definitions. Returns a tuple for each socket
 * with a list of perks exclusive to the first item, and exclusive to the second
 * item.
 */
function compareItemPerks(
  itemDef1: DestinyInventoryItemDefinition,
  itemDef2: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions,
): [firstItemExclusivePerkHashes: number[], secondItemExclusivePerkHashes: number[]][] {
  if (!itemDef1.sockets || !itemDef2.sockets) {
    return emptyArray();
  }

  const sockets1 = itemDef1.sockets.socketEntries.filter((s) => typeHashes.has(s.socketTypeHash));
  const sockets2 = itemDef2.sockets.socketEntries.filter((s) => typeHashes.has(s.socketTypeHash));

  const diff: [number[], number[]][] = [];
  for (let i = 0; i < Math.max(sockets1.length, sockets2.length); i++) {
    const rph1 =
      i < sockets1.length
        ? sockets1[i].randomizedPlugSetHash || sockets1[i].reusablePlugSetHash
        : undefined;
    const rph2 =
      i < sockets2.length
        ? sockets2[i].randomizedPlugSetHash || sockets2[i].reusablePlugSetHash
        : undefined;
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
  seasonNum,
}: {
  item: DestinyInventoryItemDefinition | DimItem;
  defs: D2ManifestDefinitions;
  className?: string;
  seasonNum: number;
}) {
  const season = Object.values(defs.Season.getAll()).find((s) => s.seasonNumber === seasonNum);
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
