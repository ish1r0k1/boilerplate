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
import webpack from 'webpack';
import webpackStream from 'webpack-stream';

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
    .pipe($.postcss())
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
  return src(`${PATHS.scripts.altJS}/index.js`)
    .pipe(webpackStream({
      mode: options.env,
      output: {
        filename: '[name].bundle.js'
      }
    }, webpack))
    .pipe(dest(PATHS.scripts.js))
}

export const watch = () => {
  $.watch(`${PATHS.styles.scss}/**/*.scss`, styles)
  $.watch(`${PATHS.scripts.altJS}/**/*.js`, scripts)
    $.watch(`${PATHS.html}`, reload);
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
    return series(clean, parallel(styles, scripts), parallel(serve, watch));
  } else {
    return series(clean, parallel(styles, scripts));
  }
})();
