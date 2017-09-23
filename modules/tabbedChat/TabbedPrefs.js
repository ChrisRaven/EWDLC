// require ../../framework/Setting.js

/* global EWDLC:false */

function TabbedPrefs(callback) {
    var settings = {
        "tc-show-timestamp": new window.EWDLC.Setting("tc-show-timestamp", true),
        "tc-show-all-in-tabs": new window.EWDLC.Setting("tc-show-all-in-tabs", true),
        "tc-show-points-msgs": new window.EWDLC.Setting("tc-show-points-msgs", true),
        "tc-show-only-all": new window.EWDLC.Setting("tc-show-only-all", false),
        "tc-disable-unread": new window.EWDLC.Setting("tc-disable-unread", false),
        "tc-grayout-messages": new window.EWDLC.Setting("tc-grayout-messages", false),
        "tc-skip-leaderboard": new window.EWDLC.Setting("tc-skip-leaderboard", false)
    };

    var self = this;

    this.set = function(setting, value) {
        settings[setting].setValue(value);
    };

    this.get = function(setting) {
        return settings[setting].getValue();
    };

    function init(data) {
        $(data).appendTo("#settingsMenu");

        console.log(settings);

        $("#settingsMenu .tcSettingsGroup input").checkbox().each(function() {
            var elem = $(this);
            var input = elem.find("[id]");
            var setting = input.attr("id");
            input.prop("checked", settings[setting]);
            if(settings[setting].getValue()) {
                elem.removeClass("off").addClass("on");
            }
            else {
                elem.removeClass("on").addClass("off");
            }
        });
        $("#settingsMenu .tcSettingsGroup input").change(function(e) {
            e.stopPropagation();
            var elem = $(this);
            var pref = elem.attr("id");
            self.set(pref, elem.is(":checked"));
            //callback();
        });
        $("#settingsMenu .tcSettingsGroup .checkbox").click(function(e) {
            var elem = $(this).find("input");
            elem.prop("checked", !elem.is(":checked"));
            elem.change();
        });
        $("#settingsMenu .tcSettingsGroup input").closest("div.setting").click(function(e) {
            e.stopPropagation();
            var elem = $(this).find("input");
            elem.prop("checked", !elem.is(":checked"));
            elem.change();
        });
    }

    $(window).on("ewdlc-preferences-loading.tabbedChat", function() {
        for(var setting in settings) {
            window.ewdlc.preferences.registerSetting(settings[setting]);
            settings[setting].registerCallback(callback);
        }
    });

    $.get("https://crazyman4865.com/eyewire/static/tabchat/settings.html").done(init);
}