import { DestinyTooltipText } from 'app/dim-ui/DestinyTooltipText';
import { KillTrackerInfo } from 'app/dim-ui/KillTracker';
import { WeaponCatalystInfo } from 'app/dim-ui/WeaponCatalystInfo';
import { WeaponCraftedInfo } from 'app/dim-ui/WeaponCraftedInfo';
import { WeaponDeepsightInfo } from 'app/dim-ui/WeaponDeepsightInfo';
import { t } from 'app/i18next-t';
import { createItemContextSelector, storesSelector } from 'app/inventory/selectors';
import { isTrialsPassage } from 'app/inventory/store/objectives';
import { applySocketOverrides, useSocketOverrides } from 'app/inventory/store/override-sockets';
import { getStore } from 'app/inventory/stores-helpers';
import { useDefinitions } from 'app/manifest/selectors';
import { ActivityModifier } from 'app/progress/ActivityModifier';
import Objective from 'app/progress/Objective';
import { Reward } from 'app/progress/Reward';
import { RootState } from 'app/store/types';
import { getItemKillTrackerInfo, isD1Item } from 'app/utils/item-utils';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import helmetIcon from 'destiny-icons/armor_types/helmet.svg';
import modificationIcon from 'destiny-icons/general/modifications.svg';
import handCannonIcon from 'destiny-icons/weapons/hand_cannon.svg';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import BungieImage from '../dim-ui/BungieImage';
import { DimItem } from '../inventory/item-types';
import { AppIcon, faCheck } from '../shell/icons';
import ApplyPerkSelection from './ApplyPerkSelection';
import EmblemPreview from './EmblemPreview';
import EnergyMeter from './EnergyMeter';
import { ItemPopupExtraInfo } from './item-popup';
import ItemDescription from './ItemDescription';
import ItemExpiration from './ItemExpiration';
import ItemPerks from './ItemPerks';
import ItemSockets from './ItemSockets';
import ItemStats from './ItemStats';
import ItemTalentGrid from './ItemTalentGrid';
import MetricCategories from './MetricCategories';

