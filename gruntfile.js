module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    sass: {
        options: {
            sourceMap: true
        },
        dist: {
            files: {
                'app/styles/main.css': 'app/styles/main.scss'
            }
        }
    },
    watch: {
      scripts: {
        files: ['app/styles/**/*.scss'],
        tasks: ['sass']
      },
    },
  });

  grunt.registerTask('default', ['sass', 'watch']);

};
