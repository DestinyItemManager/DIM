import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { isEnhancedPerk } from 'app/utils/socket-utils';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { PressTip } from '../dim-ui/PressTip';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import { InventoryWishListRoll, isWishListPlug } from '../wishlists/wishlists';
import './ItemSockets.scss';
import styles from './Plug.m.scss';
import { DimPlugTooltip } from './PlugTooltip';

export default function Plug({
  plug,
  item,
  socketInfo,
  wishlistRoll,
  hasMenu,
  onClick,
  plugged,
  selected,
  cannotRoll,
  unreliablePerkOption,
  notSelected,
}: {
  plug: DimPlug;
  item: DimItem;
  socketInfo: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  hasMenu: boolean;
  onClick?: (plug: DimPlug) => void;
} & PlugStatuses) {
  const defs = useD2Definitions()!;

  // TODO: Do this with SVG to make it scale better!
  const modDef = defs.InventoryItem.get(plug.plugDef.hash);
  if (!modDef || !isPluggableItem(modDef)) {
    return null;
  }

  const itemCategories = plug?.plugDef.itemCategoryHashes || [];

  const doClick = onClick && (() => onClick(plug));

  const contents = <DefItemIcon itemDef={plug.plugDef} borderless={true} />;

  const tooltip = () => <DimPlugTooltip item={item} plug={plug} wishlistRoll={wishlistRoll} />;

  const selectable = socketInfo.plugOptions.length > 1;

  return (
    <div
      key={plug.plugDef.hash}
      className={clsx('socket-container', {
        disabled: !plug.enabled,
        selectable,
        notIntrinsic: !itemCategories.includes(ItemCategoryHashes.WeaponModsIntrinsic),
      })}
      onClick={hasMenu || selectable ? doClick : undefined}
    >
      {socketInfo.isReusable ? (
        <PerkCircleWithTooltip
          item={item}
          plug={plug}
          wishlistRoll={wishlistRoll}
          socketInfo={socketInfo}
          plugged={plugged}
          selected={selected}
          cannotRoll={cannotRoll}
          unreliablePerkOption={unreliablePerkOption}
          notSelected={notSelected}
        />
      ) : (
        <>
          <PressTip tooltip={tooltip}>{contents}</PressTip>
          {/* is this ↓ reachable?? wishlists mainly apply to isReusable type sockets.
              they can detect masterworks, but no thumbs up appears on that socket */}
          {wishlistRoll?.wishListPerks.has(plug.plugDef.hash) && (
            <AppIcon
              className="thumbs-up"
              icon={thumbsUpIcon}
              title={t('WishListRoll.BestRatedTip')}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * a perk circle and its associated thumbs up or lack thereof.
 * if a wishlistRoll is included, this must be inside an element
 * with a css position, so thumbs up can position itself.
 *
 * if plug status overrides aren't provided,
 * this determines them using socketInfo
 */
export function PerkCircleWithTooltip({
  item,
  plug,
  socketInfo,
  wishlistRoll,
  plugged,
  selected,
  cannotRoll,
  unreliablePerkOption,
  notSelected,
}: {
  item: DimItem;
  plug: DimPlug;
  socketInfo: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
} & PlugStatuses) {
  plugged ??= plug === socketInfo.plugged;
  // Another plug was selected by the user
  notSelected ??= socketInfo.actuallyPlugged && !plugged && plug === socketInfo.actuallyPlugged;
  // This has been selected by the user but isn't the original plugged item
  selected ??= socketInfo.actuallyPlugged && plugged;
  cannotRoll ??= plug.cannotCurrentlyRoll;
  unreliablePerkOption ??= plug.unreliablePerkOption;

  const tooltip = () => (
    <DimPlugTooltip
      item={item}
      plug={plug}
      wishlistRoll={wishlistRoll}
      craftingData={socketInfo.craftingData?.[plug.plugDef.hash]}
    />
  );

  const isRecommendedPerk = isWishListPlug(plug, wishlistRoll);

  return (
    <>
      <PressTip tooltip={tooltip}>
        <PerkCircle
          plug={plug}
          plugged={plugged}
          notSelected={notSelected}
          selected={selected}
          cannotRoll={cannotRoll}
          unreliablePerkOption={unreliablePerkOption}
        />
      </PressTip>
      {isRecommendedPerk && (
        <AppIcon className="thumbs-up" icon={thumbsUpIcon} title={t('WishListRoll.BestRatedTip')} />
      )}
    </>
  );
}

interface PlugStatuses {
  plugged?: boolean;
  selected?: boolean;
  cannotRoll?: boolean;
  notSelected?: boolean;
  unreliablePerkOption?: boolean;
}

/**
 * an encircled perk image.
 * this has a global classname .perk-circle available so parents can define how big sockets should be
 *
 */
function PerkCircle({
  plug,
  className,
  plugged,
  selected,
  cannotRoll,
  notSelected,
  unreliablePerkOption,
}: {
  plug: DimPlug;
  className?: string;
} & PlugStatuses) {
  const enhanced = isEnhancedPerk(plug.plugDef);
  const statusClasses =
    clsx({
      [styles.plugged]: plugged,
      [styles.selected]: selected,
      [styles.cannotRoll]: cannotRoll || unreliablePerkOption,
      [styles.notSelected]: notSelected,
    }) || styles.none;
  return (
    <svg viewBox="0 0 100 100" width="100" height="100" className={clsx(className, 'perk-circle')}>
      <defs>
        <linearGradient id="mw" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#eade8b" offset="50%" stopOpacity="0" />
          <stop stopColor="#eade8b" offset="100%" stopOpacity="1" />
        </linearGradient>
      </defs>
      <mask id="mask">
        <rect x="0" y="0" width="100" height="100" fill="black" />
        <circle cx="50" cy="50" r="46" fill="white" />
      </mask>
      <circle cx="50" cy="50" r="48" className={statusClasses} />

      {enhanced && (
        <>
          <rect x="0" y="0" width="100" height="100" fill="url(#mw)" mask="url(#mask)" />
          <rect x="5" y="0" width="6" height="100" fill="#eade8b" mask="url(#mask)" />
        </>
      )}

      <image
        href={bungieNetPath(plug.plugDef.displayProperties.icon)}
        x="10"
        y="10"
        width="80"
        height="80"
        mask="url(#mask)"
      />

      <circle cx="50" cy="50" r="46" stroke="white" fill="transparent" strokeWidth="2" />
      {enhanced && <path d="M5,50 l0,-24 l-6,0 l9,-16 l9,16 l-6,0 l0,24 z" fill="#eade8b" />}
    </svg>
  );
}
