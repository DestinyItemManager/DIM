// Putting this comparison in a function defeats a constant-folding optimization
function compareFn(a, b) {
  return a === b;
}

export const compare = compareFn;

export default { compare };
