import React from 'react';
import { DimStat } from 'app/inventory/item-types';

export default function RecoilStat({
  stat,
  compareStat
}: {
  stat: DimStat;
  compareStat?: DimStat;
}) {
  const val = stat.value;

  return (
    <svg height="12" viewBox="0 0 2 1">
      <circle r={1} cx={1} cy={1} fill="#555" />
      <Wedge val={val} />
      {compareStat && <Wedge val={compareStat.value} compare={val} />}
    </svg>
  );
}

export function recoilDirection(val: number) {
  // A value from 100 to -100 where positive is right and negative is left
  // See https://imgur.com/LKwWUNV
  return Math.sin((val + 5) * ((2 * Math.PI) / 20)) * (100 - val) * (Math.PI / 180);
}

function Wedge({ val, compare }: { val: number; compare?: number }) {
  let color = '#FFF';
  let opacity = 1.0;
  const direction = recoilDirection(val);

  if (compare !== undefined) {
    const compareDirection = recoilDirection(compare);
    color = Math.abs(compareDirection) < Math.abs(direction) ? '#6dcc66' : '#cc6666';
    opacity = 0.7;
  }

  const x = Math.sin(direction);
  const y = Math.cos(direction);

  const spread = 0.75;
  const xSpreadMore = Math.sin(direction + direction * spread);
  const ySpreadMore = Math.cos(direction + direction * spread);
  const xSpreadLess = Math.sin(direction - direction * spread);
  const ySpreadLess = Math.cos(direction - direction * spread);

  return Math.abs(direction) > 0.1 ? (
    <path
      d={`M1,1 L${1 + xSpreadMore},${1 - ySpreadMore} A1,1 0 0,${direction < 0 ? '1' : '0'} ${1 +
        xSpreadLess},${1 - ySpreadLess} Z`}
      fill={color}
      opacity={opacity}
    />
  ) : (
    <line
      x1={1 - x}
      y1={1 + y}
      x2={1 + x}
      y2={1 - y}
      stroke={color}
      strokeWidth="0.1"
      opacity={opacity}
    />
  );
}
