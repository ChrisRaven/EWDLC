import {Setting} from "./Setting.js"

/**
 * Manages and stores settings in local storage
 * 
 * @param {Object} ewdlc 
 */
function Preferences(ewdlc) {
    var _this = this;
    var _settings = {};
    var _settingsName = "ewdlc-prefs";
    var _isInit = false;

    function _loadSettings() {
        let stored = localStorage.getItem(_settingsName);
        if(!stored) return;

        let settingsJson = JSON.parse(stored);

        for(let name in settingsJson) {
            let setting = _this.getSetting(name);

            if(!setting) continue;

            setting.setValue(settingsJson[name]);
        }
    }

    function _saveSettings() {
        let json = {};

        for(let name in _settings) {
            json[name] = _settings[name].getValue();
        }

        localStorage.setItem(_settingsName, JSON.stringify(json));
    }

    /**
     * Registers a setting to keep persistent
     * 
     * @param {Object} setting The setting to register
     */
    _this.registerSetting = function(setting) {
        if(!setting || !(setting instanceof Setting)) return;

        _settings[setting.getName()] = setting;
        _settings[setting.getName()].registerCallback(_saveSettings);
    };

    /**
     * Returns a setting with the given name.
     * 
     * @param {string} name The name of the setting
     * @returns {Object}
     */
    _this.getSetting = function(name) {
        return _settings[name];
    };

    /**
     * Initializes the class and loads the stored settings
     */
    _this.init = function() {
        if(_isInit) return;

        $(window).trigger("ewdlc-preferences-loading");
        
        _loadSettings();
        
        $(window).trigger("ewdlc-preferences-loaded");

        _isInit = true;
    };
}

export {Preferences}
