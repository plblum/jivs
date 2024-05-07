// Set NODE_PATH to the top-level node_modules directory
import { Module } from 'module';
process.env.NODE_PATH = '../../node_modules';

// Ensure that require() searches for modules in the specified directories
Module._initPaths();

import gulp from 'gulp';
import jestContainer from 'gulp-jest';
import { deleteAsync as del } from 'del';

let jest = jestContainer.default;

gulp.task('jest', function () {
  process.env.NODE_ENV = 'test';
  return gulp.default.src('tests').pipe(jest({
    "config": "./jest.config.json"
  }));
});


// Define the 'clean' task
gulp.task('clean', function () {
  return del([
      'coverage/**/*',
      'build/**/*',
      'temp/**/*',      
      'temp',      
      'src/**/*.d.ts',
      // 'src/**/*.js',
      'src/**/*.map',
      '*.md.backup',
      '*.tgz'
  ]);
});



// // Set NODE_PATH to the top-level node_modules directory
// process.env.NODE_PATH = '../../node_modules';

// // Ensure that require() searches for modules in the specified directories
// require('module').Module._initPaths();

// var gulp = require('gulp');
// var jest = require('gulp-jest').default;

// gulp.task('jest', function () {
//   process.env.NODE_ENV = 'test';
//   return gulp.src('tests').pipe(jest({
//     "config": "./jest.config.js"
//   }));
// });