"use strict";

import { src, dest, series, parallel } from "gulp";
import gutil from "gulp-util";
import gulpLoadPlugins from "gulp-load-plugins";
import browserify from "browserify";
import watchify from "watchify";
import source from "vinyl-source-stream";
import buffer from "vinyl-buffer";
import minimist from "minimist";
import del from "del";
import runSequence from "run-sequence";
import browserSync from "browser-sync";

const $ = gulpLoadPlugins(),
  bs = browserSync.create(),
  reload = bs.reload;

const minimistOptions = {
  string: "env",
  default: {
    env: process.env.NODE_ENV || "development"
  }
};

const options = minimist(process.argv.slice(2), minimistOptions),
  isProduction = options.env === "production";

gutil.log("Environment:", gutil.colors.yellow(options.env));

const PATHS = {
  styles: {
    scss: "assets/_scss",
    css: "assets/css"
  },
  scripts: {
    altJS: "assets/_es6",
    js: "assets/js"
  },
  html: "**/*.html"
};

const AUTOPREFIXER_BROWSER = ["last 2 versions"];

export const styles = () => {
  return src(`${PATHS.styles.scss}/*.scss`)
    .pipe($.plumber())
    .pipe($.if(!isProduction, $.sourcemaps.init()))
    .pipe($.sass().on("erorr", $.sass.logError))
    .pipe($.autoprefixer({ browsers: AUTOPREFIXER_BROWSER }))
    .pipe($.groupCssMediaQueries())
    .pipe($.csscomb())
    .pipe($.csso())
    .pipe($.if(!isProduction, $.sourcemaps.write("./")))
    .pipe(dest(PATHS.styles.css))
    .pipe(bs.stream());
};

export const serve = () => {
  return bs.init({
    server: {
      baseDir: "./"
    }
  });
};

export const scripts = () => {
  let bundler;

  const options = {
    entries: [`${PATHS.scripts.altJS}/index.js`],
    transform: [["babelify"]],
    plugin: ["babel-plugin-transform-object-rest-spread"]
  };

  const filename = "bundle.js";

  if (isProduction || !bs.active) {
    bundler = browserify(options);
  } else {
    options.cache = {};
    options.packageCache = {};
    options.fullPaths = true;
    options.debug = true;
    bundler = watchify(browserify(options));
  }

  function bundle() {
    return bundler
      .bundle()
      .on("error", errorHandler)
      .pipe(source(filename))
      .pipe(buffer())
      .pipe($.if(isProduction, $.uglify()))
      .pipe(dest(PATHS.scripts.js))
      .on("end", () => {
        gutil.log(
          "Finished",
          "'" + gutil.colors.cyan("Browserify Bundled") + "'",
          gutil.colors.green(filename)
        );
        if (!isProduction && bs.active) reload();
      });
  }

  bundler.on("update", bundle);
  return bundle();
};

export const watch = () => {
  $.watch(`${PATHS.styles.scss}/**/*.scss`, styles),
    $.watch(`${PATHS.html}`, reload());
};

export const clean = () => {
  return del([`${PATHS.scripts.js}/*.js`, `${PATHS.styles.css}`]);
};

const errorHandler = function(err) {
  gutil.log(gutil.colors.red(`Error: ${err}`));
  this.emit("end");
};

export default (() => {
  if (!isProduction) {
    return series(clean, parallel(styles, scripts), serve, watch);
  } else {
    return series(clean, parallel(styles, scripts));
  }
})();
