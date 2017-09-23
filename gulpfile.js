var gulp = require("gulp");
var bundle = require("bundle-js");
var UglifyJS = require("uglify-es");
var fs = require("fs");

gulp.task("build", function() {
    bundle({
        entry: "../../init.js",
        dest: "../../build/ewdlc.js",
        target: "browser",
        iife: true
    });
    var options = {
        compress: true,
        keep_fnames: true,
        sourceMap: {
            filename: "ewdlc.min.js",
            url: "ewdlc.min.js.map"
        }
    };
    var uglifyResult = UglifyJS.minify({
        "ewdlc.js": fs.readFileSync("build/ewdlc.js", "utf8")
    }, options);
    
    if(uglifyResult.error) {    
        console.log(uglifyResult.error);
    } else {
        fs.writeFileSync("build/ewdlc.min.js", uglifyResult.code, "utf8");
        fs.writeFileSync("build/ewdlc.min.js.map", uglifyResult.map, "utf8");
    }
});