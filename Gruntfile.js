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
    sync: {
      chrome: {
        files: [{
          cwd: 'app/',
          src: [
            '**',
            '!vendor/angular/angular.js',
            '!vendor/sql.js/c/**/*',
            '!vendor/sql.js/js/sql-memory-growth.js',
            '!vendor/sql.js/js/sql-debug.js'
          ],
          dest: 'dist/chrome'
        }]
      },
    },

    copy: {
      // Copy all files to a staging directory
      beta_icons_chrome: {
        cwd: 'icons/beta/',
        src: '**',
        dest: 'dist/chrome/',
        expand: true
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
          cwd: 'dist/chrome',
          src: ['**'],
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
          '!dist/**/vendor/**/*'
        ],
        overwrite: true,
        replacements: [{
          from: '$DIM_VERSION',
          to: pkg.version.toString()
        }, {
          from: '$DIM_FLAVOR',
          to: 'release'
        }, {
          from: '$DIM_CHANGELOG',
          to: 'https://github.com/DestinyItemManager/DIM/blob/master/CHANGELOG.md'
        }, {
          from: '$DIM_API_KEY',
          to: process.env.API_KEY
        }, {
          from: '$DIM_AUTH_URL',
          to: process.env.AUTH_URL
        }]
      },
      // Replace all instances of $DIM_VERSION or the current version number (from package.json)
      // with a beta version based on the current time.
      beta_version: {
        src: [
          'dist/**/*.{json,html,js}',
          '!dist/**/vendor/**/*'
        ],
        overwrite: true,
        replacements: [{
          from: pkg.version.toString(),
          to: betaVersion
        }, {
          from: '$DIM_VERSION',
          to: betaVersion
        }, {
          from: '$DIM_FLAVOR',
          to: 'beta'
        }, {
          from: '$DIM_CHANGELOG',
          to: 'https://github.com/DestinyItemManager/DIM/blob/dev/CHANGELOG.md#next'
        }, {
          from: '$DIM_API_KEY',
          to: process.env.API_KEY
        }, {
          from: '$DIM_AUTH_URL',
          to: process.env.AUTH_URL
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
      sass: {
        files:['app/scss/**/*.scss'],
        tasks:['css','sync'],
        options: { spawn: false }
      },
      dist: {
        files: ['app/**/*.{js,html}'],
        tasks: ['sync']
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

    eslint: {
      target: ["app/scripts/**/*.js"],
      options: {
        fix: true
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
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('css', ['sass', 'postcss']);

  grunt.registerTask('default', ['eslint', 'build', 'watch']);

  grunt.registerTask('build', ['clean','css', 'sync']);

  grunt.registerTask('update_chrome_beta_manifest', function() {
    var manifest = grunt.file.readJSON('dist/chrome/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    grunt.file.write('dist/extension/chrome/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerTask('publish_chrome_beta', [
    'build',
    'copy:beta_icons_chrome',
    'replace:beta_version',
    'compress:chrome',
    'webstore_upload:beta',
    'log_beta_version'
  ]);

  // Aliases for local dev to mirror README examples
  grunt.registerTask('dev-chrome', ['default']);


  // Builds release-able extensions in dist/
  grunt.registerTask('build_extension', [
    'build',
    'replace:main_version',
    'compress:chrome',
  ]);

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });
}
