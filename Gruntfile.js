module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  var betaVersion = pkg.version.toString() + "." + process.env.TRAVIS_BUILD_NUMBER;

  grunt.initConfig({
    pkg: pkg,

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
            '!data',
            '!chrome.zip',
            '!.htaccess',
            '!stats.html'
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
          publish: false,
          zip: "dist/chrome.zip"
        },
        beta: {
          appID: "mkiipknpfaacbjdagdeppdacpgpdjklc",
          zip: "dist/chrome.zip"
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
      }
    }
  });

  grunt.loadNpmTasks('grunt-webstore-upload');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-rsync');

  grunt.registerTask('update_chrome_beta_manifest', function() {
    var manifest = grunt.file.readJSON('dist/manifest.json');
    manifest.name = manifest.name + " Beta";
    manifest.version = betaVersion;
    grunt.file.write('dist/manifest.json', JSON.stringify(manifest));
  });

  grunt.registerTask('publish_beta', [
    'update_chrome_beta_manifest',
    'compress:chrome',
    'log_beta_version',
    'webstore_upload:beta',
    'rsync:beta'
  ]);

  grunt.registerTask('publish_release', [
    'compress:chrome',
    'webstore_upload:release',
    'rsync:prod'
  ]);

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });
};
