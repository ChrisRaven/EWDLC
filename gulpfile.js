var gulp = require("gulp");
var rollup = require("rollup");
var UglifyJS = require("uglify-es");
var fs = require("fs");

gulp.task("build", async () => {
    const bundle = await rollup.rollup({
        input: "init.js",
        
    });

    await bundle.write({
        sourcemap: true,
        file: "build/ewdlc.js",
        format: "iife",
        name: "EWDLC",
    });

    var options = {
        compress: true,
        output: {
            preamble: "// https://github.com/crazyman4865/EWDLC/blob/master/LICENSE"
        },
        sourceMap: {
            content: fs.readFileSync("build/ewdlc.js.map", "utf8"),
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
