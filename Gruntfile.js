const child_process = require("child_process");
const fs = require("fs");

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  var betaVersion = pkg.version.toString() + "." + process.env.TRAVIS_BUILD_NUMBER;

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
        privateKey: 'config/dim_travis.rsa',
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

    precompress: {
      web: {
        src: "dist/**/*.{js,html,css,json,map,ttf,eot,svg,wasm}"
      }
    },

  });

  grunt.loadNpmTasks('grunt-rsync');

  grunt.registerMultiTask(
    'precompress',
    'Create gzip and brotli versions of web assets',
    function() {
      const done = this.async();
      const promises = [];
      this.filesSrc.forEach(function(file) {
        if (!fs.existsSync(file+".gz")) {
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
        }


        if (!fs.existsSync(file+".br")) {
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
        }
      });

      Promise.all(promises).then(done);
    }
  );

  grunt.registerTask('publish_beta', [
    'log_beta_version',
    'precompress',
    'rsync:app_content',
    'rsync:app_html'
  ]);

  grunt.registerTask('publish_release', [
    'log_release_version',
    'precompress',
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
