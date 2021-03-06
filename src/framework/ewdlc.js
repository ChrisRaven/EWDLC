import {Preferences} from "./Preferences.js"
import {Account} from "./Account.js"
import {SettingsUi} from "./SettingsUi.js"

/**
 * The main entrypoint of the framework
 */
function EWDLC(staticDir) {
    var _this = this;
    var _isInit = false;
    var _staticDir = staticDir;

    _this.preferences = new Preferences(_this);
    _this.account = new Account();
    _this.modules = {};
    _this.settingsUi = new SettingsUi();

    _this.init = function() {
        if(_isInit) return;

        _this.preferences.init();
        let intv = setInterval(function () {
          if (typeof account === 'undefined' || !account.account.uid) {
            return;
          }

          clearInterval(intv);
          $(document).trigger('ewdlc-account-ready');
          _this.account.setReady(true);
          _isInit = true;
        }, 50);
    };

    _this.getResourceUrl = function(resource) {
        return _staticDir + resource;
    }
}

export {EWDLC}
export {Preferences} from "./Preferences.js"
export {Account} from "./Account.js"
export {Setting} from "./Setting.js"
export {SettingsUi} from "./SettingsUi.js"
export {TaskStatus} from "./TaskStatus.js"
