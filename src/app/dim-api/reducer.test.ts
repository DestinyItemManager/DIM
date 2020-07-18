import { DimApiState, initialState as apiInitialState, dimApi } from './reducer';
import { DestinyClass, BungieMembershipType } from 'bungie-api-ts/destiny2';
import { DeleteLoadoutUpdateWithRollback } from './api-types';
import { prepareToFlushUpdates, finishedUpdates } from './basic-actions';
import { setSetting } from 'app/settings/actions';
import { setItemTag, setItemHashTag } from 'app/inventory/actions';
import { DestinyAccount } from 'app/accounts/destiny-account';
import copy from 'fast-copy';

const currentAccount: DestinyAccount = {
  membershipId: '98765',
  destinyVersion: 2,
  displayName: 'Foobar',
  originalPlatformType: BungieMembershipType.TigerPsn,
  platformLabel: 'PlayStation',
  platforms: [BungieMembershipType.TigerPsn],
};
const currentAccountKey = '98765-d2';

const initialState: DimApiState = {
  ...apiInitialState,
  apiPermissionGranted: true,
};

describe('setSetting', () => {
  it('changes settings', () => {
    const state = initialState;

    const updatedState = dimApi(state, setSetting('showNewItems', true));

    expect(updatedState.settings.showNewItems).toBe(true);
    expect(copy(updatedState.updateQueue)).toEqual([
      {
        action: 'setting',
        payload: {
          showNewItems: true,
        },
        before: {
          showNewItems: false,
        },
      },
    ]);
  });
});

describe('setItemTag', () => {
  it('sets tags if there were none before', () => {
    const state = initialState;

    const updatedState = dimApi(
      state,
      setItemTag({ itemId: '1234', tag: 'favorite' }),
      currentAccount
    );

    expect(updatedState.profiles[currentAccountKey].tags['1234'].tag).toBe('favorite');
    expect(copy(updatedState.updateQueue)).toEqual([
      {
        action: 'tag',
        payload: {
          id: '1234',
          tag: 'favorite',
        },
        platformMembershipId: currentAccount.membershipId,
        destinyVersion: currentAccount.destinyVersion,
      },
    ]);
  });

  it('clears set tags', () => {
    const state = initialState;

    let updatedState = dimApi(
      state,
      setItemTag({ itemId: '1234', tag: 'favorite' }),
      currentAccount
    );

    updatedState = dimApi(
      updatedState,
      setItemTag({ itemId: '1234', tag: undefined }),
      currentAccount
    );

    expect(updatedState.profiles[currentAccountKey].tags['1234']).toBeUndefined();
    expect(copy(updatedState.updateQueue)).toEqual([
      {
        action: 'tag',
        payload: {
          id: '1234',
          tag: 'favorite',
        },
        platformMembershipId: currentAccount.membershipId,
        destinyVersion: currentAccount.destinyVersion,
      },
      {
        action: 'tag',
        payload: {
          id: '1234',
          tag: null,
        },
        before: {
          id: '1234',
          tag: 'favorite',
        },
        platformMembershipId: currentAccount.membershipId,
        destinyVersion: currentAccount.destinyVersion,
      },
    ]);
  });
});

describe('setItemHashTag', () => {
  it('sets tags if there were none before', () => {
    const state = initialState;

    const updatedState = dimApi(
      state,
      setItemHashTag({ itemHash: 1234, tag: 'favorite' }),
      currentAccount
    );

    expect(updatedState.itemHashTags[1234].tag).toBe('favorite');
    expect(copy(updatedState.updateQueue)).toEqual([
      {
        action: 'item_hash_tag',
        payload: {
          hash: 1234,
          tag: 'favorite',
        },
        platformMembershipId: currentAccount.membershipId,
        destinyVersion: currentAccount.destinyVersion,
      },
    ]);
  });

  it('clears set tags', () => {
    const state = initialState;

    let updatedState = dimApi(
      state,
      setItemHashTag({ itemHash: 1234, tag: 'favorite' }),
      currentAccount
    );

    updatedState = dimApi(
      updatedState,
      setItemHashTag({ itemHash: 1234, tag: undefined }),
      currentAccount
    );

    expect(updatedState.itemHashTags[1234]).toBeUndefined();
    expect(copy(updatedState.updateQueue)).toEqual([
      {
        action: 'item_hash_tag',
        payload: {
          hash: 1234,
          tag: 'favorite',
        },
        platformMembershipId: currentAccount.membershipId,
        destinyVersion: currentAccount.destinyVersion,
      },
      {
        action: 'item_hash_tag',
        payload: {
          hash: 1234,
          tag: null,
        },
        before: {
          hash: 1234,
          tag: 'favorite',
        },
        platformMembershipId: currentAccount.membershipId,
        destinyVersion: currentAccount.destinyVersion,
      },
    ]);
  });
});

