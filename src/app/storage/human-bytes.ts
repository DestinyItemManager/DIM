/**
 * Prints a number of bytes in a more appropriate unit.
 */
export function humanBytes(size: number) {
  if (size <= 0) {
    return '0B';
  }
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
}
