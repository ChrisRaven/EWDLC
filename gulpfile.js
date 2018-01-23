var gulp = require("gulp");
var rollup = require("rollup");
var UglifyJS = require("uglify-es");
var fs = require("fs");
var less = require("less");
var ncp = require("ncp").ncp;

gulp.task("build", async () => {
    // JS
    const bundle = await rollup.rollup({
        input: "src/init.js"
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

    // LESS
    var options = {
        filename: "src/less/ewdlc.less",
        sourceMap: {
            sourceMapURL: "ewdlc.css.map",
            outputSourceFiles: true
        }
    }

    function lessOutput(e, output) {
        if(e) {console.log(e); return;}
    
        var dir = "build/static/";
    
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    
        var outDir = dir + "css/";
    
        if (!fs.existsSync(outDir)){
            fs.mkdirSync(outDir);
        }
    
        if(options.compress) {
            fs.writeFileSync(outDir + "ewdlc.min.css", output.css, "utf8");
            fs.writeFileSync(outDir + "ewdlc.min.css.map", output.map, "utf8");
        } else {
            fs.writeFileSync(outDir + "ewdlc.css", output.css, "utf8");
            fs.writeFileSync(outDir + "ewdlc.css.map", output.map, "utf8");
        }
    }

    less.render(fs.readFileSync("src/less/ewdlc.less", "utf8"), options, lessOutput);

    options.compress = true;
    options.sourceMap.sourceMapURL = "ewdlc.min.css.map";

    less.render(fs.readFileSync("src/less/ewdlc.less", "utf8"), options, lessOutput);
    
    // OTHER RESOUCES
    ncp("res", "build/static");
});
