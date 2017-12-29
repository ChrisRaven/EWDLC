import {Preferences} from "./Preferences.js"
import {Account} from "./Account.js"
import {SettingsUi} from "./SettingsUi.js"

/**
 * The main entrypoint of the framework
 */
function EWDLC() {
    var _this = this;
    var _isInit = false;

    _this.preferences = new Preferences(_this);
    _this.account = new Account();
    _this.modules = {};
    _this.settingsUi = new SettingsUi();

    _this.init = function() {
        if(_isInit) return;

        _this.preferences.init();
        _this.account.refreshInfo().then(() => $(window).trigger("ewdlc-account-ready"));

        _isInit = true;
    };
}

export {EWDLC}
export {Preferences} from "./Preferences.js"
export {Account} from "./Account.js"
export {Setting} from "./Setting.js"
export {SettingsUi} from "./SettingsUi.js"
export {TaskStatus} from "./TaskStatus.js"
