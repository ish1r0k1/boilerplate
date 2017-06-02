"use strict";

let
  gulp = require("gulp"),
  gutil = require("gulp-util"),
  $ = require("gulp-load-plugins")(),
  browserify = require("browserify"),
  // babelify = require("babelify"),
  watchify = require("watchify"),
  source = require("vinyl-source-stream"),
  buffer = require("vinyl-buffer"),
  minimist = require("minimist"),
  del = require("del"),
  runSequence = require("run-sequence"),
  browserSync = require("browser-sync"),
  bs = browserSync.create(),
  reload = bs.reload;

const minimistOptions = {
  string: "env",
  default: {
    env: process.env.NODE_ENV || "development"
  }
};

const options = minimist(process.argv.slice(2), minimistOptions);

let isProduction = false;

if (options.env === "production") {
  isProduction = true;
}

gutil.log("Environment:", gutil.colors.yellow(options.env));

const PATHS = {
  styles: {
    scss: "assets/_scss",
    css: "assets/css"
  },
  scripts: {
    altJS: "assets/_es6",
    js: "assets/js",
  },
  html: "**/*.html"
};

const AUTOPREFIXER_BROWSER = ["last 2 versions"];

gulp.task("serve", () => {
  bs.init({
    server: {
      baseDir: "./"
    }
  });
});

gulp.task("styles", () => {
  gulp.src(`${PATHS.styles.scss}/*.scss`)
  .pipe($.plumber())
  .pipe($.if(!isProduction, $.sourcemaps.init()))
  .pipe($.sass().on("erorr", $.sass.logError))
  .pipe($.autoprefixer({ browsers: AUTOPREFIXER_BROWSER }))
  .pipe($.groupCssMediaQueries())
  .pipe($.csscomb())
  .pipe($.csso())
  .pipe($.if(!isProduction, $.sourcemaps.write("./")))
  .pipe(gulp.dest(PATHS.styles.css))
  .pipe(bs.stream());
});

gulp.task("scripts", () => {
  let bundler;

  const options = {
    entries: [`${PATHS.scripts.altJS}/index.js`],
    transform: [["babelify", { presets: ["es2015"] }]],
    plugin: ["babel-plugin-transform-object-rest-spread"]
  };

  const filename = "bundle.js";

  if (isProduction) {
    bundler = browserify(options);
  } else {
    options.cache = {};
    options.packageCache = {};
    options.fullPaths = true;
    options.debug = true;
    bundler = watchify(browserify(options));
  }

  function bundle() {
    bundler
      .bundle()
      .on("error", errorHandler)
      .pipe(source(filename))
      .pipe(buffer())
      .pipe($.if(isProduction, $.uglify()))
      .pipe(gulp.dest(PATHS.scripts.js))
      .on("end", () => {
        gutil.log("Finished", "'" + gutil.colors.cyan("Browserify Bundled") + "'", gutil.colors.green(filename));
        if (!isProduction && bs.active) reload();
      });
  }

  bundler.on("update", bundle);
  bundle();
});

gulp.task("watch", () => {
  $.watch([PATHS.styles.scss + "/**/*.scss"], () => {
    gulp.start("styles");
  });

  $.watch([PATHS.html], () => {
    reload();
  });
});

gulp.task("clean", (cb) => {
  return del([`${PATHS.scripts.js}/*.js`, `${PATHS.styles.css}`], cb);
});

gulp.task("default", () => {
  if (!isProduction) {
    runSequence("clean", ["styles", "scripts"], "serve", "watch");
  } else {
    runSequence("clean", ["styles", "scripts"]);
  }
});

const errorHandler = function(err) {
  gutil.log(gutil.colors.red(`Error: ${err}`));
  this.emit("end");
};
