import { ProfileUpdateResult, SearchType } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { setItemHashNote, setItemHashTag, setItemNote, setItemTag } from 'app/inventory/actions';
import { deleteLoadout, updateLoadout } from 'app/loadout/actions';
import { setSettingAction } from 'app/settings/actions';
import { identity } from 'app/utils/functions';
import { BungieMembershipType, DestinyClass } from 'bungie-api-ts/destiny2';
import { produce, WritableDraft } from 'immer';
import { ProfileUpdateWithRollback } from './api-types';
import {
  finishedUpdates,
  prepareToFlushUpdates,
  saveSearch,
  searchDeleted,
  searchUsed,
} from './basic-actions';
import {
  initialState as apiInitialState,
  dimApi,
  DimApiAction,
  DimApiState,
  ensureProfile,
} from './reducer';
import { makeProfileKeyFromAccount } from './selectors';

const currentAccount: DestinyAccount = {
  membershipId: '98765',
  destinyVersion: 2,
  displayName: 'Foobar',
  originalPlatformType: BungieMembershipType.TigerPsn,
  platformLabel: 'PlayStation',
  platforms: [BungieMembershipType.TigerPsn],
  lastPlayed: new Date(),
};
const currentAccountKey = '98765-d2';

const initialState: DimApiState = {
  ...apiInitialState,
  apiPermissionGranted: true,
};

