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
          'app/styles/main.min.css': 'app/styles/main.min.css'
        }
      }
    },
    sass: {
        options: {
          sourceMap: true
        },
        dist: {
          files: {
            'app/styles/main.min.css': 'app/styles/scss/main.scss',
            'app/styles/v4.css': 'app/styles/scss/v4.scss'
          }
        }
    },
    watch: {
      scripts: {
        files: ['app/styles/scss/*.scss'],
        tasks: ['sass']
      },
    },
  });

  grunt.registerTask('default', ['sass', 'watch']);

};
