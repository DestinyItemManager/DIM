import { t } from 'app/i18next-t';
import { powerLevelByKeyword } from 'app/search/power-levels';
import clsx from 'clsx';
import styles from './powercaps.m.scss';

interface PowerCapValue {
  powercap: keyof typeof powerLevelByKeyword;
  label: string | null;
}

export function PowerCaps() {
  const caps: PowerCapValue[] = [
    { powercap: 'powerfloor', label: t('Milestone.PowerFloor') },
    { powercap: 'softcap', label: t('Milestone.SoftCap') },
    { powercap: 'powerfulcap', label: t('Milestone.PowerfulCap') },
    { powercap: 'pinnaclecap', label: t('Milestone.PinnacleCap') },
  ];
  return (
    <div className={styles.powercaps}>
      {caps.map(({ powercap, label }) => (
        <div key={powercap} className={styles.powercap}>
          <span
            className={clsx(styles.powercapValue, {
              [styles.pinnaclecap]: powercap === 'pinnaclecap',
            })}
          >
            {powerLevelByKeyword[powercap]}
          </span>
          <span className={styles.powercapLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}
