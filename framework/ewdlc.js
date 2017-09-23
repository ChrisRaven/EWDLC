// require Preferences.js
// require Account.js
/* global Preferences:false */

/**
 * The main entrypoint of the framework
 */
function EWDLC() {
    var _this = this;
    var _isInit = false;

    _this.preferences = new Preferences(_this);
    _this.account = new EWDLC.Account();

    _this.init = function() {
        if(_isInit) return;

        _this.preferences.init();
        _this.account.refreshInfo().then(() => $(window).trigger("ewdlc-account-ready"));

        _isInit = true;
    };
}