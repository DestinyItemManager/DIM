module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  var betaVersion = pkg.version.toString() + "." + process.env.TRAVIS_BUILD_NUMBER;

  grunt.initConfig({
    pkg: pkg,
    uglify: {
      my_target: {
        files: {
          'dist/sripts/vendor.min.js': ['src/input1.js', 'src/input2.js'],
          'dist/sripts/app.min.js': ['src/input1.js', 'src/input2.js']
        }
      }
    },

    compress: {
      // Zip up the extension
      chrome: {
        options: {
          archive: 'dist/chrome.zip'
        },
        files: [{
          expand: true,
          cwd: 'dist',
          src: [
            '**',
            '!chrome.zip'
          ],
          dest: '/',
          filter: 'isFile'
        }, ]
      }
    },

    // Clean out generated extension files
    clean: ['dist'],

    replace: {
      // Replace all instances of $DIM_VERSION with the version number from package.json
      main_version: {
        src: [
          'dist/**/*.{json,html,js}',
        ],
        overwrite: true,
        replacements: [{
          from: '$DIM_VERSION',
          to: pkg.version.toString()
        }, {
          from: '$DIM_CHANGELOG',
          to: 'https://github.com/DestinyItemManager/DIM/blob/master/CHANGELOG.md'
        }]
      },
      // Replace all instances of $DIM_VERSION or the current version number (from package.json)
      // with a beta version based on the current time.
      beta_version: {
        src: [
          'dist/**/*.{json,html,js}',
        ],
        overwrite: true,
        replacements: [{
          from: pkg.version.toString(),
          to: betaVersion
        }, {
          from: '$DIM_VERSION',
          to: betaVersion
        }, {
          from: '$DIM_CHANGELOG',
          to: 'https://github.com/DestinyItemManager/DIM/blob/dev/CHANGELOG.md#next'
        }]
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
        DIM: {
          appID: "apghicjnekejhfancbkahkhdckhdagna",
          publish: false,
          zip: "dist/chrome.zip"
        },
        beta: {
          appID: "mkiipknpfaacbjdagdeppdacpgpdjklc",
          zip: "dist/chrome.zip"
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-webstore-upload');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-sync');

  grunt.registerTask('update_chrome_beta_manifest', function() {
    var manifest = grunt.file.readJSON('dist/chrome/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    grunt.file.write('dist/extension/chrome/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerTask('publish_chrome_beta', [
    'replace:beta_version',
    'compress:chrome',
    'webstore_upload:beta',
    'log_beta_version'
  ]);

  // Aliases for local dev to mirror README examples
  grunt.registerTask('dev-chrome', ['default']);


  // Builds release-able extensions in dist/
  grunt.registerTask('build_extension', [
    'replace:main_version',
    'compress:chrome',
  ]);

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });
}
