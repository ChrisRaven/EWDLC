import * as TabbedChat from "./tabbedChat/TabbedChat.js"
import * as SkippableLeaderboard from "./SkippableLeaderboard/SkippableLeaderboard.js"
import * as ExtraStats from "./ExtraStats/ExtraStats.js"
import * as ExtraControls from "./ExtraControls/ExtraControls.js"
import * as UiBoxImprovements from "./UiBoxImprovements/UiBoxImprovements.js"

var Modules = {
    TabbedChat: TabbedChat,
    SkippableLeaderboard: SkippableLeaderboard,
    ExtraStats: ExtraStats,
    ExtraControls: ExtraControls,
    UiBoxImprovements: UiBoxImprovements
}

function initModules() {
    for(var key in Modules) {
        Modules[key][key + "Init"]();
    }
}

export {Modules}
export {initModules}
