import {Setting} from "../../framework/Setting.js"

function TabbedPrefs(callback) {
    var settings = {
        "tc-show-timestamp": new Setting("tc-show-timestamp", true),
        "tc-show-all-in-tabs": new Setting("tc-show-all-in-tabs", true),
        "tc-show-points-msgs": new Setting("tc-show-points-msgs", true),
        "tc-show-only-all": new Setting("tc-show-only-all", false),
        "tc-disable-unread": new Setting("tc-disable-unread", false),
        "tc-grayout-messages": new Setting("tc-grayout-messages", false),
        "tc-skip-leaderboard": new Setting("tc-skip-leaderboard", false)
    };

    var lang = [
        {key: "tc-show-timestamp", lang: "Show Timestamp"},
        {key: "tc-show-all-in-tabs", lang: "Show Normal Messages in Tabs"},
        {key: "tc-show-only-all", lang: "Show Only All Messages in All"},
        {key: "tc-show-points-msgs", lang: "Show Points Messages"},
        {key: "tc-disable-unread", lang: "Disable Unread Messages Counter"},
        {key: "tc-grayout-messages", lang: "Show grayed out messages instead of hiding"},
        {key: "tc-skip-leaderboard", lang: "Don't show leaderboard after submitting cubes"},
    ]

    var _this = this;

    _this.set = function(setting, value) {
        settings[setting].setValue(value);
    };

    _this.get = function(setting) {
        return settings[setting].getValue();
    };

    $(window).on("ewdlc-preferences-loading.tabbedChat", function() {
        for(var setting in settings) {
            window.ewdlc.preferences.registerSetting(settings[setting]);
            settings[setting].registerCallback(callback);
        }
    });

    $(window).on("ewdlc-preferences-loaded.tabbedChat", function() {
        for(let i in lang) {
            window.ewdlc.settingsUi.makeCheckbox(settings[lang[i].key], lang[i].lang);
        }
    })
}

export {TabbedPrefs}