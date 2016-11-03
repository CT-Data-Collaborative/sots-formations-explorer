var gulp = require('gulp')
var concat = require('gulp-concat')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var uglify = require('gulp-uglify')
var ngAnnotate = require('gulp-ng-annotate')
var connect = require('gulp-connect')



gulp.task('js_dependencies', function() {
    gulp.src([
        'node_modules/angular/angular.min.js',
        'node_modules/angular-animate/angular-animate.min.js',
        'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
        'node_modules/angular-route/angular-route.min.js',
        'node_modules/d3/d3.min.js',
        'node_modules/d3-tip/index.js',
        'node_modules/d3-jetpack/d3-jetpack.js',
        'node_modules/ng-lodash/build/ng-lodash.min.js',
        'node_modules/tether/dist/js/tether.min.js',
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/moment/moment.js',
        'node_modules/simple-statistics/dist/simple-statistics.min.js',
        'node_modules/angular-loading/angular-loading.min.js',
        'node_modules/ng-dialog/js/ngDialog.min.js',
        'node_modules/isteven-angular-multiselect/isteven-multi-select.js',
        'node_modules/tether/dist/js/tether.min.js',
        'node_modules/tether-drop/dist/js/drop.min.js',
        'node_modules/tether-tooltip/dist/js/tooltip.min.js',
        'node_modules/angular-sanitize/angular-sanitize.min.js',
        'node_modules/ng-csv/build/ng-csv.min.js',
        'node_modules/angular-tablescroll/angular-tablescroll.js',
        'node_modules/spin/dist/spin.min.js'
    ]).pipe(gulp.dest('dist/js/libs'));
});

gulp.task('css_dependencies', function() {
    gulp.src([
        'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-csp.css',
        'node_modules/tether/dist/css/tether.min.css',
        'node_modules/angular-loading/angular-loading.css',
        'node_modules/isteven-angular-multiselect/isteven-multi-select.css',
        'node_modules/tether-tooltip/dist/css/tooltip-theme-arrows.css',
    ]).pipe(gulp.dest('dist/css'));
});

gulp.task('geojsons', function() {
    gulp.src([
        'src/static/geojsons/*.geojson'
    ]).pipe(gulp.dest('dist/geo'));
});


gulp.task('js', function() {
    gulp.src(['src/static/js/**/*.js', 'src/static/js/**/*/*.js'])
     // .pipe(sourcemaps.init())
      .pipe(concat('app.js'))
      // .pipe(ngAnnotate())
      // .pipe(uglify())
     .pipe(sourcemaps.write())
     .pipe(gulp.dest('dist/js/'))
});


gulp.task('sass', function() {
    gulp.src('src/static/sass/project.scss')
     .pipe(sass().on('error', sass.logError))
     .pipe(gulp.dest('dist/css'));
});

// will server on localhost:8080 or 0.0.0.0:8080
gulp.task('serve', ['build'], function () {
    // will server on localhost:4444 or 0.0.0.0:4444
    connect.server({
        root: 'dist/',
        port: 4444
    });
    gulp.watch(['src/**/*.*'],  ['build']);
});


gulp.task('build', ['js', 'js_dependencies', 'css_dependencies', 'geojsons', 'sass'], function() {
    gulp.src('src/static/images/*.*').pipe(gulp.dest('dist/images/'));
    gulp.src(['src/static/data/**/*']).pipe(gulp.dest('dist/data/'));
    gulp.src(['src/index.html']).pipe(gulp.dest('dist/'));
    gulp.src(['src/pages/*.html']).pipe(gulp.dest('dist/pages/'));
    gulp.src(['src/templates/*.html']).pipe(gulp.dest('dist/templates/'));
    gulp.src(['src/static/partials/**/*.html']).pipe(gulp.dest('dist/partials'));
});

gulp.task('default', ['serve']);
