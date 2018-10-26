import * as React from 'react';

export default function TierSelect({
  name,
  stat,
  onTierChange
}: {
  name: string;
  stat: { min: number; max: number };
  onTierChange({ min, max }: { min?: number; max?: number }): void;
}) {
  return (
    <div className="flex mr4">
      <span>{name}</span>
      <select
        value={stat.min}
        onChange={(e) => onTierChange({ min: parseInt(e.target.value, 10) })}
      >
        <option disabled={true}>Min</option>
        {[...Array(11).keys()].map((tier) => (
          <option key={tier}>{tier}</option>
        ))}
      </select>

      <select
        value={stat.max}
        onChange={(e) => onTierChange({ max: parseInt(e.target.value, 10) })}
      >
        <option disabled={true}>Max</option>
        {[...Array(11).keys()].map((tier) => (
          <option key={tier}>{tier}</option>
        ))}
      </select>
    </div>
  );
}
