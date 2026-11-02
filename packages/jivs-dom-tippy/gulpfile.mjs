import gulp from 'gulp';
import { deleteAsync as del } from 'del';

gulp.task('clean', function ()
{
    return del([
        'coverage/**/*',
        'build/**/*',
        'temp/**/*',
        'temp'
    ]);
});
