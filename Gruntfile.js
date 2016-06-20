module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var betaVersion = pkg.version.toString() + "." + process.env.TRAVIS_BUILD_NUMBER;
  var firefoxBrowserSupport = {
    "gecko": {
      "id": "firefox@destinyitemmanager.com",
      "strict_min_version": "46.*"
    }
  };

  grunt.initConfig({
    pkg: pkg,

    sync: {
      chrome: {
        files: [{
          cwd: 'app/',
          src: [
            '**'
          ],
          dest: 'dist/chrome',
        }]
      },
      firefox: {
        files: [{
          cwd: 'app/',
          src: [
            '**'
          ],
          dest: 'dist/firefox',
        }]
      },
    },

    copy: {
      // Copy all files to a staging directory
      beta_icons_firefox: {
        cwd: 'icons/beta/',
        src: '**',
        dest: 'dist/firefox/',
        expand: true
      },
      beta_icons_chrome: {
        cwd: 'icons/beta/',
        src: '**',
        dest: 'dist/chrome/',
        expand: true
      }
    },

    compress: {
      // Zip up the extension
      firefox: {
        options: {
          archive: 'build/firefox.zip'
        },
        files: [{
          expand: true,
          cwd: 'dist/firefox',
          src: ['**'],
          dest: '/',
          filter: 'isFile'
        }, ]
      },
      // Zip up the extension
      chrome: {
        options: {
          archive: 'build/chrome.zip'
        },
        files: [{
          expand: true,
          cwd: 'dist/chrome',
          src: ['**'],
          dest: '/',
          filter: 'isFile'
        }, ]
      }
    },

    // Clean out generated extension files
    clean: ["build/extension", "build/dim-extension.zip", 'dist'],

    replace: {
      // Replace all instances of $DIM_VERSION with the version number from package.json
      main_version: {
        src: ['dist/chrome*.{json,html,js}'],
        overwrite: true,
        replacements: [{
          from: '$DIM_VERSION',
          to: pkg.version.toString()
        }]
      },
      // Replace all instances of $DIM_VERSION or the current version number (from package.json)
      // with a beta version based on the current time.
      beta_version_chrome: {
        src: ['dist/chrome*.{json,html,js}'],
        overwrite: true,
        replacements: [{
          from: pkg.version.toString(),
          to: betaVersion
        }, {
          from: '$DIM_VERSION',
          to: betaVersion
        }]
      },
      beta_version_firefox: {
        src: ['dist/firefox/*.{json,html,js}'],
        overwrite: true,
        replacements: [{
          from: pkg.version.toString(),
          to: betaVersion
        }, {
          from: '$DIM_VERSION',
          to: betaVersion
        }]
      }
    },

    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'app/styles/main.css': 'app/scss/main.scss'
        }
      }
    },

    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')()
        ]
      },
      dist: {
        src: 'app/styles/main.css',
        dest: 'app/styles/main.css'
      }
    },

    watch: {
      app: {
        files: ['app/**.*'],
        tasks: ['sync']
      }
    },

    // See https://github.com/c301/grunt-webstore-upload
    webstore_upload: {
      "accounts": {
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
        // Then run "source ./beta_credentials; grunt publish-beta"
        //
        // To set up these variables to be available in Travis:
        // travis encrypt CHROME_CLIENT_ID=super_secret --add env.matrix
        // travis encrypt CHROME_SECRET=super_secret --add env.matrix
        // travis encrypt CHROME_REFRESH_TOKEN=super_secret --add env.matrix
        "default": { //account under this section will be used by default
          publish: true, //publish item right after uploading. default false
          client_id: process.env.CHROME_CLIENT_ID,
          client_secret: process.env.CHROME_SECRET,
          refresh_token: process.env.CHROME_REFRESH_TOKEN
        }
      },
      "extensions": {
        "beta": {
          //required
          appID: "mkiipknpfaacbjdagdeppdacpgpdjklc",
          publish: true,
          //required, we can use dir name and upload most recent zip file
          zip: "build/dim-extension.zip"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-webstore-upload');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sync');

  grunt.registerTask('css', ['sass', 'postcss']);

  grunt.registerTask('default', ['build','watch']);

  grunt.registerTask('build', ['clean','css', 'sync', 'update_firefox_manifest']);

  grunt.registerTask('update_firefox_manifest', function() {
    var manifest = grunt.file.readJSON('dist/firefox/manifest.json');
    manifest.applications = firefoxBrowserSupport;
    grunt.file.write('dist/firefox/manifest.json', JSON.stringify(manifest, null, '\t'));
  });

  grunt.registerTask('update_chrome_beta_manifest', function() {
    var manifest = grunt.file.readJSON('dist/chrome/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    grunt.file.write('dist/extension/chrome/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerTask('update_firefox_beta_manifest', function() {
    var manifest = grunt.file.readJSON('dist/extension/firefox/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    grunt.file.write('dist/extension/firefox/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerTask('publish_chrome_beta', [
    'build',
    'copy:beta_icons_chrome',
    'replace:beta_version_chrome',
    'compress:chrome',
    'webstore_upload:beta'
  ]);

  grunt.registerTask('publish_firefox_beta', [
    'build',
    'copy:beta_icons_firefox',
    'replace:beta_version_firefox',
    'compress:firefox'
  ]);

  // Builds a release-able extension in build/dim-extension.zip
  grunt.registerTask('build_extension', [
    'build',
    'replace:main_version',
    'compress:chrome'
  ]);

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });
}
