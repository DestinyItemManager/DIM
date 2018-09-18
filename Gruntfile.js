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

    'crowdin-request': {
        options: {
            'api-key': process.env.CROWDIN_API,
            'project-identifier': 'destiny-item-manager',
            filename: 'dim.json'
        },
        upload: {
            srcFile: 'src/locale/dim.json'
        },
        download: {
            outputDir: 'src/locale'
        }
    },

    sortJSON: {
      i18n: [
        'src/locale/dim.json',
        'src/locale/de/dim.json',
        'src/locale/es-ES/dim.json',
        'src/locale/fr/dim.json',
        'src/locale/it/dim.json',
        'src/locale/ja/dim.json',
        'src/locale/pt-BR/dim.json',
        'src/locale/es-MX/dim.json',
        'src/locale/ko/dim.json',
        'src/locale/pl/dim.json',
        'src/locale/ru/dim.json',
        'src/locale/zh-CN/dim.json',
        'src/locale/zh-TW/dim.json',
      ]
    }
  });

  grunt.loadNpmTasks('grunt-webstore-upload');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-rsync');
  grunt.loadNpmTasks('grunt-crowdin-request');
  grunt.loadNpmTasks('grunt-sort-json');

  function rewrite(dist) {
    var manifest = grunt.file.readJSON('extension-dist/manifest.json');
    if (dist === 'beta') {
      manifest.name = 'Destiny Item Manager Beta Shortcut';
    }

    grunt.file.write('extension-dist/manifest.json', JSON.stringify(manifest));
    var mainjs = grunt.file.read('extension-dist/main.js');
    mainjs = mainjs.replace('localhost:8080', `${dist}.destinyitemmanager.com`);
    grunt.file.write('extension-dist/main.js', mainjs);
  }

  grunt.registerTask('update_chrome_beta_manifest', function() {
    rewrite('beta');
  });

  grunt.registerTask('update_chrome_release_manifest', function() {
    rewrite('app');
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

        const brotli = process.env.BROTLI || 'brotli/brotli';
        const brotliArgs = [file];

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

  grunt.registerTask('lintJSON', [
    'sortJSON'
  ]);

  grunt.registerTask('download_translations', [
    'crowdin-request:download',
    'sortJSON:i18n'
  ]);

  grunt.registerTask('publish_beta_extension', [
    'update_chrome_beta_manifest',
    'compress:chrome',
    'log_beta_version',
    'webstore_upload:beta'
  ]);

  grunt.registerTask('publish_release_extension', [
    'update_chrome_release_manifest',
    'compress:chrome',
    'log_release_version',
    'webstore_upload:release'
  ]);

  grunt.registerTask('publish_beta', [
    'sortJSON:i18n',
    'crowdin-request:upload',
    'log_beta_version',
    'precompress',
    'rsync:beta',
    'rsync:website'
  ]);

  grunt.registerTask('publish_release', [
    'log_release_version',
    'precompress',
    'rsync:prod'
  ]);

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });

  grunt.registerTask('log_release_version', function() {
    grunt.log.ok("New production version is " + pkg.version);
  });
};
