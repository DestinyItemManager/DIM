export const STREAM_DECK_MINIMUM_VERSION = '3.1.0';

const [minMajor, minMinor, minPatch] = STREAM_DECK_MINIMUM_VERSION.split('.');

export const checkStreamDeckVersion = (version: string | undefined) => {
  if (!version) {
    return false;
  }
  const [major, minor, patch] = version.split('.');
  if (major < minMajor) {
    return false;
  }
  if (minor < minMinor) {
    return false;
  }
  return patch >= minPatch;
};
