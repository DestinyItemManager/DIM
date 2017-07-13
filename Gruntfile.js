const child_process = require("child_process");
const fs = require("fs");

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  var betaVersion = pkg.version.toString() + "." + process.env.TRAVIS_BUILD_NUMBER;

  grunt.initConfig({
    pkg: pkg,

    compress: {
      // Zip up the extension
      chrome: {
        options: {
          archive: 'extension-dist/chrome.zip'
        },
        files: [{
          expand: true,
          cwd: 'extension-dist',
          src: [
            '**',
            '!data',
            '!chrome.zip',
            '!.htaccess',
            '!stats.html',
            'README.md'
          ],
          dest: '/',
          filter: 'isFile'
        }, ]
      }
    },

    // See https://github.com/c301/grunt-webstore-upload
    webstore_upload: {
      accounts: {
        // This is set up by environment variables from Travis. To
        // push locally, create a file with these variables defined
        // and source it before running "grunt publish:beta". E.g.:
        //
        // ./beta_credentials:
        //
        // export CHROME_CLIENT_ID="foo"
        // export CHROME_SECRET="bar"
        // export CHROME_REFRESH_TOKEN="baz"
        //
        // Then run "source ./beta_credentials; grunt publish_chrome_beta"
        //
        // To set up these variables to be available in Travis:
        // travis encrypt CHROME_CLIENT_ID=super_secret --add env.matrix
        // travis encrypt CHROME_SECRET=super_secret --add env.matrix
        // travis encrypt CHROME_REFRESH_TOKEN=super_secret --add env.matrix
        default: { //account under this section will be used by default
          publish: true, //publish item right after uploading. default false
          client_id: process.env.CHROME_CLIENT_ID,
          client_secret: process.env.CHROME_SECRET,
          refresh_token: process.env.CHROME_REFRESH_TOKEN
        }
      },
      extensions: {
        release: {
          appID: "apghicjnekejhfancbkahkhdckhdagna",
          zip: "extension-dist/chrome.zip"
        },
        beta: {
          appID: "mkiipknpfaacbjdagdeppdacpgpdjklc",
          zip: "extension-dist/chrome.zip"
        }
      }
    },

    // Tasks for uploading the website versions
    rsync: {
      options: {
        //dryRun: true,
        args: ["--verbose"],
        exclude: ["chrome.zip", "stats.html"],
        host: process.env.REMOTE_HOST,
        port: 2222,
        recursive: true,
        deleteAll: true,
        ssh: true,
        privateKey: 'config/dim_travis.rsa',
        sshCmdArgs: ["-o StrictHostKeyChecking=no"]
      },
      beta: {
        options: {
          src: "dist/",
          dest: process.env.REMOTE_PATH + "beta"
        }
      },
      prod: {
        options: {
          src: "dist/",
          dest: process.env.REMOTE_PATH + "prod"
        }
      },
      website: {
        options: {
          src: "destinyitemmanager.com/",
          dest: "public_html/destinyitemmanager.com"
        }
      }
    },

    precompress: {
      web: {
        src: "dist/**/*.{js,html,css,json,map,ttf,eot,svg,wasm}"
      }
    },

    poeditor: {
      download_terms: {
        download: {
          project_id: '116191',
          type: 'key_value_json', // export type (check out the doc)
          filters: ["translated", "proofread", "not_fuzzy"], // https://poeditor.com/api_reference/#export
          dest: 'src/i18n/dim_?.json',
          languages: {
            'de': 'de',
            'es': 'es',
            'fr': 'fr',
            'it': 'it',
            'ja': 'ja',
            'pt-BR': 'pt_BR'
          }
        }
      },
      options: {
        api_token: process.env.POEDITOR_API
      }
    },

    upload_file: {
      poeditor: {
        src: ['src/i18n/dim_en.json'],
        options: {
          url: 'https://poeditor.com/api/',
          method: 'POST',
          paramObj: {
            api_token: process.env.POEDITOR_API,
            action: 'upload',
            id: '116191',
            updating: 'terms_definitions',
            language: 'en',
            overwrite: 1,  // overwrite old strings
            // This must be set to 0 otherwise gender contexts will be deleted from other languages,
            // so deletion of terms must happen both in the dim_en.json and at POEditor manually.
            sync_terms: 0,  // delete non-matched keys
            fuzzy_trigger: 1  // set updated keys to fuzzy on other langs, so translators know to re-translate string
          },
        }
      }
    },

    sortJSON: {
      src: [
        'src/i18n/dim_de.json',
        'src/i18n/dim_en.json',
        'src/i18n/dim_es.json',
        'src/i18n/dim_fr.json',
        'src/i18n/dim_it.json',
        'src/i18n/dim_ja.json',
        'src/i18n/dim_pt_BR.json',
      ],
    }
  });

  grunt.loadNpmTasks('grunt-webstore-upload');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-rsync');
  grunt.loadNpmTasks('grunt-poeditor-ab');
  grunt.loadNpmTasks('grunt-sort-json');
  grunt.loadNpmTasks('grunt-upload-file');

  grunt.registerTask('update_chrome_beta_manifest', function() {
    var manifest = grunt.file.readJSON('extension-dist/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    manifest.content_scripts[0].matches = ['https://beta.destinyitemmanager.com/*'];
    grunt.file.write('extension-dist/manifest.json', JSON.stringify(manifest));
    var mainjs = grunt.file.read('extension-dist/main.js');
    mainjs = mainjs.replace('app.destinyitemmanager.com', 'beta.destinyitemmanager.com');
    grunt.file.write('extension-dist/main.js', mainjs);
  });

  grunt.registerTask('update_chrome_release_manifest', function() {
    var manifest = grunt.file.readJSON('extension-dist/manifest.json');
    manifest.version = pkg.version;
    grunt.file.write('extension-dist/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerMultiTask(
    'precompress',
    'Create gzip and brotli versions of web assets',
    function() {
      const done = this.async();
      const promises = [];
      this.filesSrc.forEach(function(file) {
        promises.push(new Promise(function(resolve, reject) {
          child_process.exec("gzip -c --no-name " + file + " > " + file + ".gz", function(error, stdout, stderr) {
            if (error) {
              grunt.log.writeln("gzip " + file + " => error: " + stdout + stderr);
              reject(error);
            } else {
              grunt.log.writeln("gzip " + file + " => success");
              resolve();
            }
          });
        }));

        let brotli;
        let brotliArgs;

        if (process.env.BROTLI) {
          brotli = process.env.BROTLI;
          brotliArgs = ["--quality", "9", "--input", file, "--output", file + ".br"];
        } else {
          brotli = 'brotli/brotli';
          brotliArgs = [file];
        }

        promises.push(new Promise(function(resolve, reject) {
          child_process.execFile(brotli, brotliArgs, function(error, stdout, stderr) {
            if (error) {
              grunt.log.writeln("brotli " + file + " => error: " + stdout + stderr);
              reject(error);
            } else {
              grunt.log.writeln("brotli " + file + " => success");
              resolve();
            }
          });
        }).then(function() {
          return new Promise(function(resolve, reject) {
            fs.chmod(file + ".br", 0644, resolve);
          });
        }));
      });

      Promise.all(promises).then(done);
    }
  );

  grunt.registerTask('download_translations', [
    'poeditor:download_terms:download',
    'sortJSON'
  ]);

  grunt.registerTask('publish_beta', [
    'upload_file:poeditor',
    'update_chrome_beta_manifest',
    'compress:chrome',
    'log_beta_version',
    'webstore_upload:beta',
    'precompress',
    'rsync:beta',
    'rsync:website',
  ]);

  grunt.registerTask('publish_release', [
    'update_chrome_release_manifest',
    'compress:chrome',
    'log_release_version',
    'precompress',
    'rsync:prod',
    'webstore_upload:release'
  ]);

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });

  grunt.registerTask('log_release_version', function() {
    grunt.log.ok("New production version is " + pkg.version);
  });
};
