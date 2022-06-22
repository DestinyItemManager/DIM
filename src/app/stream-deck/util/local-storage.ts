// Local storage Stream Deck preferences

// Get Functions

export const clientIdentifier = () => localStorage.getItem('stream-deck-identifier') ?? '';

export const streamDeckEnabled = () => localStorage.getItem('stream-deck-enabled') === 'true';

export const streamDeckSharedKey = () => localStorage.getItem('stream-deck-authorization') ?? '';

// Set  Functions

export const setStreamDeckSharedKey = (sharedKey: string) =>
  localStorage.setItem('stream-deck-authorization', sharedKey);

export const setStreamDeckEnabled = (enabled: boolean) =>
  localStorage.setItem('stream-deck-enabled', enabled.toString());

export const setClientIdentifier = (id: string) =>
  localStorage.setItem('stream-deck-identifier', id);

// Remove Functions

export const removeClientIdentifier = () => localStorage.removeItem('stream-deck-identifier');

export const removeStreamDeckSharedKey = () => localStorage.removeItem('stream-deck-authorization');
