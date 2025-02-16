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
  const hueGood = [75.48, 0.2381, 142.76];
  const hueBad = [56.45, 0.2009, 26.56];
  if (value < 0) {
    return { [property]: 'white' };
  } else if (value >= 100) {
    return {
      [property]: `hsl(190,65%,50%)`,
    };
  }

  const result = hueGood.map((_, i) => (hueGood[i] - hueBad[i]) * (value / 100) + hueBad[i]);

  return {
    [property]: `oklch(${Math.min(result[0], 100)}% ${result[1]} ${result[2]})`,
  };
}