describe('dim api reducer', () => {
  const cases: {
    name: string;
    /**
     * Actions to run to set the initial state before our test actions. These
     * will be "flushed" already.
     */
    setup?: (state: WritableDraft<DimApiState>) => void;
    /**
     * A list of actions to run, followed by prepareToFlushUpdates. The tuple
     * option allows specifying a different account than `currentAccount`.
     */
    actions: (DimApiAction | [DimApiAction, DestinyAccount])[];
    /**
     * A function for checking expectations on the state after the action.
     */
    checkState: (state: DimApiState) => void;
    /**
     * The expected queue after prepareToFlushUpdates. Only the action and
     * payload need to be included.
     */
    expectedQueue: Pick<ProfileUpdateWithRollback, 'action' | 'payload'>[];
    /**
     * Set this to skip the reverse-update check.
     */
    noReverse?: boolean;
  }[] = [
    {
      name: 'setSetting: changes settings',
      actions: [setSettingAction('showNewItems', true)],
      checkState: (state) => {
        expect(state.settings.showNewItems).toBe(true);
      },
      expectedQueue: [
        {
          action: 'setting',
          payload: {
            showNewItems: true,
          },
        },
      ],
    },
    {
      name: 'setItemTag: sets tags if there were none before',
      actions: [setItemTag({ itemId: '1234', tag: 'favorite' })],
      checkState: (state) => {
        expect(state.profiles[currentAccountKey].tags['1234'].tag).toBe('favorite');
      },
      expectedQueue: [
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: 'favorite',
          },
        },
      ],
    },
    {
      name: 'setItemTag: clears set tags',
      actions: [
        setItemTag({ itemId: '1234', tag: 'favorite' }),
        setItemTag({ itemId: '1234', tag: undefined }),
      ],
      checkState: (state) => {
        expect(state.profiles[currentAccountKey].tags['1234']).toBeUndefined();
      },
      expectedQueue: [
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: null,
          },
        },
      ],
    },
    {
      name: 'setItemHashTag: sets tags if there were none before',
      actions: [setItemHashTag({ itemHash: 1234, tag: 'favorite' })],
      checkState: (state) => {
        expect(state.itemHashTags[1234].tag).toBe('favorite');
      },
      expectedQueue: [
        {
          action: 'item_hash_tag',
          payload: {
            hash: 1234,
            tag: 'favorite',
          },
        },
      ],
    },
    {
      name: 'setItemHashTag: clears set tags',
      actions: [
        setItemHashTag({ itemHash: 1234, tag: 'favorite' }),
        setItemHashTag({ itemHash: 1234, tag: undefined }),
      ],
      checkState: (state) => {
        expect(state.itemHashTags[1234]?.tag).toBeUndefined();
      },
      expectedQueue: [
        {
          action: 'item_hash_tag',
          payload: {
            hash: 1234,
            tag: null,
          },
        },
      ],
    },
    {
      name: 'setItemTag/setNote: can set both tag and note',
      actions: [
        setItemTag({ itemId: '1234', tag: 'favorite' }),
        setItemNote({ itemId: '1234', note: 'foo' }),
      ],
      checkState: (state) => {
        expect(state.profiles[currentAccountKey].tags['1234'].tag).toBe('favorite');
        expect(state.profiles[currentAccountKey].tags['1234'].notes).toBe('foo');
      },
      expectedQueue: [
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: 'favorite',
            notes: 'foo',
          },
        },
      ],
    },
    {
      name: 'setItemTag/setNote: can set both tag and note',
      actions: [
        setItemHashTag({ itemHash: 1234, tag: 'favorite' }),
        setItemHashNote({ itemHash: 1234, note: 'foo' }),
      ],
      checkState: (state) => {
        expect(state.itemHashTags[1234].tag).toBe('favorite');
        expect(state.itemHashTags[1234].notes).toBe('foo');
      },
      expectedQueue: [
        {
          action: 'item_hash_tag',
          payload: {
            hash: 1234,
            tag: 'favorite',
            notes: 'foo',
          },
        },
      ],
    },
    {
      name: 'searchUsed: can track valid queries',
      actions: [searchUsed({ query: '(is:masterwork) (is:weapon)', type: SearchType.Item })],
      checkState: (state) => {
        const search = state.searches[2][0];
        expect(search.query).toBe('is:masterwork is:weapon');
        expect(search.usageCount).toBe(1);
        expect(search.saved).toBe(false);
      },
      expectedQueue: [
        {
          action: 'search',
          payload: {
            query: 'is:masterwork is:weapon',
            type: SearchType.Item,
          },
        },
      ],
      noReverse: true,
    },
    {
      name: 'saveSearch: can save valid queries',
      setup: (state) => {
        state.searches[2] = [
          {
            usageCount: 1,
            lastUsage: 919191,
            saved: false,
            query: 'is:masterwork is:weapon',
            type: SearchType.Item,
          },
        ];
      },
      actions: [
        saveSearch({ query: '(is:masterwork) (is:weapon)', saved: true, type: SearchType.Item }),
      ],
      checkState: (state) => {
        const search = state.searches[2][0];
        expect(search.query).toBe('is:masterwork is:weapon');
        expect(search.saved).toBe(true);
      },
      expectedQueue: [
        {
          action: 'save_search',
          payload: {
            query: 'is:masterwork is:weapon',
            saved: true,
            type: SearchType.Item,
          },
        },
      ],
    },
    {
      name: 'saveSearch: can unsave valid queries',
      setup: (state) => {
        state.searches[2] = [
          {
            usageCount: 1,
            lastUsage: 919191,
            saved: true,
            query: 'is:masterwork is:weapon',
            type: SearchType.Item,
          },
        ];
      },
      actions: [
        saveSearch({ query: '(is:masterwork) (is:weapon)', saved: false, type: SearchType.Item }),
      ],
      checkState: (state) => {
        const search = state.searches[2][0];
        expect(search.query).toBe('is:masterwork is:weapon');
        expect(search.saved).toBe(false);
      },
      expectedQueue: [
        {
          action: 'save_search',
          payload: {
            query: 'is:masterwork is:weapon',
            saved: false,
            type: SearchType.Item,
          },
        },
      ],
    },
    {
      name: 'saveSearch: does not save invalid queries',
      actions: [saveSearch({ query: 'deepsight:incomplete', saved: true, type: SearchType.Item })],
      checkState: (state) => {
        expect(state.searches).toMatchObject({
          [1]: [],
          [2]: [],
        });
      },
      expectedQueue: [],
    },
    {
      name: 'saveSearch: can unsave previously saved invalid queries',
      setup: (state) => {
        state.searches[2] = [
          {
            usageCount: 1,
            lastUsage: 919191,
            saved: true,
            // This is invalid, but it might have been saved before we changed the rules
            query: 'deepsight:incomplete',
            type: SearchType.Item,
          },
        ];
      },
      actions: [saveSearch({ query: 'deepsight:incomplete', saved: false, type: SearchType.Item })],
      checkState: (state) => {
        // FIXME maybe delete this outright? It'll be cleaned up the next time DIM loads the remote profile anyway...
        const search = state.searches[2][0];
        expect(search.query).toBe('deepsight:incomplete');
        expect(search.saved).toBe(false);
      },
      expectedQueue: [
        {
          action: 'save_search',
          payload: {
            query: 'deepsight:incomplete',
            saved: false,
            type: SearchType.Item,
          },
        },
      ],
    },
    {
      name: 'deleteSearch: can delete previously saved invalid queries',
      setup: (state) => {
        state.searches[2] = [
          {
            usageCount: 1,
            lastUsage: 1000,
            saved: true,
            // This is invalid, but it might have been saved before we changed the rules
            query: 'deepsight:incomplete',
            type: SearchType.Item,
          },
        ];
      },
      actions: [searchDeleted({ query: 'deepsight:incomplete', type: SearchType.Item })],
      checkState: (state) => {
        // FIXME maybe delete this outright? It'll be cleaned up the next time DIM loads the remote profile anyway...
        expect(state.searches[2].length).toBe(0);
      },
      expectedQueue: [
        {
          action: 'delete_search',
          payload: {
            query: 'deepsight:incomplete',
            type: SearchType.Item,
          },
        },
      ],
    },
    {
      name: 'updateLoadout: can save a loadout',
      actions: [
        updateLoadout({
          id: '1234',
          name: 'before foo',
          classType: DestinyClass.Warlock,
          items: [],
          clearSpace: false,
        }),
      ],
      checkState: (state) => {
        expect(state.profiles[currentAccountKey].loadouts['1234'].name).toBe('before foo');
      },
      expectedQueue: [
        {
          action: 'loadout',
          payload: {
            id: '1234',
            name: 'before foo',
            classType: DestinyClass.Warlock,
            equipped: [],
            unequipped: [],
            clearSpace: false,
          },
        },
      ],
    },
    {
      name: 'updateLoadout: can update a loadout',
      setup: (state) => {
        state.profiles[currentAccountKey].loadouts['1234'] = {
          id: '1234',
          name: 'before foo',
          classType: DestinyClass.Warlock,
          equipped: [],
          unequipped: [],
          clearSpace: false,
        };
        return state;
      },
      actions: [
        updateLoadout({
          id: '1234',
          name: 'foo', // changed name
          classType: DestinyClass.Warlock,
          items: [],
          clearSpace: false,
        }),
      ],
      checkState: (state) => {
        expect(state.profiles[currentAccountKey].loadouts['1234'].name).toBe('foo');
      },
      expectedQueue: [
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
        },
      ],
    },
    {
      name: 'updateLoadout: can delete a loadout',
      setup: (state) => {
        state.profiles[currentAccountKey].loadouts['1234'] = {
          id: '1234',
          name: 'before foo',
          classType: DestinyClass.Warlock,
          equipped: [],
          unequipped: [],
          clearSpace: false,
        };
        return state;
      },
      actions: [deleteLoadout('1234')],
      checkState: (state) => {
        expect(state.profiles[currentAccountKey].loadouts['1234']).toBeUndefined();
      },
      expectedQueue: [
        {
          action: 'delete_loadout',
          payload: '1234',
        },
      ],
    },
  ];

  for (const {
    name,
    actions,
    checkState,
    expectedQueue = [],
    setup = identity,
    noReverse = false,
  } of cases) {
    it(name, () => {
      // Set up the state
      const setupState = produce(initialState, (draft) => {
        const profileKey = makeProfileKeyFromAccount(currentAccount);
        ensureProfile(draft, profileKey);
        setup(draft);
        draft.updateQueue = [];
        draft.updateInProgressWatermark = 0;
        return draft;
      });

      // Apply all the input actions and call prepareToFlushUpdates
      const updatedState = [...actions, prepareToFlushUpdates()].reduce((s, action) => {
        if (Array.isArray(action)) {
          return dimApi(s, action[0], action[1]);
        }
        return dimApi(s, action, currentAccount);
      }, setupState);

      // Run test-specific checks
      checkState(updatedState);

      expect(updatedState.updateQueue.length).toEqual(expectedQueue.length);
      let i = 0;
      for (const entry of updatedState.updateQueue) {
        const { action, payload } = entry;
        const { action: expectedAction, payload: expectedPayload } = expectedQueue[i];
        expect(action).toBe(expectedAction);
        if (typeof payload === 'string') {
          expect(payload).toBe(expectedPayload);
        } else {
          expect(payload).toMatchObject(expectedPayload);
        }
        i++;
      }

      // Fail all the updates in the queue and make sure they reverse back to the initial state
      const reversed = dimApi(
        updatedState,
        finishedUpdates(
          new Array<ProfileUpdateResult>(updatedState.updateInProgressWatermark).fill({
            status: 'Failed',
          }),
        ),
      );
      if (!noReverse) {
        expect(reversed).toEqual(setupState);
      }
    });
  }
});

