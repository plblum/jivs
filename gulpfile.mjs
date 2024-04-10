import gulp from 'gulp';
import { deleteAsync as del } from 'del';

export function cleanRoot()
{
    return del([
        'typedoc_output/**/*',
        'coverage/**/*',
        'starter_code/build/**',
        'packages/**/build/**/*',
        'packages/**/src/**/*.d.ts',
        'packages/*/*.d.ts',        
        'packages/**/src/**/*.js',
        'packages/**/src/**/*.map',
        'packages/**/tests/**/*.d.ts',
        'packages/**/tests/**/*.js',
        'packages/**/tests/**/*.map',  
        
        'packages/**/*.md.backup',
        'packages/**/*.tgz'
    ]);
}

// Define the 'clean' task
gulp.task('clean', cleanRoot);
