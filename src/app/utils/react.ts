import { ReactElement, ReactNode, cloneElement } from 'react';

/** places a divider between each element of arr */
export function addDividers<T extends React.ReactNode>(
  arr: T[],
  divider: ReactElement,
): ReactNode[] {
  return arr.flatMap((e, i) => [i ? cloneElement(divider, { key: `divider-${i}` }) : null, e]);
}
