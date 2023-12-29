export const streamDeckEnabled = () => localStorage.getItem('stream-deck-enabled') === 'true';

export const setStreamDeckEnabled = (enabled: boolean) => {
  localStorage.setItem('stream-deck-enabled', enabled.toString());
  document.dispatchEvent(new Event('local-storage-update'));
};
