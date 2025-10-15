import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEEPSIGHT_HARMONIZER } from 'app/search/d2-known-values';
import * as styles from './DeepSightHarmonizerIcon.m.scss';

export function DeepsightHarmonizerIcon({ item }: { item: DimItem }) {
  return (
    <PressTip
      tooltip={<HarmonizableTooltipContent item={item} />}
      className={styles.deepsightHarmonizerIcon}
    >
      <HarmonizerIcon />
    </PressTip>
  );
}

export function HarmonizerIcon() {
  const defs = useD2Definitions()!;
  const harmonizerIcon = defs.InventoryItem.get(DEEPSIGHT_HARMONIZER)?.displayProperties.icon;
  return <BungieImage src={harmonizerIcon} height={15} width={15} />;
}

function HarmonizableTooltipContent({ item }: { item: DimItem }) {
  const harmonizableTooltipText = item.tooltipNotifications?.map((t) => t.displayString);
  const harmonizableTooltip = (
    <>
      <p>{harmonizableTooltipText}</p>
      <p>
        {t('Filter.FilterWith')} <code>deepsight:harmonizable</code>
      </p>
    </>
  );

  return harmonizableTooltip;
}
