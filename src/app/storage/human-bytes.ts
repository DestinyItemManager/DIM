/**
 * Prints a number of bytes in a more appropriate unit.
 */
export function humanBytes(size: number) {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
}