describe('prepareToFlushUpdates', () => {
  const cases: {
    name: string;
    /**
     * Actions to run to set the initial state before our test actions. These
     * will be "flushed" already.
     */
    setupActions?: DimApiAction[];
    /**
     * A list of actions to run, followed by prepareToFlushUpdates. The tuple
     * option allows specifying a different account than `currentAccount`.
     */
    actions: (DimApiAction | [DimApiAction, DestinyAccount])[];
    /**
     * After prepareToFlushUpdates, the queue should look as if these actions
     * had been run (e.g. reordered, or with multiple updates consolidated).
     */
    expectedActions?: (DimApiAction | [DimApiAction, DestinyAccount])[];
    /**
     * The expected queue after prepareToFlushUpdates. Use this if you can't
     * express the queue state with expectedActions.
     */
    expectedQueue?: ProfileUpdateWithRollback[];
    /**
     * The expected inProgressWatermark value. If not set it defaults to
     * expectedQueue.length.
     */
    expectedInProgressWatermark?: number;
  }[] = [
    {
      name: 'can coalesce settings',
      actions: [
        // Turn new items on
        setSettingAction('showNewItems', true),
        // Modify another setting
        setSettingAction('itemSize', 35),
        // Turn new items back off
        setSettingAction('showNewItems', false),
      ],
      expectedActions: [
        // The showNewItems setting should cancel out
        setSettingAction('itemSize', 35),
      ],
    },
    {
      name: 'can handle multiple profile updates',
      actions: [
        // Turn new items on
        setSettingAction('showNewItems', true),
        // Save a tag for D2
        setItemTag({ itemId: '1234', tag: 'favorite' }),
        // Save a tag for D1, same profile
        [setItemTag({ itemId: '1231903', tag: 'keep' }), { ...currentAccount, destinyVersion: 1 }],
        // Save a tag for D2, same profile
        setItemTag({ itemId: '76543', tag: 'junk' }),
      ],
      expectedInProgressWatermark: 3, // Because the D1 tag is outside the queue
      expectedActions: [
        // Turn new items on
        setSettingAction('showNewItems', true),
        // Save a tag for D2
        setItemTag({ itemId: '1234', tag: 'favorite' }),
        // Save a tag for D2, same profile
        setItemTag({ itemId: '76543', tag: 'junk' }),
        // The D1 tag should be moved to the end
        [setItemTag({ itemId: '1231903', tag: 'keep' }), { ...currentAccount, destinyVersion: 1 }],
      ],
    },
    {
      name: 'can handle multiple profile updates with settings last',
      actions: [
        // Save a tag for D2
        setItemTag({ itemId: '1234', tag: 'favorite' }),
        // Save a tag for D2, same profile
        setItemTag({ itemId: '76543', tag: 'junk' }),
        // Turn new items on
        setSettingAction('showNewItems', true),
      ],
      // Exactly the same
      expectedActions: [
        setItemTag({ itemId: '1234', tag: 'favorite' }),
        setItemTag({ itemId: '76543', tag: 'junk' }),
        setSettingAction('showNewItems', true),
      ],
    },
    {
      name: 'can handle loadouts',
      setupActions: [
        updateLoadout({
          id: '1234',
          name: 'before foo',
          classType: DestinyClass.Warlock,
          items: [],
          clearSpace: false,
        }),
      ],
      actions: [
        updateLoadout({
          id: '1234',
          name: 'foo',
          classType: DestinyClass.Warlock,
          items: [],
          clearSpace: false,
        }),
        // Update the name
        updateLoadout({
          id: '1234',
          name: 'foobar',
          classType: DestinyClass.Warlock,
          items: [],
          clearSpace: false,
        }),
        deleteLoadout('1234'),
      ],
      expectedActions: [deleteLoadout('1234')],
    },
    {
      name: 'can handle setting both tags and notes',
      actions: [
        setItemTag({ itemId: '1234', tag: 'favorite' }),
        setItemNote({ itemId: '1234', note: 'woohoo' }),
        setItemTag({ itemId: '1234', tag: undefined }),
      ],
      expectedQueue: [
        // Tag and notes are coalesced into a single update
        {
          action: 'tag',
          payload: {
            id: '1234',
            tag: null,
            notes: 'woohoo',
            craftedDate: undefined,
          },
          before: {
            id: '1234',
            tag: null,
            notes: null,
          },
          platformMembershipId: currentAccount.membershipId,
          destinyVersion: 2,
        },
      ],
    },
  ];

  for (const {
    name,
    actions,
    expectedQueue = [],
    expectedActions = [],
    setupActions = [],
    expectedInProgressWatermark = expectedQueue.length + expectedActions.length,
  } of cases) {
    it(name, () => {
      // Apply the setup actions
      const setupState = [
        ...setupActions,
        prepareToFlushUpdates(),
        finishedUpdates(
          new Array<ProfileUpdateResult>(setupActions.length).fill({ status: 'Success' }),
        ),
      ].reduce((s, action) => dimApi(s, action, currentAccount), initialState);
      setupState.updateQueue = [];
      setupState.updateInProgressWatermark = 0;

      // Apply all the input actions, then prepareToFlushUpdates
      const updatedState = [...actions, prepareToFlushUpdates()].reduce((s, action) => {
        if (Array.isArray(action)) {
          return dimApi(s, action[0], action[1]);
        }
        return dimApi(s, action, currentAccount);
      }, setupState);
      expect(updatedState.updateInProgressWatermark).toBe(expectedInProgressWatermark);

      // Generate the expected queue
      const resolvedExpectedQueue = expectedQueue.length
        ? expectedQueue
        : expectedActions.reduce((s, action) => {
            if (Array.isArray(action)) {
              return dimApi(s, action[0], action[1]);
            }
            return dimApi(s, action, currentAccount);
          }, setupState).updateQueue;

      expect(updatedState.updateQueue).toEqual(resolvedExpectedQueue);
    });
  }
});

describe('finishedUpdates', () => {
  it('can mark success', () => {
    let state = dimApi(initialState, setSettingAction('showNewItems', true));
    state = dimApi(state, setItemTag({ itemId: '1234', tag: 'favorite' }), currentAccount);
    state = dimApi(state, prepareToFlushUpdates());

    const updatedState = dimApi(
      state,
      finishedUpdates([{ status: 'Success' }, { status: 'Success' }]),
    );

    expect(updatedState.updateInProgressWatermark).toBe(0);
    expect(updatedState.updateQueue).toEqual([]);
  });
});
