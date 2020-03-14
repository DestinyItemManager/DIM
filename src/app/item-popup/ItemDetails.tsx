import React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'app/i18next-t';
import BungieImage from '../dim-ui/BungieImage';
import EnergyMeter from './EnergyMeter';
import ItemSockets from './ItemSockets';
import { UISref } from '@uirouter/react';
import { ItemPopupExtraInfo } from './item-popup';
import ItemStats from './ItemStats';
import ItemObjectives from './ItemObjectives';
import ItemTalentGrid from './ItemTalentGrid';
import { AppIcon, faCheck } from '../shell/icons';
import ItemDescription from './ItemDescription';
import ItemExpiration from './ItemExpiration';
import { Reward } from 'app/progress/Reward';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { RootState } from 'app/store/reducers';
import { connect } from 'react-redux';
import { ActivityModifier } from 'app/progress/ActivityModifier';
import helmetIcon from 'destiny-icons/armor_types/helmet.svg';
import handCannonIcon from 'destiny-icons/weapons/hand_cannon.svg';
import modificationIcon from 'destiny-icons/general/modifications.svg';

interface ProvidedProps {
  item: DimItem;
  extraInfo?: ItemPopupExtraInfo;
}

interface StoreProps {
  defs?: D2ManifestDefinitions;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    defs: state.manifest.d2Manifest
  };
}

// TODO: probably need to load manifest. We can take a lot of properties off the item if we just load the definition here.
function ItemDetails({ item, extraInfo = {}, defs }: Props) {
  // mods should be 610365472 ("Weapon Mods") if they aren't 4104513227 ("Armor Mods")
  const modTypeIcon = item.itemCategoryHashes.includes(4104513227) ? helmetIcon : handCannonIcon;

  return (
    <div className="item-details-body">
      {item.itemCategoryHashes.includes(41) && (
        <BungieImage className="item-shader" src={item.icon} width="96" height="96" />
      )}

      <ItemDescription item={item} />

      <ItemExpiration item={item} />

      {item.itemCategoryHashes.includes(19) && (
        <BungieImage className="item-details" src={item.secondaryIcon} width="237" height="48" />
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

      {item.isDestiny2() && item.energy && defs && <EnergyMeter item={item} defs={defs} />}
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

      <ItemObjectives itemHash={item.hash} objectives={item.objectives} defs={defs} />

      {item.isDestiny2() && item.flavorObjective && (
        <div className="item-objectives item-details">
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
          <UISref to="destiny2.vendor" params={{ id: item.previewVendor }}>
            <a>{t('ItemService.PreviewVendor', { type: item.typeName })}</a>
          </UISref>
        </div>
      )}

      {defs && item.isDestiny2() && item.pursuit && item.pursuit.rewards.length !== 0 && (
        <div className="item-details">
          <div>{t('MovePopup.Rewards')}</div>
          {item.pursuit.rewards.map((reward) => (
            <Reward key={reward.itemHash} reward={reward} defs={defs} />
          ))}
        </div>
      )}

      {defs && item.isDestiny2() && item.pursuit && item.pursuit.modifierHashes.length !== 0 && (
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

      {/* TODO: show source info via collections */}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemDetails);
