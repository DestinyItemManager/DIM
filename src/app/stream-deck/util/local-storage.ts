// Local storage Stream Deck preferences

// Get Functions

export const clientIdentifier = () => localStorage.getItem('stream-deck-identifier') ?? '';

export const streamDeckEnabled = () => localStorage.getItem('stream-deck-enabled') === 'true';

export const streamDeckToken = () => localStorage.getItem('stream-deck-authorization') ?? '';

export const streamDeckFlowVersion = () => localStorage.getItem('stream-deck-flow-version') ?? 1;

// Set  Functions

export const setClientIdentifier = (id: string) =>
  localStorage.setItem('stream-deck-identifier', id);

export const setStreamDeckEnabled = (enabled: boolean) =>
  localStorage.setItem('stream-deck-enabled', enabled.toString());

export const setStreamDeckToken = (sharedKey: string) =>
  localStorage.setItem('stream-deck-authorization', sharedKey);

export const setStreamDeckFlowVersion = (version: number) =>
  localStorage.setItem('stream-deck-flow-version', version.toString());

// Remove Functions

export const removeClientIdentifier = () => localStorage.removeItem('stream-deck-identifier');

export const removeStreamDeckToken = () => localStorage.removeItem('stream-deck-authorization');
