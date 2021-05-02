export let readyResolve: (value?: unknown) => void;
/** this promise is resolved when the initial big load of DIM API data is completed */
export const settingsReady = new Promise((resolve) => (readyResolve = resolve));