describe('prepareToFlushUpdates', () => {
  it('can coalesce settings', () => {
    const state: DimApiState = {
      ...initialState,
      updateQueue: [
        // Turn new items on
        {
          action: 'setting',
          payload: {
            showNewItems: true,
          },
          before: {
            showNewItems: false,
          },
        },
        // Modify another setting
        {
          action: 'setting',
          payload: {
            itemSize: 50,
          },
          before: {
            itemSize: 48,
          },
        },
        // Turn new items back off
        {
          action: 'setting',
          payload: {
            showNewItems: false,
          },
          before: {
            showNewItems: true,
          },
        },
      ],
    };

    const updatedState = dimApi(state, prepareToFlushUpdates());

    expect(updatedState.updateInProgressWatermark).toBe(1);
    // Expect that showNewItems change is eliminated, and there's only one update
    const expected = [
      {
        action: 'setting',
        payload: {
          itemSize: 50,
        },
        before: {
          itemSize: 48,
        },
      },
    ];
    expect(copy(updatedState.updateQueue)).toEqual(expected);
  });

  it('can handle multiple profile updates', () => {
    const state: DimApiState = {
      ...initialState,
      updateQueue: [
        // Turn new items on
        {
          action: 'setting',
          payload: {
            showNewItems: true,
          },
          before: {
            showNewItems: false,
          },
        },
        // Save a tag for D2
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: 'favorite',
          },
          before: {
            id: '1234',
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
        // Save a tag for D1, same profile
        {
          action: 'tag',
          payload: {
            id: '1231903',
            tag: 'keep',
          },
          before: {
            id: '1231903',
          },
          platformMembershipId: '3456',
          destinyVersion: 1,
        },
        // Save a tag for D2, same profile
        {
          action: 'tag',
          payload: {
            id: '76543',
            tag: 'junk',
          },
          before: {
            id: '76543',
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
      ],
    };

    const updatedState = dimApi(state, prepareToFlushUpdates());

    expect(updatedState.updateInProgressWatermark).toBe(3);
    // Expect that the queue is rearranged to have the D2 account updates together
    const expected = [
      // Turn new items on
      {
        action: 'setting',
        payload: {
          showNewItems: true,
        },
        before: {
          showNewItems: false,
        },
      },
      // Save a tag for D2
      {
        action: 'tag',
        payload: {
          id: '1234',
          tag: 'favorite',
        },
        before: {
          id: '1234',
        },
        platformMembershipId: '3456',
        destinyVersion: 2,
      },
      // Save a tag for D2
      {
        action: 'tag',
        payload: {
          id: '76543',
          tag: 'junk',
        },
        before: {
          id: '76543',
        },
        platformMembershipId: '3456',
        destinyVersion: 2,
      },
      // Save a tag for D1
      {
        action: 'tag',
        payload: {
          id: '1231903',
          tag: 'keep',
        },
        before: {
          id: '1231903',
        },
        platformMembershipId: '3456',
        destinyVersion: 1,
      },
    ];
    expect(copy(updatedState.updateQueue)).toEqual(expected);
  });

  it('can handle multiple profile updates with settings last', () => {
    const state: DimApiState = {
      ...initialState,
      updateQueue: [
        // Save a tag for D2
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: 'favorite',
          },
          before: {
            id: '1234',
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
        // Save a tag for D2, same profile
        {
          action: 'tag',
          payload: {
            id: '76543',
            tag: 'junk',
          },
          before: {
            id: '76543',
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
        // Turn new items on
        {
          action: 'setting',
          payload: {
            showNewItems: true,
          },
          before: {
            showNewItems: false,
          },
        },
      ],
    };

    const updatedState = dimApi(state, prepareToFlushUpdates());

    expect(updatedState.updateInProgressWatermark).toBe(3);
    // Expect that the queue is rearranged to have the D2 account updates together
    const expected = [
      // Save a tag for D2
      {
        action: 'tag',
        payload: {
          id: '1234',
          tag: 'favorite',
        },
        before: {
          id: '1234',
        },
        platformMembershipId: '3456',
        destinyVersion: 2,
      },
      // Save a tag for D2
      {
        action: 'tag',
        payload: {
          id: '76543',
          tag: 'junk',
        },
        before: {
          id: '76543',
        },
        platformMembershipId: '3456',
        destinyVersion: 2,
      },
      // Turn new items on
      {
        action: 'setting',
        payload: {
          showNewItems: true,
        },
        before: {
          showNewItems: false,
        },
      },
    ];
    expect(copy(updatedState.updateQueue)).toEqual(expected);
  });

  it('can handle loadouts', () => {
    const state: DimApiState = {
      ...initialState,
      updateQueue: [
        // Save a loadout for D2
        {
          action: 'loadout',
          payload: {
            id: '1234',
            name: 'foo',
            classType: DestinyClass.Warlock,
            equipped: [],
            unequipped: [],
            clearSpace: false,
          },
          before: {
            id: '1234',
            name: 'before foo',
            classType: DestinyClass.Unknown,
            equipped: [],
            unequipped: [],
            clearSpace: false,
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
        // Update the name
        {
          action: 'loadout',
          payload: {
            id: '1234',
            name: 'foo',
            classType: DestinyClass.Warlock,
            equipped: [],
            unequipped: [],
            clearSpace: false,
          },
          before: {
            id: '1234',
            name: 'foobar',
            classType: DestinyClass.Warlock,
            equipped: [],
            unequipped: [],
            clearSpace: false,
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
        // Delete it
        {
          action: 'delete_loadout',
          payload: '1234',
          before: {
            id: '1234',
            name: 'foo',
            classType: DestinyClass.Warlock,
            equipped: [],
            unequipped: [],
            clearSpace: false,
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        } as DeleteLoadoutUpdateWithRollback,
      ],
    };

    const updatedState = dimApi(state, prepareToFlushUpdates());

    expect(updatedState.updateInProgressWatermark).toBe(1);

    // Down to a single delete, with the original loadout as the before
    const expected = [
      {
        action: 'delete_loadout',
        payload: '1234',
        before: {
          id: '1234',
          name: 'before foo',
          classType: DestinyClass.Unknown,
          equipped: [],
          unequipped: [],
          clearSpace: false,
        },
        platformMembershipId: '3456',
        destinyVersion: 2,
      },
    ];
    expect(copy(updatedState.updateQueue)).toEqual(expected);
  });

  it('can handle tag stuff', () => {
    const state: DimApiState = {
      ...initialState,
      updateQueue: [
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: 'favorite',
          },
          before: {
            id: '1234',
            tag: 'junk',
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
        {
          action: 'tag',
          payload: {
            id: '1234',
            notes: 'woohoo',
          },
          before: {
            id: '1234',
            tag: 'favorite',
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: null,
          },
          before: {
            id: '1234',
            tag: 'favorite',
            notes: 'woohoo',
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
      ],
    };

    const updatedState = dimApi(state, prepareToFlushUpdates());

    expect(updatedState.updateInProgressWatermark).toBe(1);
    const expected = [
      {
        action: 'tag',
        payload: {
          id: '1234',
          tag: null,
          notes: 'woohoo',
        },
        before: {
          id: '1234',
          tag: 'junk',
        },
        platformMembershipId: '3456',
        destinyVersion: 2,
      },
    ];
    expect(copy(updatedState.updateQueue)).toEqual(expected);
  });
});

describe('finishedUpdates', () => {
  it('can mark success', () => {
    const state: DimApiState = {
      ...initialState,
      updateQueue: [
        {
          action: 'setting',
          payload: {
            showNewItems: true,
          },
          before: {
            showNewItems: false,
          },
        },
        // Save a tag for D2
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: 'favorite',
          },
          before: {
            id: '1234',
          },
          platformMembershipId: '3456',
          destinyVersion: 2,
        },
      ],
      updateInProgressWatermark: 2,
    };
    const updatedState = dimApi(
      state,
      finishedUpdates([{ status: 'Success' }, { status: 'Success' }])
    );

    expect(updatedState.updateInProgressWatermark).toBe(0);
    expect(updatedState.updateQueue).toEqual([]);
  });
});
