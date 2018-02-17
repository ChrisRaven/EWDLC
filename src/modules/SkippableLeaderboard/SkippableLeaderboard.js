function SkippableLeaderboard() {
    var original = window.tomni.taskManager.ui.showLeaderboard;
    window.tomni.taskManager.ui.showLeaderboard = function(data) {
        if(!window.ewdlc.modules.tabbedChat.prefs.get("tc-show-leaderboard")) {
            data.callback("proceed");
            $("#edit-cube-loader").css("opacity", "0");
            return;
        }
        original(data);
    };
}

function SkippableLeaderboardInit() {
    window.ewdlc.modules.skippableLeaderboard = window.ewdlc.modules.skippableLeaderboard || new SkippableLeaderboard();
}

export {SkippableLeaderboard}
export {SkippableLeaderboardInit}
