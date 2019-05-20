import gulp from 'gulp';
import { argv } from 'yargs';
import { spawn } from 'child_process';
import istanbul from 'gulp-babel-istanbul';
import util from 'gulp-util';
import mocha from 'gulp-mocha';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import babelify from 'babelify';
import browserify from 'browserify';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import stylus from 'gulp-stylus';
import nib from 'nib';

gulp.task('server', () =>
  spawn('node_modules/.bin/node-dev', ['--max-old-space-size=8192', 'startServer.js'], { stdio: 'inherit' })
);

gulp.task('test', () => {
  const path = `test/${argv.path || argv.p || '**/*.js'}`;
  process.env.NODE_ENV = 'test';
  return gulp.src(['src/**/*.js'])
    .pipe(istanbul({ includeUntested: true }))
    .pipe(istanbul.hookRequire())
    .on('finish', () => {
      gulp.src([path, '!fixtures/*'])
        .pipe(mocha({ require: 'babel-register' }))
        .pipe(istanbul.writeReports())
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 1 } }))
        .once('error', (err) => {
          util.log(util.colors.red(`Error: ${err.message}`));
          process.exit(1);
        })
        .once('end', () => {
          process.exit(0);
        });
    });
});

gulp.task('build-js', () =>
  browserify({
    entries: './src/client/index.js',
    detectGlobals: true,
    debug: true,
  })
    .transform(babelify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    // .pipe(uglify())
    .pipe(gulp.dest('./dist'))
);

gulp.task('build-css', () =>
  gulp.src('src/client/styles/main.styl')
    .pipe(stylus({ use: [nib()] }))
    .pipe(rename('styles.css'))
    .pipe(gulp.dest('./dist'))
);

gulp.task('build', gulp.series('build-js', 'build-css'));
