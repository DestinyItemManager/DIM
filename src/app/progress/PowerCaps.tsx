import { powerLevelByKeyword } from 'app/search/d2-known-values';
import clsx from 'clsx';
import { DefaultTFuncReturn, t } from 'i18next';
import styles from './powercaps.m.scss';

interface PowerCapValue {
  powercap: keyof typeof powerLevelByKeyword;
  label: DefaultTFuncReturn | null;
}
const caps: PowerCapValue[] = [
  { powercap: 'powerfloor', label: t('Power Floor') },
  { powercap: 'softcap', label: t('Soft Cap') },
  { powercap: 'powerfulcap', label: t('Powerful Cap') },
  { powercap: 'pinnaclecap', label: t('Pinnacle Cap') },
];

export function PowerCaps() {
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
