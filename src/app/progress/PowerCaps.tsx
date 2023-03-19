import { t } from 'app/i18next-t';
import { powerLevelByKeyword } from 'app/search/d2-known-values';
import clsx from 'clsx';
import styles from './powercaps.m.scss';

interface PowerCapValue {
  powercap: keyof typeof powerLevelByKeyword;
  label: String | null;
}

export function PowerCaps() {
  const caps: PowerCapValue[] = [
    { powercap: 'powerfloor', label: t('Power Floor') },
    { powercap: 'softcap', label: t('Soft Cap') },
    { powercap: 'powerfulcap', label: t('Powerful Cap') },
    { powercap: 'pinnaclecap', label: t('Pinnacle Cap') },
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
