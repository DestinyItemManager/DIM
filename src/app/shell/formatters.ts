/**
 * Given a value 0-1, returns a string describing it as a percentage from 0-100
 */
export function percent(val: number): string {
  return `${Math.min(100, Math.floor((1000 * val) / 10))}%`;
}

/**
 * Given a value 0-1, returns a string describing it as a percentage from 0-100
 */
export function percentWithSingleDecimal(val: number): string {
  return `${Math.min(100, Math.floor(1000 * val) / 10).toLocaleString()}%`;
}

/**
 * Given a value on (or outside) a 0-100 scale, returns a css color value. This
 * is used when comparing item stats.
 */
export function getCompareColor(value: number) {
  let color = '';
  if (value < 0) {
    color = '#e0e0e0';
  } else if (value < 50) {
    color = 'hsl(0, 45.20%, 50.60%)';
  } else if (value < 80) {
    color = 'hsl(49, 58.60%, 56.50%)';
  } else if (value < 100) {
    color = 'hsl(120, 54.70%, 60.20%)';
  } else if (value >= 100) {
    color = 'oklch(82.08% 0.1561 215.44)';
  }

  return color;
}

/**
 * Given a value on (or outside) a 0-100 scale, returns a css color key and
 * value for a react `style` attribute. This is the color scale DIM used for a
 * long time, and it's preserved here for D1 reasons.
 */
export function getD1QualityColor(value: number, property = 'background-color') {
  let color = 0;
  if (value < 0) {
    return { [property]: 'white' };
  } else if (value <= 85) {
    color = 0;
  } else if (value <= 90) {
    color = 20;
  } else if (value <= 95) {
    color = 60;
  } else if (value < 100) {
    color = 120;
  } else if (value >= 100) {
    color = 190;
  }
  return {
    [property]: `hsl(${color},65%,50%, 1)`,
  };
}
