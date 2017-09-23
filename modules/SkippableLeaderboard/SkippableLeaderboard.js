// require ../../framework/ewdlc.js

function SkippableLeaderboard() {
    var original = window.tomni.taskManager.ui.showLeaderboard;
    window.tomni.taskManager.ui.showLeaderboard = function(data) {
        if(window.EWDLC.modules.tabbedChat.prefs.get("tc-skip-leaderboard")) {
            data.callback("proceed");
            $("#edit-cube-loader").css("opacity", "0");
            return;
        }
        original(data);
    };
}

$(document).ready(function() {
    window.EWDLC.modules.skippableLeaderboard = window.EWDLC.modules.skippableLeaderboard || new SkippableLeaderboard();
});