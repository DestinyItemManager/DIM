import React from 'react';

export default function InventoryToggle({
  mode,
  onClick,
}: {
  mode: boolean;
  onClick: (mode: boolean) => void;
}) {
  return (
    <div className={`dim-button inventory-toggle ${mode ? 'alt' : ''}`}>
      <input
        id="inventory-toggle"
        type="checkbox"
        onClick={(event) => {
          onClick(event.currentTarget.checked);
        }}
      />
      <label htmlFor="inventory-toggle">
        {mode ? 'Active Mode' : 'Inventory Mode'} <div className="beta">BETA</div>
      </label>
    </div>
  );
}
