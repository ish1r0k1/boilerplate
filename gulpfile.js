"use strict"

let
  gulp = require("gulp"),
  browserify = require("browserify"),
  babelify = require("babelify"),
  source = require("vinyl-source-stream"),
  buffer = require("vinyl-buffer"),
  $ = require("gulp-load-plugins")(),
  browserSync = require("browser-sync").create(),
  reload = browserSync.reload;

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

const AUTOPREFIXER_BROWSER = [
  "ie >= 8",
  "ff >= 30",
  "chrome >= 34",
  "safari >= 7",
  "opera >= 23",
  "ios >= 7",
  "android >= 4.4",
  "bb >= 10"
];

const CONFIG = {
  minify: {
    css: true,
    js: true
  }
};

gulp.task("serve", () => {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
});

gulp.task("styles", () => {
  gulp.src(`${PATHS.styles.scss}/*.scss`)
  .pipe($.plumber())
  .pipe($.sass().on("erorr", $.sass.logError))
  .pipe($.pleeease({
    autoprefixer: {
      browsers: AUTOPREFIXER_BROWSER
    },
    opacity: true,
    minifier: CONFIG.minify.css,
    mqpacker: true
  }))
  .pipe(gulp.dest(PATHS.styles.css))
  .pipe(browserSync.stream());
});

gulp.task("scripts", () => {
  browserify(`${PATHS.scripts.altJS}/index.js`)
  .transform(babelify, { presets: ["es2015"] })
  .bundle()
  .on("error", errorHandler)
  .pipe(source("bundle.js"))
  .pipe(buffer())
  .pipe(gulp.dest(PATHS.scripts.js))
  .pipe($.if(CONFIG.minify.js, $.uglify()))
  .pipe($.if(CONFIG.minify.js, $.rename({ suffix: ".min" })))
  .pipe($.if(CONFIG.minify.js, gulp.dest(PATHS.scripts.js)))
  .pipe(browserSync.stream());
});

gulp.task("watch", () => {
  $.watch([PATHS.scripts.altJS + "/**/*.js"], () => {
    gulp.start(["scripts"]);
  });

  $.watch([PATHS.styles.scss + "/**/*.scss"], () => {
    gulp.start(["styles"]);
  });

  $.watch([PATHS.html], () => {
    browserSync.reload();
  });
});

gulp.task("build", (cb) => {
  gulp.start(["styles", "scripts"], cb);
});

gulp.task("default", (cb) => {
  gulp.start(["build", "serve", "watch"], cb);
});

let errorHandler = function(err) {
  console.log(err);
  this.emit("end");
};
