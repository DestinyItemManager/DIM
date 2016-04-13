module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var betaVersion = pkg.version.toString() + "." + (Math.floor(Date.now() / 60000) - 24298773);
  var firefoxBrowserSupport = {
    "gecko": {
      "id": "firefox@destinyitemmanager.com",
      "strict_min_version": "46.*"
    }
  };

  grunt.initConfig({
    pkg: pkg,

    copy: {
      // Copy all files to a staging directory
      chrome: {
        cwd: 'app/',
        src: '**',
        dest: 'build/extension/chrome',
        expand: true
      },

      firefox: {
        cwd: 'app/',
        src: '**',
        dest: 'build/extension/firefox',
        expand: true
      },

      beta_icons_firefox: {
        cwd: 'beta-icons/',
        src: '**',
        dest: 'build/extension/firefox/',
        expand: true
      },

      beta_icons_chrome: {
        cwd: 'beta-icons/',
        src: '**',
        dest: 'build/extension/chrome/',
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
          cwd: 'build/extension/firefox',
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
          cwd: 'build/extension/chrome',
          src: ['**'],
          dest: '/',
          filter: 'isFile'
        }, ]
      }
    },

    // Clean out generated extension files
    clean: ["build/extension", "build/dim-extension.zip"],

    replace: {
      // Replace all instances of the current version number (from package.json)
      // with a beta version based on the current time.
      beta_version_chrome: {
        src: ['build/extension/chrome*.{json,html,js}'],
        overwrite: true,
        replacements: [{
          from: pkg.version.toString(),
          to: betaVersion
        }]
      },
      beta_version_firefox: {
        src: ['build/extension/firefox/*.{json,html,js}'],
        overwrite: true,
        replacements: [{
          from: pkg.version.toString(),
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
      scripts: {
        files: ['app/scss/*.scss'],
        tasks: ['css']
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

  grunt.registerTask('css', ['sass', 'postcss']);

  grunt.registerTask('dev-firefox', ['css',
    'update_firefox_manifest',
    'watch'
  ]);

  grunt.registerTask('dev-chrome', ['css',
    'update_chrome_manifest',
    'watch'
  ]);

  grunt.registerTask('update_chrome_manifest', function() {
    var manifest = grunt.file.readJSON('app/manifest.json');
    if (manifest.applications) {
      delete manifest.applications;
    }
    grunt.file.write('app/manifest.json', JSON.stringify(manifest, null, '\t'));
  });

  grunt.registerTask('update_firefox_manifest', function() {
    var manifest = grunt.file.readJSON('app/manifest.json');
    manifest.applications = firefoxBrowserSupport;
    grunt.file.write('app/manifest.json', JSON.stringify(manifest, null, '\t'));
  });

  grunt.registerTask('update_chrome_beta_manifest', function() {
    var manifest = grunt.file.readJSON('build/extension/chrome/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    grunt.file.write('build/extension/chrome/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerTask('update_firefox_beta_manifest', function() {
    var manifest = grunt.file.readJSON('build/extension/firefox/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    grunt.file.write('build/extension/firefox/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerTask('publish_chrome_beta', [
    'update_chrome_manifest',
    'copy:chrome',
    'copy:beta_icons_chrome',
    'replace:beta_version_chrome',
    'compress',
    'webstore_upload:beta'
  ]);

  grunt.registerTask('publish_firefox_beta', [
    'update_firefox_manifest',
    'copy:firefox',
    'copy:beta_icons_firefox',
    'replace:beta_version_firefox'
  ]);

  // Builds a release-able extension in build/dim-extension.zip
  grunt.registerTask('build_extension', ['clean',
    'css',
    'update_firefox_beta',
    'copy:firefox',
    'update_chrome_beta',
    'copy:chrome',
    'compress:firefox',
    'compress:chrome',

  ]);

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });
