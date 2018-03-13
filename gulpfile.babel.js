"use strict";

import { src, dest, series, parallel } from "gulp";
import gutil from "gulp-util";
import gulpLoadPlugins from "gulp-load-plugins";
import minimist from "minimist";
import del from "del";
import browserSync from "browser-sync";
import webpack from "webpack";
import webpackStream from "webpack-stream";
import path from 'path';

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

export const styles = () => {
  return src(`src/assets/sass/*.scss`)
    .pipe($.plumber())
    .pipe($.if(!isProduction, $.sourcemaps.init()))
    .pipe($.sass().on("erorr", $.sass.logError))
    .pipe($.postcss())
    .pipe($.if(!isProduction, $.sourcemaps.write("./")))
    .pipe(dest(`dist/assets/css`))
    .pipe(bs.stream());
};

export const serve = () => {
  return bs.init({
    server: {
      baseDir: path.resolve(__dirname, 'dist')
    }
  });
};

export const scripts = () => {
  return src(`src/assets/js/index.js`)
    .pipe(
      webpackStream(
        {
          mode: options.env,
          output: {
            filename: "[name].bundle.js"
          }
        },
        webpack
      )
    )
    .pipe(dest(`dist/assets/js`));
};

export const html = () => {
  return src(`src/**/*.html`, { base: "src" })
    .pipe(dest("dist"))
    .pipe($.if(bs.active, bs.reload));
};

export const watch = () => {
  $.watch(`src/assets/sass/**/*.scss`, styles);
  $.watch(`src/assets/js/**/*.js`, scripts);
  $.watch(`src/**/*.html`, html);
};

export const clean = () => del([`dist`]);

export const copyFiles = () =>
  src(`src/assets/images/**`, { base: "src" }).pipe(dest("dist"));

export const build = series(clean, html, styles, scripts, copyFiles);

const errorHandler = function(err) {
  gutil.log(gutil.colors.red(`Error: ${err}`));
  this.emit("end");
};

export default (() => {
  if (!isProduction) {
    return series(build, parallel(serve, watch));
  } else {
    return series(build);
  }
})();
