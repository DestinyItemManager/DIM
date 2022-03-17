/**
 * Given a value 0-1, returns a string describing it as a percentage from 0-100
 */
export function percent(val: number): string {
  return `${Math.min(100, Math.floor(100 * val))}%`;
}

/**
 * Given a value on (or outside) a 0-100 scale, returns a css color key and value for a react `style` attribute
 */
export function getColor(value: number, property = 'background-color') {
  let color = 0;
  if (value < 0) {
    return { [property]: 'white' };
  } else if (value <= 85) {
    color = 0;
  } else if (value <= 90) {
    color = 20;
  } else if (value <= 95) {
    color = 60;
  } else if (value <= 99) {
    color = 120;
  } else if (value >= 100) {
    color = 190;
  }
  return {
    [property]: `hsla(${color},65%,50%, 1)`,
  };
}
