function SkippableLeaderboard() {
    var original = tomni.taskManager.ui.showLeaderboard;
    tomni.taskManager.ui.showLeaderboard = function(data) {
        if(!ewdlc.modules.tabbedChat.prefs.get("tc-show-leaderboard")) {
            data.callback("proceed");
            $("#edit-cube-loader").css("opacity", "0");
            return;
        }
        original(data);
    };
}

function SkippableLeaderboardInit() {
    ewdlc.modules.skippableLeaderboard = ewdlc.modules.skippableLeaderboard || new SkippableLeaderboard();
}

export {SkippableLeaderboard}
export {SkippableLeaderboardInit}
