import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { produce } from 'immer';
import _ from 'lodash';
import React from 'react';
import { SelectedPlugs } from './types';

interface SDState {
  subclass: DimItem | undefined;
  plugsBySubclassHash: { [subclassHash: number]: SelectedPlugs };
}

type SDAction =
  | { type: 'update-subclass'; subclass: DimItem }
  | { type: 'update-plugs'; selectedPlugs: SelectedPlugs }
  | {
      type: 'update-plugs-by-plug-category-hash';
      plugs: PluggableInventoryItemDefinition[];
      plugCategoryHash: number;
    };

export type SDDispatch = React.Dispatch<SDAction>;

export function sdReducer(state: SDState, action: SDAction): SDState {
  switch (action.type) {
    case 'update-subclass': {
      const { subclass } = action;
      return produce(state, (draft) => {
        draft.subclass = subclass;
      });
    }
    case 'update-plugs': {
      const { selectedPlugs } = action;
      return produce(state, (draft) => {
        if (draft.subclass) {
          draft.plugsBySubclassHash[draft.subclass.hash] = selectedPlugs;
        }
      });
    }
    case 'update-plugs-by-plug-category-hash': {
      const { plugs, plugCategoryHash } = action;
      return produce(state, (draft) => {
        if (draft.subclass) {
          draft.plugsBySubclassHash[draft.subclass.hash][plugCategoryHash] = plugs;
        }
      });
    }
  }
}

export function sdInit({
  subclasses,
  initialSubclass,
  initialPlugs,
}: {
  subclasses: DimItem[];
  initialSubclass: DimItem | undefined;
  initialPlugs: PluggableInventoryItemDefinition[];
}): SDState {
  const plugsBySubclassHash = {};

  for (const subclass of subclasses) {
    plugsBySubclassHash[subclass.hash] = {};
  }

  if (initialSubclass) {
    plugsBySubclassHash[initialSubclass.hash] = _.groupBy(
      initialPlugs,
      (item) => item.plug.plugCategoryHash
    );
  }

  return {
    subclass: initialSubclass,
    plugsBySubclassHash,
  };
}
