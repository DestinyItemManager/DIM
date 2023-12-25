// Local storage Stream Deck preferences

// Get Functions

interface StreamDeckAuth {
  instance: string;
  token: string;
}

export const streamDeckEnabled = () => localStorage.getItem('stream-deck-enabled') === 'true';

export const streamDeckAuth = () => {
  const auth = localStorage.getItem('stream-deck-auth') ?? '';
  return auth ? (JSON.parse(auth) as StreamDeckAuth) : undefined;
};

// Set  Functions

export const setStreamDeckEnabled = (enabled: boolean) =>
  localStorage.setItem('stream-deck-enabled', enabled.toString());

export const setStreamDeckAuth = (auth: StreamDeckAuth) =>
  localStorage.setItem('stream-deck-auth', JSON.stringify(auth));
