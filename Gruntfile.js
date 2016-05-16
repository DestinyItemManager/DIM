module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var betaVersion = pkg.version.toString() + "." + (Math.floor(Date.now() / 60000) - 24365210);

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
