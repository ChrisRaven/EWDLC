import {EWDLC} from "./framework/ewdlc.js"
import {initModules} from "./modules/modules.js"

$(document).ready(function () {
    if($(".gameBoard").length == 0) return;

    let ewdlc = ewdlc || new EWDLC("https://crazyman4865.com/eyewire/static");
    
    initModules();
    ewdlc.init();
});

export * from "./framework/ewdlc.js"
export {Modules} from "./modules/modules.js"
