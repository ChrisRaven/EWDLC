function SlHacks() {
    var intervalId = window.setInterval(function () {
        // Stop SL bug with R toggling review mode
        if (!document.getElementById("slPanel")) return;

        document.getElementById("slPanel").addEventListener("keypress", function (e) {
            e.stopPropagation();
        });
        console.log("Fixed Scouts' Log Review button bug.");
        window.clearInterval(intervalId);

    }, 1000);
}

function SlHacksInit() {
    window.ewdlc.modules.slHacks = window.ewdlc.modules.slHacks || new SlHacks();
}

export { SlHacks }
export { SlHacksInit }
