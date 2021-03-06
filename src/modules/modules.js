import * as TabbedChat from "./tabbedChat/TabbedChat.js"
import * as SkippableLeaderboard from "./SkippableLeaderboard/SkippableLeaderboard.js"
import * as ExtraStats from "./ExtraStats/ExtraStats.js"
import * as ExtraControls from "./ExtraControls/ExtraControls.js"
import * as UiBoxImprovements from "./UiBoxImprovements/UiBoxImprovements.js"
import * as SlHacks from "./SlHacks/SlHacks.js"
import * as CellColorPicker from "./CellColorPicker/CellColorPicker.js"
import * as ProfileWindowChanges from "./ProfileWindowChanges/ProfileWindowChanges.js"

var Modules = {
    TabbedChat: TabbedChat,
    SkippableLeaderboard: SkippableLeaderboard,
    ExtraStats: ExtraStats,
    ExtraControls: ExtraControls,
    UiBoxImprovements: UiBoxImprovements,
    SlHacks: SlHacks,
    CellColorPicker: CellColorPicker,
    ProfileWindowChanges: ProfileWindowChanges
}

function initModules() {
    for(var key in Modules) {
        Modules[key][key + "Init"]();
    }
}

export {Modules}
export {initModules}
