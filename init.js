// require framework/ewdlc.js
// require modules/modules.js
/* global EWDLC:false */

$(document).ready(function () {
    let ewdlc = window.ewdlc || new EWDLC();
    window.ewdlc = ewdlc;
    
    ewdlc.init();
});