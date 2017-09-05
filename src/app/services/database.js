import _ from 'underscore';

import sqlWasmPath from 'file-loader?name=[name]-[hash:6].[ext]!sql.js/js/sql-wasm.js';
import sqlWasmBinaryPath from 'file-loader?name=[name]-[hash:6].[ext]!sql.js/js/sql-optimized-wasm-raw.wasm';

// Dynamic import splits up the sql library so the user only loads it
// if they need it. So we can minify sql.js specifically (as explained
// in the Webpack config, we need to explicitly name this chunk, which
// can only be done using the dynamic import method.
export const requireSqlLib = _.memoize(() => {
  function importAsmJs() {
    return import(/* webpackChunkName: "sqlLib" */ 'sql.js');
  }

  if ($featureFlags.wasm && typeof WebAssembly === 'object') {
    return new Promise((resolve, reject) => {
      let loaded = false;

      window.Module = {
        wasmBinaryFile: sqlWasmBinaryPath
      };
      window.SQL = {
        onRuntimeInitialized: function() {
          if (!loaded) {
            console.info("Using WASM SQLite");
            loaded = true;
            resolve(window.SQL);
            delete window.SQL;
          }
        }
      };

      // Give it 10 seconds to load
      setTimeout(() => {
        if (!loaded) {
          loaded = true;

          // Fall back to the old one
          importAsmJs.then(resolve, reject);
        }
      }, 10000);

      const head = document.getElementsByTagName('head')[0];
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = sqlWasmPath;
      script.async = true;
      head.appendChild(script);
    });
  } else {
    return importAsmJs();
  }
});