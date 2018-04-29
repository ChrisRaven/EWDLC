import {EWDLC} from "./framework/ewdlc.js"
import {initModules} from "./modules/modules.js"

$(document).ready(function () {
    if($(".gameBoard").length == 0) return;

    window.ewdlc = new EWDLC("https://chrisraven.github.io/EWDLC/build/static");

    initModules();
    ewdlc.init();
});


export * from "./framework/ewdlc.js"
export {Modules} from "./modules/modules.js"
