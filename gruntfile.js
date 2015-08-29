module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    cssmin: {
      options: {
        shorthandCompacting: false
      },
      target: {
        files: {
          'app/styles/main.css': 'app/styles/main.css'
        }
      }
    },
    sass: {
        options: {
          sourceMap: true
        },
        dist: {
          files: {
            'app/styles/main.css': 'app/styles/main.scss',
            'app/styles/v4.css': 'app/styles/v4.scss'
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
