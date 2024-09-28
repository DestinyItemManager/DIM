import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import anyExoticIcon from 'images/anyExotic.svg';
import noExoticIcon from 'images/noExotic.svg';
import { LOCKED_EXOTIC_ANY_EXOTIC, LOCKED_EXOTIC_NO_EXOTIC } from '../types';
import styles from './ExoticArmorChoice.m.scss';

export function getLockedExotic(defs: D2ManifestDefinitions, lockedExoticHash: number) {
  const exoticArmor =
    lockedExoticHash !== undefined && lockedExoticHash > 0
      ? defs.InventoryItem.get(lockedExoticHash)
      : undefined;

  const name =
    lockedExoticHash === LOCKED_EXOTIC_NO_EXOTIC
      ? t('LoadoutBuilder.NoExotic')
      : lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC
        ? t('LoadoutBuilder.AnyExotic')
        : exoticArmor
          ? exoticArmor.displayProperties.name
          : null;

  return [exoticArmor, name] as const;
}

export default function ExoticArmorChoice({
  lockedExoticHash,
  onClose,
}: {
  lockedExoticHash: number;
  onClose?: () => void;
}) {
  const defs = useD2Definitions()!;
  const [exoticArmor, name] = getLockedExotic(defs, lockedExoticHash);

  const icon =
    lockedExoticHash === LOCKED_EXOTIC_NO_EXOTIC ? (
      <img src={noExoticIcon} className="item-img" />
    ) : lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC ? (
      <img src={anyExoticIcon} className="item-img" />
    ) : exoticArmor ? (
      <DefItemIcon itemDef={exoticArmor} />
    ) : null;

  return (
    <div className={styles.exoticArmorChoice}>
      {onClose ? <ClosableContainer onClose={onClose}>{icon}</ClosableContainer> : icon}
      <span>{name}</span>
    </div>
  );
}
