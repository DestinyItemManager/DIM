import React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'app/i18next-t';
import './ItemStats.scss';
import { getColor } from '../shell/filters';
import { AppIcon, helpIcon } from '../shell/icons';
import ExternalLink from '../dim-ui/ExternalLink';
import _ from 'lodash';
import ItemStat from './ItemStat';

export default function ItemStats({ item }: { item: DimItem }) {
  if (!item.stats || !item.stats.length) {
    return null;
  }

  return (
    <div className="stats">
      {item.stats.map((stat) => (
        <ItemStat key={stat.statHash} stat={stat} item={item} />
      ))}

      {item.isDestiny1() && item.quality && item.quality.min && (
        <div className="stat-box-row">
          <span className="stat-box-text stat-box-cell stat-box-wrap">{t('Stats.Quality')}</span>
          <span className="stat-box-cell stat-box-wrap" style={getColor(item.quality.min, 'color')}>
            {t('Stats.OfMaxRoll', { range: item.quality.range })}
          </span>
          <ExternalLink
            href="https://github.com/DestinyItemManager/DIM/wiki/View-how-good-the-stat-(Int-Dis-Str)-roll-on-your-armor-is"
            title={t('Stats.PercentHelp')}
          >
            <AppIcon icon={helpIcon} />
          </ExternalLink>
        </div>
      )}
    </div>
  );
}
