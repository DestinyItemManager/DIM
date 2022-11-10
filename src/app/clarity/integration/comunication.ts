import { DimItem } from 'app/inventory/item-types';
import store from 'app/store/store';
import { loadClarity } from '../actions';

// i wish websockets was available

function sendDataToClarity(data: {}) {
  const element = document.getElementById('app');
  const event = new CustomEvent('to-clarity', { detail: data });
  element?.dispatchEvent(event);
}

export function sendItemToClarity(item: DimItem, identifier: string) {
  sendDataToClarity({ item, identifier });
}

// it should run as early as possible
(() => {
  const element = document.getElementById('app');

  const listener = (e: CustomEvent) => {
    // for now only thing this needs to do is tell DIM clarity is on
    if (typeof e.detail.enableClarity === 'boolean') {
      store.dispatch(loadClarity(e.detail.enableClarity));
    }

    // sending data back to confirm its arrival
    sendDataToClarity({ confirmation: e.detail });
  };

  element?.addEventListener('from-clarity', listener);
})();

// all things i added for clarity can be turned on or off using this
// just change { enableClarity: true or false } and paste in console
// const element = document.getElementById('app');
// const event = new CustomEvent('from-clarity', { detail: { enableClarity: true } });
// element?.dispatchEvent(event);
