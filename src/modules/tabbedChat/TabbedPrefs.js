import {Setting} from "../../framework/Setting.js"

function TabbedPrefs(callback) {
    var settings = {
        "tc-show-timestamp": new Setting("tc-show-timestamp", true),
        "tc-show-all-in-tabs": new Setting("tc-show-all-in-tabs", true),
        "tc-show-points-msgs": new Setting("tc-show-points-msgs", true),
        "tc-show-channels-in-all": new Setting("tc-show-channels-in-all", true),
        "tc-enable-unread": new Setting("tc-enable-unread", true),
        "tc-grayout-messages": new Setting("tc-grayout-messages", false),
        "tc-show-leaderboard": new Setting("tc-show-leaderboard", true),
        "tc-allow-backslash-prefix": new Setting("tc-allow-backslash-prefix", true),
        "tc-enable-markup": new Setting("tc-enable-markup", true),
        "tc-show-connection-statuses": new Setting("tc-show-connection-statuses", false)
    };

    var lang = [
        {key: "tc-show-timestamp", lang: "Chat Timestamp"},
        {key: "tc-show-all-in-tabs", lang: "General Chat visible in all channels"},
        {key: "tc-show-channels-in-all", lang: "All channels visible in General Chat"},
        {key: "tc-show-points-msgs", lang: "Points messages"},
        {key: "tc-enable-unread", lang: "Unread messages counter"},
        {key: "tc-grayout-messages", lang: "Show all hidden messages as faded instead"},
        {key: "tc-show-leaderboard", lang: "Leaderboard pop-up after cube submission"},
        {key: "tc-allow-backslash-prefix", lang: "Allow backslash as command prefix"},
        {key: "tc-enable-markup", lang: "Enable markup"},
        {key: "tc-show-connection-statuses", lang: "Show connection statuses"}
    ]

    var _this = this;

    _this.set = function(setting, value) {
        settings[setting].setValue(value);
    };

    _this.get = function(setting) {
        return settings[setting].getValue();
    };

    $(document).on("ewdlc-preferences-loading", function() {
        for(var setting in settings) {
            if (settings.hasOwnProperty(setting)) {
                ewdlc.preferences.registerSetting(settings[setting]);
                settings[setting].registerCallback(callback);
            }
        }
    });

    $(document).on("ewdlc-preferences-loaded", function() {
        for(let i in lang) {
            if (lang.hasOwnProperty(i)) {
                ewdlc.settingsUi.makeCheckbox(settings[lang[i].key], lang[i].lang);
            }
        }
    })
}

export {TabbedPrefs}