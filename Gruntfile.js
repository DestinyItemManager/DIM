module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  // We start the github build number from 1,000,000 so we don't get clashes with travis build numbers.
  const buildNumber = parseInt(process.env.GITHUB_RUN_NUMBER) + 1_000_000;

  var betaVersion = `${pkg.version.toString()}.${buildNumber}`;

  grunt.initConfig({
    pkg: pkg,

    // Tasks for uploading the website versions
    rsync: {
      options: {
        //dryRun: true,
        args: ["--verbose"],
        excludeFirst: ["chrome.zip", "stats.html"],
        host: process.env.REMOTE_HOST,
        recursive: true,
        ssh: true,
        privateKey: '~/.ssh/dim.rsa',
        sshCmdArgs: ["-o StrictHostKeyChecking=no"]
      },
      // Sync everything but the HTML first, so it's ready to go
      app_content: {
        options: {
          exclude: ["*.html", "service-worker.js", "version.json"],
          src: "dist/",
          dest: process.env.REMOTE_PATH
        }
      },
      // Then sync the HTML which will start using the new content
      app_html: {
        options: {
          src: ["dist/*.html", "dist/service-worker.js", "dist/version.json"],
          dest: process.env.REMOTE_PATH
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-rsync');

  grunt.registerTask('publish_beta', [
    'log_beta_version',
    'rsync:app_content',
    'rsync:app_html'
  ]);

  grunt.registerTask('publish_release', [
    'log_release_version',
    'rsync:app_content',
    'rsync:app_html'
  ]);

  grunt.registerTask('log_beta_version', function() {
    grunt.log.ok("New Beta version is " + betaVersion);
  });

  grunt.registerTask('log_release_version', function() {
    grunt.log.ok("New production version is " + pkg.version);
  });
};
