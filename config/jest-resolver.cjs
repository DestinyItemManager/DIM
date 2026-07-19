const fs = require('node:fs');

// Some packages (e.g. @react-hook/*) point their "browser"/"module" export
// conditions at files with ESM syntax in `.js` files, in packages without
// "type": "module". Jest classifies those as CJS and cjs-module-lexer chokes
// on their import/export statements. When such a file has a real ESM (.mjs)
// sibling build, resolve to that instead.
module.exports = function resolver(request, options) {
  const resolved = options.defaultResolver(request, options);
  if (resolved.endsWith('/dist/module/index.js')) {
    const esm = `${resolved.slice(0, -'/dist/module/index.js'.length)}/dist/esm/index.mjs`;
    if (fs.existsSync(esm)) {
      return esm;
    }
  }
  return resolved;
};
