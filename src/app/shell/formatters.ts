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
 * Given a value on (or outside) a 0-100 scale, returns a css color key and value for a react `style` attribute
 */
export function getColor(value: number, property = 'background-color') {
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

  return {
    [property]: color,
  };
}
