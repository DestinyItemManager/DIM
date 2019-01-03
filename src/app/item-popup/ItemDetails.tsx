import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import NotesForm from './NotesForm';
import ExternalLink from '../dim-ui/ExternalLink';
import ishtarLogo from '../../images/ishtar-collective.svg';
import { t } from 'i18next';
import BungieImage from '../dim-ui/BungieImage';
import { settings } from '../settings/settings';
import ItemSockets from './ItemSockets';
import { UISref } from '@uirouter/react';
import { ItemPopupExtraInfo } from './item-popup';
import checkMark from '../../images/check.svg';
import ItemStats from './ItemStats';
import ItemObjectives from './ItemObjectives';
import ItemTalentGrid from './ItemTalentGrid';

// TODO: probably need to load manifest. We can take a lot of properties off the item if we just load the definition here.
export default function ItemDetails({
  item,
  extraInfo = {}
}: {
  item: DimItem;
  extraInfo?: ItemPopupExtraInfo;
}) {
  const showDescription = Boolean(item.description && item.description.length);

  const loreLink = item.loreHash
    ? `http://www.ishtar-collective.net/entries/${item.loreHash}`
    : undefined;

  return (
    <div>
      {item.taggable && <NotesForm item={item} />}

      {showDescription && <div className="item-description">{item.description}</div>}

      {loreLink && (
        <div className="item-lore">
          <ExternalLink href={loreLink}>
            <img src={ishtarLogo} height="16" width="16" />
          </ExternalLink>{' '}
          <ExternalLink href={loreLink}>{t('MovePopup.ReadLore')}</ExternalLink>
        </div>
      )}

      {(item.type === 'Emblems' || item.type === 'Emblem') && (
        <BungieImage className="item-details" src={item.secondaryIcon} width="237" height="48" />
      )}

      {item.isDestiny2() &&
        item.masterworkInfo &&
        Boolean(item.masterwork || item.masterworkInfo.progress) &&
        item.masterworkInfo.typeName && (
          <div className="masterwork-progress">
            <BungieImage
              src={item.masterworkInfo.typeIcon}
              title={item.masterworkInfo.typeName || undefined}
            />{' '}
            <span>
              {item.masterworkInfo.typeDesc}{' '}
              <strong>
                {(item.masterworkInfo.progress || 0).toLocaleString(settings.language)}
              </strong>
            </span>
          </div>
        )}

      {item.classified && <div className="item-details">{t('ItemService.Classified2')}</div>}

      <ItemStats item={item} compareItem={extraInfo.compareItem} />

      {item.talentGrid && (
        <div className="item-details item-perks">
          <ItemTalentGrid talentGrid={item.talentGrid} />
        </div>
      )}

      {item.missingSockets && (
        <div className="item-details warning">{t('MovePopup.MissingSockets')}</div>
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

      <ItemObjectives objectives={item.objectives} />

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

      {extraInfo.rewards && extraInfo.rewards.length > 0 && (
        <div className="item-details">
          <div>{t('MovePopup.Rewards')}</div>
          {extraInfo.rewards.map((reward) => (
            <div key={reward.item.hash} className="milestone-reward">
              <BungieImage src={reward.item.displayProperties.icon} />
              <span>
                {reward.item.displayProperties.name}
                {reward.quantity > 1 && <span> +{reward.quantity}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {extraInfo.collectible && (
        <div className="item-details">
          <div>{extraInfo.collectible.sourceString}</div>
          {extraInfo.owned && (
            <div>
              <img className="owned-icon" src={checkMark} /> {t('MovePopup.Owned')}
            </div>
          )}
          {extraInfo.acquired && (
            <div>
              {/* TODO: use a blue icon */}
              <img className="owned-icon" src={checkMark} /> {t('MovePopup.Acquired')}
            </div>
          )}
        </div>
      )}

      {/* TODO: show source info via collections */}
    </div>
  );
}
