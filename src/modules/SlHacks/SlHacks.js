function SlHacks() {
    function setColor(selector, color) {
        $(selector).each(function() {
            this.style.setProperty("color", color, "important");
        });
    }

    var intervalId = setInterval(function () {
        // Stop SL bug with R toggling review mode
        if (!document.getElementById("slPanel")) return;

        document.getElementById("slPanel").addEventListener("keypress", function (e) {
            e.stopPropagation();
        });
        console.log("Fixed Scouts' Log Review button bug.");
        clearInterval(intervalId);

        // Set Need Scythe/Admin button colors to match cell colors
        setColor(".sl-need-admin", Cell.ScytheVisionColors.reap);
        setColor(".sl-need-scythe", Cell.ScytheVisionColors.scythed);

    }, 1000);
}

function SlHacksInit() {
    ewdlc.modules.slHacks = ewdlc.modules.slHacks || new SlHacks();
}

export { SlHacks }
export { SlHacksInit }
