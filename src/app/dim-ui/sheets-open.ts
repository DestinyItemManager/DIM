/**
 * The total number of sheets that are open. Used by the sneaky updates code to
 * determine if the user is in the middle of something.
 *
 * This is in a separate file from Sheet.tsx to avoid pulling in dependencies to
 * tests.
 */
export const sheetsOpen = {
  open: 0,
};
