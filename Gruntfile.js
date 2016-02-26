module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: pkg,

    copy: {
      // Copy all files to a staging directory
      main: {
        cwd: 'app/',
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
          to: "<%= grunt.template.today('yyyy-mm-dd-hh-MM-ss') %>"
        }]
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
        // "default": { //account under this section will be used by default
        //   publish: true, //publish item right after uploading. default false
        //   client_id: process.env.CHROME_CLIENT_ID,
        //   client_secret: process.env.CHROME_SECRET,
        //   refresh_token: process.env.CHROME_REFRESH_TOKEN
        // }
        "default": { //account under this section will be used by default
          publish: true, //publish item right after uploading. default false
          client_id: '259313796625-54o35mrqpii649ui959v8p53uo9s8rht.apps.googleusercontent.com',
          client_secret: 'nOjGSSz5KS9PuXRT1qtQS5t-',
          refresh_token: '1/j6FEPgnGzkW76o2sye-9wSkVVud4CgijCeoQ9VT37UF90RDknAdJa_sgfheVM0XT'
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

  grunt.registerTask('publish_beta', ['clean',
                              'copy',
                              'compress',
                              'replace:beta_version',
                              'webstore_upload:beta']);
};
