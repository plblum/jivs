import gulp from 'gulp';
import { deleteAsync as del } from 'del';

// Define the 'clean' task
gulp.task('clean', function () {
    return del([
        'typedoc_output/**/*',
        'coverage/**/*',
        'starter_code/build/**',
        'packages/**/build/**/*',
        'packages/**/src/**/*.d.ts',
        // 'packages/**/src/**/*.js',
        'packages/**/src/**/*.map',
        'packages/**/*.md.backup',
        'packages/**/*.tgz'
    ]);
});
