import {EWDLC} from "./framework/ewdlc.js"
import {initModules} from "./modules/modules.js"

$(document).ready(function () {
    let ewdlc = window.ewdlc || new EWDLC();
    window.ewdlc = ewdlc;
    
    ewdlc.init();
    initModules();
});

export * from "./framework/ewdlc.js"
export {Modules} from "./modules/modules.js"
