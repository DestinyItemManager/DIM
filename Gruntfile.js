module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var betaVersion = pkg.version.toString() + "." + (Math.floor(Date.now() / 60000) - 24365210);

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.initConfig({
    pkg: pkg,

    copy: {
      // Copy all files to a staging directory
      main: {
        cwd: 'app/',
        src: '**',
        dest: 'build/extension/',
        expand: true
      },
      beta_icons: {
        cwd: 'beta-icons/',
        src: '**',
        dest: 'build/extension/',
        expand: true
      }
    },

    compress: {
      // Zip up the extension
      main: {
        options: {
          archive: 'build/dim-extension.zip'
        },
        files: [
          { expand: true, cwd: 'build/extension/', src: ['**'], dest: '/', filter: 'isFile'},
        ]
      }
    },

    // Clean out generated extension files
    clean: ["build/extension", "build/dim-extension.zip"],

    replace: {
      // Replace all instances of the current version number (from package.json)
      // with a beta version based on the current time.
      beta_version: {
        src: ['build/extension/*.{json,html,js}'],
        overwrite: true,
        replacements: [{
          from: pkg.version.toString(),
          to: betaVersion
        }]
      }
    },
    uglify: {
      it: {
        options: {
          mangle: false
        },
        files: {
          'app/scripts/vendor.min.js': [
            'app/vendor/jquery/dist/jquery.min.js',
            'app/vendor/angular/angular.min.js',
            'app/vendor/angular-ui-router/release/angular-ui-router.min.js',
            'app/vendor/angular-animate/angular-animate.min.js',
            'app/vendor/angular-aria/angular-aria.min.js',
            'app/vendor/angular-native-dragdrop/draganddrop.js',
            'app/vendor/ngDialog/js/ngDialog.min.js',
            'app/vendor/Angular.uuid2/dist/angular-uuid2.min.js',
            'app/vendor/underscore/underscore-min.js',
            'app/vendor/lz-string/libs/lz-string.min.js',
            'app/vendor/angular-chrome-storage/angular-chrome-storage.js',
            'app/vendor/angular-messages/angular-messages.min.js',
            'app/vendor/angular-promise-tracker/promise-tracker.js',
            'app/vendor/jquery-textcomplete/dist/jquery.textcomplete.js',
            'app/vendor/angularjs-slider/dist/rzslider.js',
            'app/vendor/angular-chrome-storage/angular-chrome-storage.js',
            'app/vendor/angular-hotkeys/build/hotkeys.js'
          ],
          'app/scripts/dim.min.js': [
            'app/scripts/toaster.js',
            'app/scripts/jquery-ui.position.js',
            'app/scripts/ScrollToFixed.js',
            'app/scripts/util.js',
//            'app/scripts/dimApp.module.js',
//            'app/scripts/dimApp.config.js',
            'app/scripts/services/dimRateLimit.factory.js',
            'app/scripts/services/dimActionQueue.factory.js',
            'app/scripts/services/dimBungieService.factory.js',
            'app/scripts/services/dimDefinitions.factory.js',
            'app/scripts/services/dimInfoService.factory.js',
            'app/scripts/services/dimPlatformService.factory.js',
            'app/scripts/services/dimLoadoutService.factory.js',
            'app/scripts/services/dimSettingsService.factory.js',
            'app/scripts/services/dimStoreService.factory.js',
            'app/scripts/services/dimXurService.factory.js',
            'app/scripts/services/dimItemService.factory.js',
            'app/scripts/services/dimEngramFarmingService.factory.js',
            'app/scripts/loadout/dimLoadout.directive.js',
            'app/scripts/loadout/dimLoadoutPopup.directive.js',
//            'app/scripts/shell/dimAppCtrl.controller.js',
            'app/scripts/shell/dimSettingsCtrl.controller.js',
//            'app/scripts/shell/dimPlatformChoice.directive.js',
//            'app/scripts/shell/dimSearchFilter.directive.js',
            'app/scripts/shell/dimClickAnywhereButHere.directive.js',
            'app/scripts/store/dimBungieImageFallback.directive.js',
//            'app/scripts/store/dimStores.directive.js',
//            'app/scripts/store/dimStoreItems.directive.js',
            'app/scripts/store/dimStoreItem.directive.js',
//            'app/scripts/store/dimStoreHeading.directive.js',
            'app/scripts/store/dimSimpleItem.directive.js',
            'app/scripts/store/dimStats.directive.js',
//            'app/scripts/store/dimEngramFarming.directive.js',
            'app/scripts/move-popup/dimMoveAmount.directive.js',
            'app/scripts/move-popup/dimMovePopup.directive.js',
            'app/scripts/move-popup/dimTalentGrid.directive.js',
            'app/scripts/move-popup/dimMoveItemProperties.directive.js',
            'app/scripts/infuse/dimInfuse.controller.js',
            'app/scripts/xur/dimXur.controller.js',
            'app/scripts/minmax/dimMinMax.controller.js'
          ]
        }
      }
    },
    sass: {
        dist: {
          files: {
            'app/styles/main.css': 'app/scss/main.scss'
          }
        }
      },

      postcss: {
        options: {
          processors: [
            require('autoprefixer')()
          ]
        },
        dist: {
         src: 'app/styles/main.css',
         dest: 'app/styles/main.css'
        }
      },

      watch:{
        scripts:{
          files:['app/scss/*.scss'],
          tasks:['css'],
          options:{spawn:false}
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

  grunt.registerTask('css', ['sass', 'postcss']);

  grunt.loadNpmTasks('grunt-webstore-upload');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Builds the Beta extension and publishes
  grunt.registerTask('build', ['uglify',
                               'concat']);

  grunt.registerTask('update_beta_manifest', function() {
    var manifest = grunt.file.readJSON('build/extension/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    grunt.file.write('build/extension/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });

  // Builds the Beta extension and publishes
  grunt.registerTask('publish_beta', ['clean',
                                      'css',
                                      'copy:main',
                                      'copy:beta_icons',
                                      'replace:beta_version',
                                      'update_beta_manifest',
                                      'compress',
                                      'webstore_upload:beta',
                                      'log_beta_version']);

  // Builds a release-able extension in build/dim-extension.zip
  grunt.registerTask('build_extension', ['clean',
                                      'css',
                                      'copy:main',
                                      'compress']);

};
