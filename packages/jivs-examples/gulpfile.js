// Set NODE_PATH to the top-level node_modules directory
process.env.NODE_PATH = '../../node_modules';

// Ensure that require() searches for modules in the specified directories
require('module').Module._initPaths();

var gulp = require('gulp');
var jest = require('gulp-jest').default;

gulp.task('jest', function () {
  process.env.NODE_ENV = 'test';
  return gulp.src('tests').pipe(jest({
    "config": "./jest.config.js"
  }));
});