// TODO: probably need to load manifest. We can take a lot of properties off the item if we just load the definition here.
export default function ItemDetails({
  item: originalItem,
  extraInfo = {},
}: {
  item: DimItem;
  extraInfo?: ItemPopupExtraInfo;
}) {
  const defs = useDefinitions()!;
  const createItemContext = useSelector(createItemContextSelector);
  const [socketOverrides, onPlugClicked, resetSocketOverrides] = useSocketOverrides();
  const item = defs.isDestiny2()
    ? applySocketOverrides(createItemContext, originalItem, socketOverrides)
    : originalItem;
  const modTypeIcon = item.itemCategoryHashes.includes(ItemCategoryHashes.ArmorMods)
    ? helmetIcon
    : handCannonIcon;

  const ownerStore = useSelector((state: RootState) => getStore(storesSelector(state), item.owner));

  const killTrackerInfo = getItemKillTrackerInfo(item);

  return (
    <div className="item-details-body">
      {item.itemCategoryHashes.includes(ItemCategoryHashes.Shaders) && (
        <BungieImage className="item-shader" src={item.icon} width="96" height="96" />
      )}

      {(item.type === 'Milestone' ||
        item.itemCategoryHashes.includes(ItemCategoryHashes.Mods_Ornament)) &&
        item.secondaryIcon && <BungieImage src={item.secondaryIcon} width="100%" />}

      <ItemDescription item={item} />

      {!item.stats && Boolean(item.collectibleHash) && defs.isDestiny2() && (
        <div className="item-details item-source">
          {defs.Collectible.get(item.collectibleHash!).sourceString}
        </div>
      )}

      {defs.isDestiny2() && item.itemCategoryHashes.includes(ItemCategoryHashes.Emblems) && (
        <div className="item-details">
          <EmblemPreview item={item} />
        </div>
      )}

      {defs.isDestiny2() && item.availableMetricCategoryNodeHashes && (
        <div className="item-details">
          <MetricCategories
            availableMetricCategoryNodeHashes={item.availableMetricCategoryNodeHashes}
          />
        </div>
      )}

      {item.crafted && item.craftedInfo && defs.isDestiny2() && (
        <WeaponCraftedInfo craftInfo={item.craftedInfo} className="crafted-progress" />
      )}

      {defs.isDestiny2() && <WeaponDeepsightInfo item={item} />}

      {defs.isDestiny2() && <WeaponCatalystInfo item={item} />}

      {killTrackerInfo && defs.isDestiny2() && (
        <KillTrackerInfo tracker={killTrackerInfo} showTextLabel className="masterwork-progress" />
      )}

      {item.classified && <div className="item-details">{t('ItemService.Classified2')}</div>}

      {item.stats && (
        <div className="item-details">
          <ItemStats item={item} />
        </div>
      )}

      {isD1Item(item) && item.talentGrid && (
        <div className="item-details item-perks">
          <ItemTalentGrid item={item} />
        </div>
      )}

      {item.missingSockets && (
        <div className="item-details warning">{t('MovePopup.MissingSockets')}</div>
      )}

      {defs.isDestiny2() && item.energy && defs && <EnergyMeter item={item} />}
      {item.sockets && <ItemSockets item={item} onPlugClicked={onPlugClicked} />}

      <ApplyPerkSelection
        item={item}
        setSocketOverride={onPlugClicked}
        onApplied={resetSocketOverrides}
      />

      {item.perks && <ItemPerks item={item} />}

      {defs && item.objectives && (
        <div className="item-details">
          {item.objectives.map((objective) => (
            <Objective
              objective={objective}
              key={objective.objectiveHash}
              isTrialsPassage={defs.isDestiny2() && isTrialsPassage(item.hash)}
            />
          ))}
        </div>
      )}

      {item.previewVendor !== undefined && item.previewVendor !== 0 && (
        <div className="item-description">
          <Link
            to={`vendors/${item.previewVendor}${
              ownerStore && !ownerStore.isVault ? `?characterId=${ownerStore.id}` : ''
            }`}
          >
            {t('ItemService.PreviewVendor', { type: item.typeName })}
          </Link>
        </div>
      )}

      {defs.isDestiny2() && item.pursuit && item.pursuit.rewards.length !== 0 && (
        <div className="item-details">
          <div>{t('MovePopup.Rewards')}</div>
          {item.pursuit.rewards.map((reward) => (
            <Reward key={reward.itemHash} reward={reward} store={ownerStore} itemHash={item.hash} />
          ))}
        </div>
      )}

      {defs.isDestiny2() && item.pursuit && item.pursuit.modifierHashes.length !== 0 && (
        <div className="item-details">
          {item.pursuit.modifierHashes.map((modifierHash) => (
            <ActivityModifier key={modifierHash} modifierHash={modifierHash} />
          ))}
        </div>
      )}

      {extraInfo.mod ? (
        <div className="item-details mods">
          {extraInfo.owned && (
            <div>
              <img className="owned-icon" src={modificationIcon} /> {t('MovePopup.OwnedMod')}
            </div>
          )}
          {extraInfo.acquired && (
            <div>
              <img className="acquired-icon" src={modTypeIcon} /> {t('MovePopup.AcquiredMod')}
            </div>
          )}
        </div>
      ) : (
        (extraInfo.owned || extraInfo.acquired) && (
          <div className="item-details">
            {extraInfo.owned && (
              <div>
                <AppIcon className="owned-icon" icon={faCheck} /> {t('MovePopup.Owned')}
              </div>
            )}
            {extraInfo.acquired && (
              <div>
                <AppIcon className="acquired-icon" icon={faCheck} /> {t('MovePopup.Acquired')}
              </div>
            )}
          </div>
        )
      )}

      <ItemExpiration item={item} />
      <DestinyTooltipText item={item} />
    </div>
  );
}
