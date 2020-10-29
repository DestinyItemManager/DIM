import { destinyVersionSelector } from 'app/accounts/selectors';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { KillTrackerInfo } from 'app/dim-ui/KillTracker';
import { t } from 'app/i18next-t';
import { ActivityModifier } from 'app/progress/ActivityModifier';
import Objective from 'app/progress/Objective';
import { Reward } from 'app/progress/Reward';
import { RootState } from 'app/store/types';
import { getItemKillTrackerInfo } from 'app/utils/item-utils';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import helmetIcon from 'destiny-icons/armor_types/helmet.svg';
import modificationIcon from 'destiny-icons/general/modifications.svg';
import handCannonIcon from 'destiny-icons/weapons/hand_cannon.svg';
import React from 'react';
import { connect } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import BungieImage from '../dim-ui/BungieImage';
import { DimItem } from '../inventory/item-types';
import { AppIcon, faCheck } from '../shell/icons';
import EmblemPreview from './EmblemPreview';
import EnergyMeter from './EnergyMeter';
import { ItemPopupExtraInfo } from './item-popup';
import ItemDescription from './ItemDescription';
import ItemExpiration from './ItemExpiration';
import ItemSockets from './ItemSockets';
import ItemStats from './ItemStats';
import ItemTalentGrid from './ItemTalentGrid';
import MetricCategories from './MetricCategories';

interface ProvidedProps {
  item: DimItem;
  extraInfo?: ItemPopupExtraInfo;
}

interface StoreProps {
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    defs:
      destinyVersionSelector(state) === 2 ? state.manifest.d2Manifest! : state.manifest.d1Manifest!,
  };
}

function isD2Manifest(
  defs: D2ManifestDefinitions | D1ManifestDefinitions
): defs is D2ManifestDefinitions {
  return defs.isDestiny2();
}

// TODO: probably need to load manifest. We can take a lot of properties off the item if we just load the definition here.
function ItemDetails({ item, extraInfo = {}, defs }: Props) {
  const modTypeIcon = item.itemCategoryHashes.includes(ItemCategoryHashes.ArmorMods)
    ? helmetIcon
    : handCannonIcon;

  const urlParams = useParams<{ membershipId?: string; destinyVersion?: string }>();

  const killTrackerInfo = getItemKillTrackerInfo(item);
  return (
    <div className="item-details-body">
      {item.itemCategoryHashes.includes(ItemCategoryHashes.Shaders) && (
        <BungieImage className="item-shader" src={item.icon} width="96" height="96" />
      )}

      <ItemDescription item={item} />

      <ItemExpiration item={item} />

      {!item.stats && Boolean(item.collectibleHash) && isD2Manifest(defs) && (
        <div className="item-details">
          {defs.Collectible.get(item.collectibleHash!).sourceString}
        </div>
      )}

      {isD2Manifest(defs) && item.itemCategoryHashes.includes(ItemCategoryHashes.Emblems) && (
        <div className="item-details">
          <EmblemPreview item={item} defs={defs} />
        </div>
      )}

      {isD2Manifest(defs) && item.availableMetricCategoryNodeHashes && (
        <div className="item-details">
          <MetricCategories
            availableMetricCategoryNodeHashes={item.availableMetricCategoryNodeHashes}
            defs={defs}
          />
        </div>
      )}

      {killTrackerInfo && isD2Manifest(defs) && (
        <KillTrackerInfo
          tracker={killTrackerInfo}
          defs={defs}
          textLabel={true}
          className="masterwork-progress"
        />
      )}

      {item.classified && <div className="item-details">{t('ItemService.Classified2')}</div>}

      <ItemStats item={item} />

      {item.talentGrid && (
        <div className="item-details item-perks">
          <ItemTalentGrid item={item} />
        </div>
      )}

      {item.missingSockets && (
        <div className="item-details warning">{t('MovePopup.MissingSockets')}</div>
      )}

      {isD2Manifest(defs) && item.energy && defs && <EnergyMeter item={item} defs={defs} />}
      {item.sockets && <ItemSockets item={item} />}

      {item.perks && (
        <div className="item-details item-perks">
          {item.perks.map((perk) => (
            <div className="item-perk" key={perk.hash}>
              {perk.displayProperties.hasIcon && <BungieImage src={perk.displayProperties.icon} />}
              <div className="item-perk-info">
                <div className="item-perk-name">{perk.displayProperties.name}</div>
                <div className="item-perk-description">{perk.displayProperties.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {defs && item.objectives && (
        <div className="item-details">
          {item.objectives.map((objective) => (
            <Objective defs={defs} objective={objective} key={objective.objectiveHash} />
          ))}
        </div>
      )}

      {item.previewVendor !== undefined && item.previewVendor !== 0 && (
        <div className="item-description">
          <Link
            to={`/${urlParams.membershipId}/d${urlParams.destinyVersion}/vendors/${item.previewVendor}`}
          >
            {t('ItemService.PreviewVendor', { type: item.typeName })}
          </Link>
        </div>
      )}

      {isD2Manifest(defs) && item.pursuit && item.pursuit.rewards.length !== 0 && (
        <div className="item-details">
          <div>{t('MovePopup.Rewards')}</div>
          {item.pursuit.rewards.map((reward) => (
            <Reward key={reward.itemHash} reward={reward} defs={defs} />
          ))}
        </div>
      )}

      {isD2Manifest(defs) && item.pursuit && item.pursuit.modifierHashes.length !== 0 && (
        <div className="item-details">
          {item.pursuit.modifierHashes.map((modifierHash) => (
            <ActivityModifier key={modifierHash} modifierHash={modifierHash} defs={defs} />
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
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemDetails);
