import * as React from 'react';
import './loadout-edit-popup.scss';

interface Props {
  editHandler(): void;
  closeHandler(): void;
}

const LoadoutEditPopup = (props: Props) => (
  <div className="dim-loadout-edit-popup">
    <div>A loadout with this name already exists would you like to edit it?</div>
    <button className="dim-button" onClick={props.editHandler}>
      Edit
    </button>
    <button className="dim-button" onClick={props.closeHandler}>
      Close
    </button>
  </div>
);

export default LoadoutEditPopup;
