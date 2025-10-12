import * as styles from './FractionalPowerLevel.m.scss';

export default function FractionalPowerLevel({ power }: { power: number }) {
  const numerator = (power * 8) % 8;
  return (
    <span className={styles.fractionalPowerLevel}>
      {Math.floor(power)}
      {numerator !== 0 && (
        <>
          &#8239;
          <span className={styles.fraction}>
            <sup>{Math.floor(numerator)}</sup>⁄<sub>8</sub>
          </span>
        </>
      )}
    </span>
  );
}
