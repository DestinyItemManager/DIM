import React from 'react';

export default function RecoilStat({ value }: { value: number }) {
  // A value from 100 to -100 where positive is right and negative is left
  // See https://imgur.com/LKwWUNV
  const direction = Math.sin((value + 5) * ((2 * Math.PI) / 20)) * (100 - value) * (Math.PI / 180);

  const x = Math.sin(direction);
  const y = Math.cos(direction);

  const spread = 0.75;
  const xSpreadMore = Math.sin(direction + direction * spread);
  const ySpreadMore = Math.cos(direction + direction * spread);
  const xSpreadLess = Math.sin(direction - direction * spread);
  const ySpreadLess = Math.cos(direction - direction * spread);

  return (
    <svg height="12" viewBox="0 0 2 1">
      <circle r={1} cx={1} cy={1} fill="#333" />
      {Math.abs(direction) > 0.1 ? (
        <path
          d={`M1,1 L${1 + xSpreadMore},${1 - ySpreadMore} A1,1 0 0,${direction < 0 ? '1' : '0'} ${
            1 + xSpreadLess
          },${1 - ySpreadLess} Z`}
          fill="#FFF"
        />
      ) : (
        <line x1={1 - x} y1={1 + y} x2={1 + x} y2={1 - y} stroke="white" strokeWidth="0.1" />
      )}
    </svg>
  );
}
