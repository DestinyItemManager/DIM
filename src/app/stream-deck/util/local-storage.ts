export const streamDeckLocal = {
  identifier: () => localStorage.getItem('stream-deck-identifier') ?? '',
  enabled: () => localStorage.getItem('stream-deck-enabled') === 'true',
  sharedKey: () => localStorage.getItem('stream-deck-authorization') ?? '',

  setEnabled: (enabled: boolean) => localStorage.setItem('stream-deck-enabled', enabled.toString()),
  setIdentifier: (id: string) => localStorage.setItem('stream-deck-identifier', id),
  setSharedKey: (sharedKey: string) => localStorage.setItem('stream-deck-authorization', sharedKey),

  removeIdentifier: () => localStorage.removeItem('stream-deck-identifier'),
  removeSharedKey: () => localStorage.removeItem('stream-deck-authorization'),
};
