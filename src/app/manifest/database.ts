import * as _ from 'lodash';

import sqlWasmPath from 'file-loader?name=[name]-[hash:6].[ext]!sql.js/js/sql-wasm.js';
import sqlWasmBinaryPath from 'file-loader?name=[name]-[hash:6].[ext]!sql.js/js/sql-optimized-wasm-raw.wasm';

declare global {
  interface Window {
    SQL: any;
    Module: any;
  }
}

declare const WebAssembly: any;

// Dynamic import splits up the sql library so the user only loads it
// if they need it. So we can minify sql.js specifically (as explained
// in the Webpack config, we need to explicitly name this chunk, which
// can only be done using the dynamic import method.
export const requireSqlLib = _.once(() => {
  function importAsmJs() {
    delete window.Module;
    delete window.SQL;
    console.log('Using asm.js SQLite');
    return import(/* webpackChunkName: "sqlLib" */ 'sql.js');
  }

  if ($featureFlags.wasm && typeof WebAssembly === 'object') {
    return new Promise((resolve, reject) => {
      let loaded = false;

      window.Module = {
        locateFile() {
          return sqlWasmBinaryPath;
        }
      };
      window.SQL = {
        onRuntimeInitialized() {
          if (!loaded) {
            loaded = true;

            try {
              // Do a self-test
              const db = new window.SQL.Database();
              db.run('CREATE TABLE hello (a int, b char);');
              db.run("INSERT INTO hello VALUES (0, 'hello');");
              db.exec('SELECT * FROM hello');
            } catch (e) {
              console.error('Failed to load WASM SQLite, falling back', e);
              importAsmJs().then(resolve, reject);
              return;
            }

            console.info('Using WASM SQLite');
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
          importAsmJs().then(resolve, reject);
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
