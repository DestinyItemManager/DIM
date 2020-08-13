import React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'app/i18next-t';
import BungieImage from '../dim-ui/BungieImage';
import EnergyMeter from './EnergyMeter';
import ItemSockets from './ItemSockets';
import { ItemPopupExtraInfo } from './item-popup';
import ItemStats from './ItemStats';
import ItemTalentGrid from './ItemTalentGrid';
import { AppIcon, faCheck } from '../shell/icons';
import ItemDescription from './ItemDescription';
import ItemExpiration from './ItemExpiration';
import { Reward } from 'app/progress/Reward';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import { ActivityModifier } from 'app/progress/ActivityModifier';
import helmetIcon from 'destiny-icons/armor_types/helmet.svg';
import handCannonIcon from 'destiny-icons/weapons/hand_cannon.svg';
import modificationIcon from 'destiny-icons/general/modifications.svg';
import MetricCategories from './MetricCategories';
import EmblemPreview from './EmblemPreview';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import Objective from 'app/progress/Objective';
import { Link, useParams } from 'react-router-dom';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

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

  return (
    <div className="item-details-body">
      {item.itemCategoryHashes.includes(ItemCategoryHashes.Shaders) && (
        <BungieImage className="item-shader" src={item.icon} width="96" height="96" />
      )}

      <ItemDescription item={item} />

      <ItemExpiration item={item} />

      {!item.stats && item.isDestiny2() && item.collectibleHash !== null && isD2Manifest(defs) && (
        <div className="item-details">
          {defs.Collectible.get(item.collectibleHash).sourceString}
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

      {item.isDestiny2() &&
        item.masterworkInfo &&
        Boolean(item.masterwork || item.masterworkInfo.progress) &&
        item.masterworkInfo.typeName && (
          <div className="masterwork-progress">
            {item.masterworkInfo.typeIcon && (
              <BungieImage
                src={item.masterworkInfo.typeIcon}
                title={item.masterworkInfo.typeName || undefined}
              />
            )}{' '}
            <span>
              {item.masterworkInfo.typeDesc}{' '}
              <strong>{(item.masterworkInfo.progress || 0).toLocaleString()}</strong>
            </span>
          </div>
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

      {item.isDestiny2() && isD2Manifest(defs) && item.energy && defs && (
        <EnergyMeter item={item} defs={defs} />
      )}
      {item.isDestiny2() && item.sockets && <ItemSockets item={item} />}

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

      {item.isDestiny2() && item.flavorObjective && (
        <div className="item-details">
          <div className="flavor-objective">
            <BungieImage src={item.flavorObjective.icon} />
            <span>
              {' '}
              {item.flavorObjective.progress} {'//'} {item.flavorObjective.description}
            </span>
          </div>
        </div>
      )}

      {item.isDestiny2() && item.previewVendor !== undefined && item.previewVendor !== 0 && (
        <div className="item-description">
          <Link
            to={`/${urlParams.membershipId}/d${urlParams.destinyVersion}/vendors/${item.previewVendor}`}
          >
            {t('ItemService.PreviewVendor', { type: item.typeName })}
          </Link>
        </div>
      )}

      {isD2Manifest(defs) &&
        item.isDestiny2() &&
        item.pursuit &&
        item.pursuit.rewards.length !== 0 && (
          <div className="item-details">
            <div>{t('MovePopup.Rewards')}</div>
            {item.pursuit.rewards.map((reward) => (
              <Reward key={reward.itemHash} reward={reward} defs={defs} />
            ))}
          </div>
        )}

      {isD2Manifest(defs) &&
        item.isDestiny2() &&
        item.pursuit &&
        item.pursuit.modifierHashes.length !== 0 && (
          <div className="item-details">
            {item.pursuit.modifierHashes.map((modifierHash) => (
              <ActivityModifier key={modifierHash} modifierHash={modifierHash} defs={defs} />
            ))}
          </div>
        )}

      {!extraInfo.mod && extraInfo.collectible && (
        <div className="item-details">
          <div>{extraInfo.collectible.sourceString}</div>
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
      )}

      {extraInfo.mod && (
        <div className="item-details mods">
          {extraInfo.collectible && <div>{extraInfo.collectible.sourceString}</div>}
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
      )}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemDetails);
