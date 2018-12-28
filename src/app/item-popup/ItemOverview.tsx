import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import NotesForm from './NotesForm';
import ExternalLink from '../dim-ui/ExternalLink';
import ishtarLogo from '../../images/ishtar-collective.svg';
import { t } from 'i18next';
import BungieImage from '../dim-ui/BungieImage';
import { settings } from '../settings/settings';
import Sockets from '../move-popup/Sockets';
import { UISref } from '@uirouter/react';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';

export default function ItemOverview({
  item,
  rewards
}: {
  item: DimItem;
  rewards?: {
    quantity: number;
    item: DestinyInventoryItemDefinition;
  }[];
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
          </ExternalLink>
          <ExternalLink href={loreLink}>{t('MovePopup.ReadLore')}</ExternalLink>
        </div>
      )}

      {(item.type === 'Emblems' || item.type === 'Emblem') && (
        <BungieImage className="item-details" src={item.secondaryIcon} width="237" height="48" />
      )}

      {item.isDestiny2() &&
        item.masterworkInfo &&
        (item.masterwork || item.masterworkInfo.progress) && (
          <div className="masterwork-progress">
            <BungieImage
              src={item.masterworkInfo.typeIcon}
              title={item.masterworkInfo.typeName || undefined}
            />
            <span>
              {item.masterworkInfo.typeDesc}{' '}
              <strong>
                {(item.masterworkInfo.progress || 0).toLocaleString(settings.language)}
              </strong>
            </span>
          </div>
        )}

      {item.classified && <div className="item-details">{t('ItemService.Classified2')}</div>}

      {/*<dim-item-stats item="item" className="stats" ng-if="hasDetails && item.stats.length" />*/}

      {item.talentGrid && (
        <div className="item-details item-perks">
          {/*<dim-talent-grid talent-grid="item.talentGrid" dim-infuse="infuse(item, $event)" />*/}
        </div>
      )}

      {item.missingSockets && (
        <div className="item-details warning">{t('MovePopup.MissingSockets')}</div>
      )}

      {item.isDestiny2() && item.sockets && <Sockets item={item} />}

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

      {/*<dim-objectives
        className="item-details"
        ng-if="item.objectives"
        objectives="item.objectives"
      />*/}
      {/*
      <dim-flavor-objective
        className="item-details"
        ng-if="item.flavorObjective"
        objective="item.flavorObjective"
      />*/}

      {item.isDestiny2() && item.previewVendor !== undefined && item.previewVendor !== 0 && (
        <div className="item-description">
          <UISref to="destiny2.vendor" params={{ id: item.previewVendor }}>
            <a>{t('ItemService.PreviewVendor', { type: item.typeName })}</a>
          </UISref>
        </div>
      )}

      {/* TODO: Move into vendors component somehow?? */}
      {rewards && rewards.length > 0 && (
        <div className="item-details">
          <div ng-i18next="MovePopup.Rewards" />
          {rewards.map((reward) => (
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
    </div>
  );
}
