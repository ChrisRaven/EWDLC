var EWDLC = (function (exports) {
'use strict';

/**
 * Holds information about a setting
 * @constructor
 * @param {string} name The unique identifier of this setting
 * @param {*} [value] The initial value of this setting
 * @param {*} [dflt] The default value of this setting
 */
function Setting(name, value, dflt) {
    var _this = this;
    var _callbacks = new Set();
    var _name = name;
    var _default = dflt;
    var _value = value;

    /**
     * Returns the name of this setting
     * 
     * @return {string}
     */
    _this.getName = function() {
        return _name;
    };

    /**
     * Gets the default value of this function
     * 
     * @return {*}
     */
    _this.getDefault = function() {
        return _default;
    };

    /**
     * Sets the default value of this function
     * 
     * @param {*} def the new default value
     */
    _this.setDefault = function(def) {
        _default = def;
    };

    /**
     * Adds a callback to be invoked when the value of this setting changes
     * 
     * @param {settingChanged} callback The callback to add
     */
    _this.registerCallback = function(callback) {
        if(!callback || typeof(callback) !== typeof(Function)) return;

        _callbacks.add(callback);
    };

    /**
     * Removes a value change callback
     * 
     * @param {settingChanged} callback The callback to remove
     */
    _this.unregisterCallback = function(callback) {
        _callbacks.delete(callback);
    };

    /**
     * Gets the value held by this setting
     * 
     * @return {*}
     */
    _this.getValue = function() {
        return _value;
    };

    /**
     * Sets the value held by this setting and invokes the callbacks if it's changed
     * 
     * @param {*} value The value to set
     */
    _this.setValue = function(value) {
        if(_value === value) return;

        _value = value;
        _callbacks.forEach((callback) => callback(_name, _value));
    };

    /**
     * Resets the setting value to its default
     */
    _this.reset = function() {
        _this.setValue(_default);
    };
}

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

        $(document).trigger("ewdlc-preferences-loading");
        
        _loadSettings();
        
        $(document).trigger("ewdlc-preferences-loaded");

        _isInit = true;
    };
}

function Account(username) {
    var _this = this;
    var _username = username;
    var _isReady = false;

    function _readAccountData(data) {
        _username = data.username;
    }

    _this.getUsername = function() {
        return _username;
    };

    _this.isReady = function() {
        return _isReady;
    };

    _this.refreshInfo = function() {
        return new Promise((resolve, reject) => {
            let url = "/1.0/player/";

            if(!_username) {
                url += "describe";
            } else {
                url += _username + "/bio";
            }

            $.getJSON(url)
                .done((data) => {_readAccountData(data); _isReady = true; resolve();})
                .fail(reject);
        });
    };
}

function SettingsUi() {
    var _this = this;
    var _$container;

    function makeContainer() {
        _$container = $("<div>").addClass("settings-group invisible");
        $("<h1>").text("EyeWire DLC").appendTo(_$container);

        _$container.appendTo("#settingsMenu");
    }

    _this.makeCheckbox = function(setting, desc) {
        if(!setting || !(setting instanceof Setting) || !desc) return;

        if(!_$container) makeContainer();

        let $setting = $("<div>").addClass("setting");
        $("<span>").text(desc).appendTo($setting);

        let $input = $("<input>").attr("type", "checkbox").hide().appendTo($setting);

        $input.prop("checked", setting.getValue() ? true : false);

        $input.checkbox().each(function () {
            var elem = $(this);
            
            if (setting.getValue()) {
                elem.removeClass("off").addClass("on");
            } else {
                elem.removeClass("on").addClass("off");
            }
        });
        $input.change(function (e) {
            e.stopPropagation();
            var elem = $(this);
            setting.setValue(elem.is(":checked"));
        });
        $setting.find(".checkbox").click(function (e) {
            var elem = $input;
            elem.prop("checked", !elem.is(":checked"));
            elem.change();
        });
        $setting.click(function (e) {
            e.stopPropagation();
            var elem = $input;
            elem.prop("checked", !elem.is(":checked"));
            elem.change();
        });

        var $firstButton = _$container.find(".setting > .minimalButton").first();

        if($firstButton.length > 0)
            $setting.insertBefore($firstButton.parent());
        else
            $setting.appendTo(_$container);
    };

    _this.makeButton = function(name) {
        if(!name) return;

        if(!_$container) makeContainer();

        let $setting = $("<div>").addClass("setting");
        let $button = $("<div>").addClass("minimalButton").text(name).appendTo($setting);
        $setting.appendTo(_$container);

        return $button;
    };
}

var TaskStatus = {
    normal: 0,
    frozen: 10,
    stashed: 6,
    duplicate: 11
};

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
        _this.account.refreshInfo().then(() => $(document).trigger("ewdlc-account-ready"));

        _isInit = true;
    };

    _this.getResourceUrl = function(resource) {
        return _staticDir + resource;
    };
}

function Tab(options) {
    options = options || {};

    var _name = options.name;
    var _prefix = options.prefix;
    var _scope = options.scope;
    var _unreadMessages = 0;
    var _isClosed = false;

    var _this = this;
    var _$textElem = $("<span>").text(_name);
    var _$tabElem = $("<div>").addClass("chatTab").append(_$textElem)
    .append($("<span>").css("margin-left", "3px").addClass("sl-badge").text("0").hide())
    .append($("<i>").addClass("fa").addClass("fa-close").css("margin-left", "3px").hide());

    _this.getElement = function() {
        return _$tabElem;
    };

    _this.getPrefix = function () {
        return _prefix;
    };

    _this.getScope = function() {
        return _scope;
    };

    _this.getName = function() {
        return _name;
    };

    _this.getUnread = function() {
        return _unreadMessages;
    };

    _this.isPMTab = function() {
        return _prefix.startsWith("/pm");
    };

    _this.isClosed = function() {
        return _isClosed;
    };

    _this.setName = function(nameToSet) {
        _name = nameToSet;
        _$tabElem.text(name);
    };

    _this.setActive = function(active) {
        if(active) {
            _unreadMessages = 0;
            _$tabElem.addClass("active");
        }
        else {
            _$tabElem.removeClass("active");
        }
    };

    _this.setUnread = function(unread) {
        if(!isNaN(unread) && unread >= 0) {
            _unreadMessages = unread;
            let $span = _$tabElem.children("span.sl-badge");
            $span.text(_unreadMessages);

            if(_unreadMessages > 0) {
                $span.show();
            } else {
                $span.hide();
            }
        }
    };

    _this.close = function() {
        _$tabElem.removeClass("active").addClass("disabled");
        _$tabElem.css("margin-left", -_$tabElem.outerWidth() + "px");
        _isClosed = true;
    };

    _this.open = function() {
        _$tabElem.removeClass("disabled");
        _$tabElem.css("margin-left", "0px");
        _isClosed = false;
    };

    if(_prefix.startsWith("/pm")) {
        _$tabElem.children("i").show();
        $.get("/1.0/player/" + _scope + "/bio").done(function(data) {
            if($(".chatInput").val().startsWith(_prefix)) {
                $(".chatInput").val("/pm " + data.username + " " + $(".chatInput").val().substring(_prefix.length));
            }
            _scope = data.username;
            _prefix = "/pm " + data.username + " ";
            _$textElem.text(_scope);
        });
    }
}

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
        "tc-enable-markup": new Setting("tc-enable-markup", true)
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
        {key: "tc-enable-markup", lang: "Enable markup"}
    ];

    var _this = this;

    _this.set = function(setting, value) {
        settings[setting].setValue(value);
    };

    _this.get = function(setting) {
        return settings[setting].getValue();
    };

    $(document).on("ewdlc-preferences-loading.tabbedChat", function() {
        for(var setting in settings) {
            if (settings.hasOwnProperty(setting)) {
                ewdlc.preferences.registerSetting(settings[setting]);
                settings[setting].registerCallback(callback);
            }
        }
    });

    $(document).on("ewdlc-preferences-loaded.tabbedChat", function() {
        for(let i in lang) {
            if (lang.hasOwnProperty(i)) {
                ewdlc.settingsUi.makeCheckbox(settings[lang[i].key], lang[i].lang);
            }
        }
    });
}

function CommandProcessor(tabbedChat) {
    var boundCallbacks = {};

    this.bind = function(command, description, usage, callback) {
        boundCallbacks[command] = {};
        boundCallbacks[command].description = description;
        boundCallbacks[command].usage = usage;
        boundCallbacks[command].callback = callback;
    };

    this.unbind = function(command) {
        if(boundCallbacks[command]) {
            delete boundCallbacks[command];
        }
    };

    this.exec = function(msg) {
        if(!msg) return false;

        var msgSplit = msg.split(' ');

        if(msgSplit.length === 0) return false;

        var callback = boundCallbacks[msgSplit[0]];

        if(callback) {
            callback.callback(msgSplit);
            return true;
        }

        return false;
    };

    function err() {
        tomni.chat.addMsg({}, "An error was encountered while running this command. Please wait a moment and try again.");
    }

    function filterByStatus(tasks) {
        return tasks.filter(function(task) {return task.status != TaskStatus.frozen && task.status != TaskStatus.stashed});
    }

    function help(args) {
        tomni.chat.addMsg({}, "------------------");
        tomni.chat.addMsg({}, "Tabbed Chat commands:");

        for(var key in boundCallbacks) {
            if(key === "/help") continue;

            var bound = boundCallbacks[key];
            var msg = key;

            if(bound.description || bound.usage) msg += ": ";
            if(bound.description) msg += bound.description;
            if(bound.description && bound.usage) msg += ", Usage: ";
            if(bound.usage) msg += bound.usage;
            tomni.chat.addMsg({}, msg);
        }

        tomni.chat.addMsg({}, "------------------");
    }

    function getCellLimit(args) {
        var cellId = tomni.cell;
        var limit = 15;

        if(args.length >= 2) {
            if(args[1].toLowerCase() === "this") {
                cellId = tomni.cell;
            } else {
                cellId = parseInt(args[1]);
                if(isNaN(cellId) || cellId <= 0) {
                    return {cellId: -1, limit: limit};
                }
            }
        }

        if(args.length >= 3) {
            limit = parseInt(args[2]);
            if(isNaN(limit)) {
                return {cellId: -1, limit: limit};
            }
        }

        if(limit <= 0) {
            limit = 99999;
        }

        return {cellId: cellId, limit: limit};
    }

    function lowWt(args) {
        var processWt = function(counter, lim, wt, frozen, data) {
            var newLine = 0;
            var oldCounter = counter;
            var msg = "";
            if(data[wt] && data[wt].length > 0 && data[wt].findIndex(function(elem) {return $.inArray(elem.task_id, frozen) >= 0;})) {
                msg += "Weight " + wt + ":\n  ";

                for(var i = data[wt].length-1; i >= 0; i--) {
                    if($.inArray(data[wt][i].task_id, frozen) >= 0) continue;

                    msg += "#" + data[wt][i].task_id;

                    if(counter < lim - 1 || i !== 0) {
                        msg += "  ";
                    }

                    newLine++;
                    counter++;
                    if(counter === lim)
                        break;

                    if(newLine === 4 && i > 0) {
                        msg += "\n ";
                        newLine = 0;
                    }
                }
            }

            return {msg: msg, counter: counter, any: oldCounter != counter};
        };

        var help = function() {
            tomni.chat.addMsg({}, "Usage: /low-wt [cell=this] [limit=15]");
        };

        if(!ewdlc.account.isScout()) {
            tomni.chat.addMsg({}, "You must be a scout or higher to use this command.");
            return;
        }

        var result = getCellLimit(args);

        if(result.cellId < 0) {
            help(); return;
        }

        var cellId = result.cellId;
        var limit = result.limit;

        if(args.length > 3) {
            help(); return;
        }

        tomni.chat.history.add(args.join(' '));

        $.get("/1.0/cell/" + cellId + "/heatmap/scythe").done(function(scytheData) {
            var frozen = scytheData.frozen;

            $.get("/1.0/cell/" + cellId + "/heatmap/low-weight?weight=3").done(function(data) {
                var count = 0;

                var msg = "Low weight cubes in cell " + cellId + " (limit " + limit + "): ";

                for(var i = 0; i < 3; i++) {
                    var ret = processWt(count, limit, i.toString(), frozen, data);
                    if(ret.any) {
                        msg += "\n ";
                    }
                    msg += ret.msg;
                    count = ret.counter;

                    if(count >= limit) break;
                }

                if(count === 0) {
                    tomni.chat.addMsg({}, "There are no low weight cubes in cell " + cellId);
                } else {
                    tomni.chat.addMsg({}, msg);
                }
            }).fail(err);
        }).fail(err);
    }

    function clear(args) {
        $(".chatMsgContainer").empty();
        tomni.chat.addMsg({}, "The chat has been cleared.");
    }

    function scInfo(args) {
        var help = function() {
            tomni.chat.addMsg({}, "Usage: /sc-info [cell=this] [limit=15]");
        };

        var cleanTasks = function(potentialTasks, taskArray) {
            for(var i = 0; i < taskArray.length; i++) {
                var index = potentialTasks.indexOf(taskArray[i]);

                if(index >= 0) {
                    potentialTasks.splice(index, 1);
                }
            }

            return potentialTasks;
        };

        if(!account.can('scythe mystic admin')) {
            tomni.chat.addMsg({}, "You must be a scythe or higher to use this command.");
            return;
        }

        var result = getCellLimit(args);

        if(result.cellId < 0) {
            help(); return;
        }

        var cellId = result.cellId;
        var limit = result.limit;

        if(args.length > 3) {
            help(); return;
        }

        tomni.chat.history.add(args.join(' '));
        tomni.chat.addMsg({}, "Please wait while Grim's minions collect some data...");

        $.when($.getJSON("/1.0/cell/" + cellId + "/tasks"), $.getJSON("/1.0/cell/" + cellId + "/heatmap/scythe"),
               $.getJSON("/1.0/cell/" + cellId + "/tasks/complete/player"))
            .done(function(tasks, scytheData, completeData) {
                tasks = filterByStatus(tasks[0].tasks);
                scytheData = scytheData[0];
                completeData = completeData[0];

                var potentialTasks = tasks.map(t => t.id);
                var frozen = scytheData.frozen || [];
                var complete = scytheData.complete || [];

                for(var i = 0; i < complete.length; i++) {
                    var cur = complete[i];
                    if(cur.votes < 2) continue;

                    var index = potentialTasks.indexOf(complete[i].id);

                    if(index >= 0) {
                        potentialTasks.splice(index, 1);
                    }
                }

                cleanTasks(potentialTasks, tasks.filter(t => t.weight < 3).map(t => t.id));
                cleanTasks(potentialTasks, frozen);

                var myTasks = completeData.scythe[account.account.uid.toString()] || [];
                myTasks = myTasks.concat(completeData.admin[account.account.uid.toString()] || []);

                cleanTasks(potentialTasks, myTasks);

                var count = 0;

                var msg = "Scythe info for cell " + cellId + " (limit " + limit + "):\n";
                msg += "Your SC count: " + myTasks.length + "\n";
                msg += "Cubes you can SC: " + potentialTasks.length + "\n";

                if(potentialTasks.length > 0) {
                    msg += "List:\n ";

                    for(var i = 0; i < potentialTasks.length; i++) {
                        msg += "#" + potentialTasks[i] + " ";

                        count++;
                        if(count === limit)
                            break;
                    }
                }

                tomni.chat.addMsg({}, msg);
            })
            .fail(err);
    }

    function lowWtSC(args) {
        // source: https://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript#comment77733737_1885569
        let intersection = function (a1, a2) {
            return a1.filter(n => a2.includes(n));
        };

        if(!account.can('scythe mystic admin')) {
            tomni.chat.addMsg({}, "You must be a scythe or higher to use this command.");
            return;
        }

        var result = getCellLimit(args);

        if(result.cellId < 0) {
            return;
        }

        var cellId = result.cellId;
        var limit = result.limit;

        if(args.length > 3) {
            return;
        }

        tomni.chat.history.add(args.join(' '));


        $.when($.getJSON("/1.0/cell/" + cellId + "/heatmap/low-weight?weight=3"),
               $.getJSON("/1.0/cell/" + cellId + "/tasks/complete/player"))
            .done(function (lowWt, completeData) {
                lowWt = lowWt[0];
                completeData = completeData[0];

                let myTasks = completeData.scythe[account.account.uid.toString()] || [];
                myTasks = myTasks.concat(completeData.admin[account.account.uid.toString()] || []);

                let ids = [];
                for (let i = 0; i < 3; i++) {
                    let wts = lowWt[i];
                    for (let j = 0; j < wts.length; j++) {
                        ids.push(wts[j].task_id);
                    }
                }

                let result = intersection(myTasks, ids);

                var count = 0;

                var msg = "Low weight SC info for cell " + cellId + " (limit " + limit + "):\n";
                msg += "Cubes you completed with low weight: " + result.length + "\n";

                if(result.length > 0) {
                    msg += "List:\n ";

                    for(var i = 0; i < result.length; i++) {
                        msg += "#" + result[i] + " ";

                        count++;
                        if(count === limit)
                            break;
                    }
                }

                tomni.chat.addMsg({}, msg);
            })
            .fail(err);
    }

    
    function addCell(args) {
        let params, id, color;
        let originalColors;
        let originalColorUtils_rotate;

        for(let i = 1; i < args.length; i++) {
            if (args[i].indexOf('#') !== -1) {
                params = args[i].split('#');
                id = parseInt(params[0], 10);
                color = params[1];
            }
            else {
                id = parseInt(args[i], 10);
                color = false;
            }

            if (color) {
                if (tomni.prefs.get('plasticize')) {
                    originalColorUtils_rotate = ColorUtils.rotate;
                    ColorUtils.rotate = function () {
                        return ColorUtils.hexToRGB(color);
                    };
                }
                else {
                    originalColors = Cell.colors;
                    Cell.colors = {
                        custom: {
                            rgb: ColorUtils.hexToRGB(color)
                        }
                    };
                }
            }

            if(id) {
                $.when(tomni.threeD.addCell({cellid: id, center: true}))
                .then(function (cell) {
                    if (tomni.prefs.get('plasticize')) {
                        ColorUtils.rotate = originalColorUtils_rotate;
                    }
                    else {
                        Cell.colors = originalColors;
                    }
                });
            }
        }
    }

    function removeCell(args) {
        for(var i = 1; i < args.length; i++) {
            var id = parseInt(args[i], 10);
            if(!isNaN(id)) {
                tomni.threeD.removeCell(id);
            }
        }
    }

    function hideCell() {
        tomni.getCurrentCell().hide();
    }

    function showCell() {
        tomni.getCurrentCell().show();
    }

    function cellSize(args) {
        var cellInfo = tomni.threeD.getCell(tomni.cell).info;
        tomni.chat.history.add(args[0]);

        $.get("/1.0/cell/" + tomni.cell + "/tasks").done(function(data) {
            var filteredTasks = data.tasks.filter(function(task) {return task.status != TaskStatus.stashed});
            tomni.chat.addMsg({}, cellInfo.name + " is " + filteredTasks.length + " cube" + (data.tasks.length !== 1 ? "s" : "") + " big.");
        }).fail(err);
    }

    function cubeDupes(args) {
        if(!account.can('scout scythe mystic admin')) {
            tomni.chat.addMsg({}, "You must be a scout or higher to use this command.");
            return;
        }

        tomni.chat.history.add(args[0]);

        if(!tomni.gameMode || !tomni.task.inspect) {
            tomni.chat.addMsg({}, "You must be inspecting a cube to use this command.");
            return;
        }

        if(tomni.task.duplicates.length === 0) {
            tomni.chat.addMsg({}, "There are no duplicates in this cube.");
            return;
        }

        var msg = "Duplicates in the current cube:\n ";
        msg += tomni.task.duplicates.map(function(e) { return "#" + e.task_id;}).join(' ');
        tomni.chat.addMsg({}, msg);
    }

    function huntGuess(args) {
        if(!tomni.getCurrentCell().info.is_hunt) {
            tomni.chat.addMsg({}, "You must be in a hunt cell to use this command.");
            return;
        }

        var center = tomni.center.rotation.clone().multiplyScalar(100).round().multiplyScalar(1/100).floor();
        center = [center.x, center.y, center.z];
        center = center.join(" ");

        var msg = "/pm thehunt " + center;
        tomni.chat.submitChatMessage(msg);
    }

    this.bind("/help", "", "", help);
    this.bind("/add-cell", "Adds one or more cells to the overview", "/add-cell Cell ID 1[#hhhhhh] [Cell ID 2[#hhhhhh]] ..., where hhhhhh is a hex color code", addCell);
    this.bind("/remove-cell", "Removes one or more cells from the overview", "/remove-cell Cell ID 1 [Cell ID 2] ...", removeCell);
    this.bind("/show-cell", "Shows the current cell (if it was hidden using /hide-cell)", "", showCell);
    this.bind("/hide-cell", "Hides the current cell", "", hideCell);
    this.bind("/size", "Shows the size of the current cell", "", cellSize);
    this.bind("/guess", "Submits your current coordinates as a hunt guess", "", huntGuess);
    this.bind("/clear", "Clears the chat", "", clear);
    if(account.can('scout scythe mystic admin')) {
        this.bind("/dupe", "Lists the duplicates in the current cube", "", cubeDupes);
    }
    if(account.can('scythe mystic admin')) {
        this.bind("/low-wt", "Lists low weight cubes in cell", "/low-wt [cell=this] [limit=15]", lowWt);
        this.bind("/sc-info", "Shows count of the SC you've done, the amount you can do, and lists cube IDs with SC < 2, wt >= 3", "/sc-info [cell=this] [limit=15]", scInfo);
        this.bind("/low-wt-sc", "Shows count and list of the SC you've done, where wt < 3", "/low-wt-sc [cell=this] [limit=15]", lowWtSC);
    }
}

/* global Keycodes:false */

function TabbedChat() {
    var _tabs = [];
    var pmTabs = [];
    var activeTab;
    var _this = this;
    var chatInput = $(".chatInput");
    var scopes = ["(scouts)", "(mystics)", "(mods)", "(mentors)", "(admins)"];

    // Create the container
    var container = $("<div>").addClass("tabList").insertAfter(".chatInput");

    _this.addTab = function (name, prefix, scope) {
        var tab = new Tab({name: name, prefix: prefix, scope: scope});
        container.append(tab.getElement());
        
        tab.getElement().on("click.tabbedChat", function(e) {
            if(activeTab === tab) {
                return;
            }

            activeTab.setActive(false);
            tab.setActive(true);
            tab.setUnread(0);
            e.stopPropagation();

            // Change the prefix if the chat input is empty
            if(!chatInput.val().trim() || chatInput.val().startsWith("/pm ") || _tabs.findIndex(function(elem) {return chatInput.val().trim() === elem.getPrefix().trim();}) >= 0 ) {
                chatInput.val(tab.getPrefix());
            }
            activeTab = tab;

            chatInput.focus();
            filterMessages();

            $(".chatMsgContainer").scrollTop($(".chatMsgContainer")[0].scrollHeight);
        });
        tab.getElement().children("i").on("click.tabbedChat", function(e) {
            tab.close();
            _tabs[0].getElement().click();
            e.stopPropagation();

            checkTabsShouldShow();
        });

        _tabs.push(tab);

        checkTabsShouldShow();

        return tab;
    };

    this.prefs = new TabbedPrefs(updateSettings);

    _this.getActiveTab = function() {
        return activeTab;
    };

    function _getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function makeMsg(elem) {
        var username = elem.children(".userName").text();
        var hasUsername = elem.children(".userName").length !== 0;
        var scopeText = elem.children(".dialogNobody").not(".tc-timestamp,.tc-msg-text").text().trim();
        var target = scopeText.substring(1, scopeText.length - 1);
        var content = elem.find('.actualText').html();

        var msg = {
            username: username,
            hasUsername: hasUsername,
            scopeText: scopeText,
            target: target,
            contentNode: elem.find('.actualText')
        };

        return msg;
    }

    function isPointMsg(text) {
        return (text.includes(" earned ") && text.includes(" points")) ||
            text.includes(" trailblazed a cube") || text.includes(" scythed a cube for") ||
            text.includes(" scouted a cube for");
    }

    function checkTabsShouldShow() {
        if(openTabsCount() > 1) {
            showTabs();
        } else {
            hideTabs();
        }
    }

    function openTabsCount() {
        return _tabs.filter(function(tab) {return !tab.isClosed();}).length;
    }

    function showTabs() {
        let $chatInput = $('.chatInput');

        $chatInput.animate({bottom: '50px'}, {complete: function() {container.fadeIn();}});
        $('.chatMsgContainer').animate({bottom: (50 + $chatInput.outerHeight(true)) + 'px'});
    }

    function hideTabs() {
        container.fadeOut(function() {
            let $chatInput = $('.chatInput');

            $chatInput.animate({bottom: '10px'});
            $('.chatMsgContainer').animate({bottom: (10 + $chatInput.outerHeight(true)) + 'px'});
        });
    }

    function isCrewMsg(text) {
        return text.includes(" joined crew ");
    }

    function shouldBeHidden(msg, elem) {
        var username = msg.username.toLowerCase();
        var hasUsername = msg.hasUsername;
        var scopeText = msg.scopeText;
        var target = msg.target.toLowerCase();

        var scopeIndex = scopes.indexOf(scopeText);

        if(activeTab.getName() === "All") {
            if(hasUsername && scopeText && !_this.prefs.get("tc-show-channels-in-all"))
                return true;

            if(!_this.prefs.get("tc-show-points-msgs")) {
                var text = elem.find(".dialogNobody").text();

                if(isPointMsg(text)) {
                    return true;
                }
            }

            return false;
        }

        if(activeTab.getName() === "Commands") {
            var msgText = elem.find(".dialogNobody").text();
            if(hasUsername || isPointMsg(msgText) || isCrewMsg(msgText)) return true;
            if(elem.find(".special,.generic").length > 0) return true;

            return false;
        }

        if(hasUsername) {
            if(scopeIndex >= 0) {
                return scopeText !== activeTab.getScope();
            }
            if(!scopeText && _this.prefs.get("tc-show-all-in-tabs") && !activeTab.isPMTab())
                return false;
            if((scopeText === "(private)" && activeTab.getScope().toLowerCase() === username) ||
               (pmTabs.indexOf(target) >= 0 && activeTab.getScope().toLowerCase() === target)) {
                return false;
            }
        }

        if(!hasUsername && !activeTab.isPMTab()) {
            return isPointMsg(elem.find(".dialogNobody").text());
        }

        if(elem.find(".special").length > 0 && !activeTab.isPMTab())
            return false;

        return true;
    }

    function filterMessages() {
        var toHide = [];
        var toShow = [];
        var toGray = [];
        var toUngray = [];

        var grayout = _this.prefs.get("tc-grayout-messages");
        var isCommands = activeTab.getName() === "Commands";

        $(".chatMsg").each(function() {
            var msg = makeMsg($(this));
            checkStamp($(this), msg);
            if(shouldBeHidden(msg, $(this))) {
                if(msg.hasUsername && grayout && !isCommands) {
                    toGray.push($(this));
                    toShow.push($(this));
                } else {
                    toHide.push($(this));
                }
            }
            else {
                if(msg.hasUsername && grayout) {
                    toUngray.push($(this));
                }

                toShow.push($(this));
            }
        });

        $(toHide).map(function() {return this.toArray();}).hide();
        $(toShow).map(function() {return this.toArray();}).show();

        $(toGray).map(function() {return this.toArray();}).find(".tc-msg-text").addClass("dialogNobody");
        $(toUngray).map(function() {return this.toArray();}).find(".tc-msg-text").removeClass("dialogNobody");

        $(".chatMsgContainer").scrollTop($(".chatMsgContainer")[0].scrollHeight);
    }

    function updateSettings() {
        if(!_this.prefs.get("tc-enable-unread")) {
            for(var i = 0; i < _tabs.length; i++) {
                _tabs[i].setUnread(0);
            }
        }

        if(!_this.prefs.get("tc-grayout-messages")) {
            $(".chatMsg").find(".tc-msg-text").removeClass("dialogNobody");
        } else {
            $(".chatMsg").show();
        }

        filterMessages();
    }

    function checkPM(msg) {
        var username;
        var hasUsername = msg.hasUsername;
        var scopeText = msg.scopeText;

        if(!hasUsername || !scopeText) return;

        if(scopeText === "(private)") {
            username = msg.username;
        } else if(scopes.indexOf(scopeText) < 0 ) {
            username = scopeText.substring(1, scopeText.length - 1);
        } else {
            return;
        }

        if(pmTabs.indexOf(username.toLowerCase()) < 0) {
            pmTabs.push(username.toLowerCase());
            _this.addTab(username, "/pm " + username + " ", username);
        }
    }

    function checkStamp(elem, msg) {
        if(!msg.hasUsername) return;

        var timestamp = elem.find(".tc-timestamp");

        if(_this.prefs.get("tc-show-timestamp"))
            timestamp.show();
        else
            timestamp.hide();
    }

    var coordRegex = /&lt;([0-9]+)(,| |, )([0-9]+)(,| |, )([0-9]+)&gt;/g;

    function openCoord() {
        let groups = coordRegex.exec($(this).html());

        if(groups) {
            let x = parseInt(groups[1], 10);
            let y = parseInt(groups[3], 10);
            let z = parseInt(groups[5], 10);
            tomni.ui.recenterView(new THREE.Vector3(-x, -y, -z));
        }
    }

    function checkCoords($elem) {
        let html = $elem.html();

        let replaced = html.replace(coordRegex, function(match) {
            return '<span class="link coords">' + match + '</span>';
        });

        if (replaced !== html) {
            $elem.remove();

            $("<div>").addClass("chatMsg").html(replaced).appendTo($(".chatMsgContainer"));
            return true;
        }

        return false;
    }

    function addStamp(elem) {
        var date = new Date();
        var hours = date.getHours().toString();
        if(hours.length == 1) {
            hours = "0" + hours;
        }
        var minutes = date.getMinutes().toString();
        if(minutes.length == 1) {
            minutes = "0" + minutes;
        }
        var fullStr = hours + ":" + minutes;

        $("<span>").addClass("dialogNobody").addClass("tc-timestamp").html(fullStr + "&nbsp;").prependTo(elem);
    }

    function rclickTask(e) {
        if(window.getSelection().toString() !== "") {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        var matched = $(this).text().match(/^(t|task|tid)?#(\d+)$/i);
        var num = parseInt(matched[2],10);

        window.open(window.location.origin + "?tcJumpTaskId=" + num);
    }

    function clickTask(e) {
        $(this).addClass("clicked");
        e.stopPropagation();
    }

    function setRemainingChars() {
        $("#charLeft").text(Math.max(0, 180 - $(".chatInput").val().length));
    }

    function fastSwitch(e) {
        if(e.ctrlKey) {
            if(e.which === 188 || e.which === 190) {
                e.preventDefault();
                e.stopPropagation();

                var index = _tabs.indexOf(activeTab);
                if(e.which === 188) {
                    index--;
                    while(index >= 0 && _tabs[index].getElement().hasClass("disabled")) {
                        index--;
                    }

                    if(index >= 0) _tabs[index].getElement().click();
                } else if(e.which === 190) {
                    index++;
                    while(index < _tabs.length && _tabs[index].getElement().hasClass("disabled")) {
                        index++;
                    }

                    if(index < _tabs.length) _tabs[index].getElement().click();
                }
            }
        }
    }

    function applyMarkup(node) {
        let children = node[0].childNodes;
        let input;
        for (let i = 0, len = children.length; i < len; i++) {
            if (children[i].nodeType === 3) { // TEXT NODE
                input = children[i].data;

                let chr, output = '';
                let bFlag = false, uFlag = false, iFlag = false;

                for (let i = 0, inLen = input.length; i < inLen; i++) {
                    chr = input.charAt(i);

                    switch (chr) {
                        case '*':
                            output += bFlag ? '</b>' : '<b>';
                            bFlag = !bFlag;
                            break;
                        case '|':
                            output += iFlag ? '</i>' : '<i>';
                            iFlag = !iFlag;
                            break;
                        case '_':
                            output += uFlag ? '</u>' : '<u>';
                            uFlag = !uFlag;
                            break;
                        default:
                            output += chr;
                    }
                }

                let wrapper = document.createElement('span');
                wrapper.innerHTML = output;
                node[0].replaceChild(wrapper, children[i]);
            }
        }
    }



    // Add the default tab
    activeTab = _this.addTab("All", "", "");
    activeTab.setActive(true);

    // Add any tab per role
    function _addRoleTabs() {
        if(account.can('scythe mystic admin')) {
            _this.addTab("Commands", "", "");
        }
        if(account.can('scout scythe mystic admin')) {
            _this.addTab("Scouts", "/gm scouts ", "(scouts)");
        }
        if(account.can('mystic admin')) {
            _this.addTab("Mystics", "/gm mystics ", "(mystics)");
        }
        if(account.can('moderator admin')) {
            _this.addTab("Mods", "/gm mods ", "(mods)");
        }
        if(account.can('mentor admin')) {
            _this.addTab("Mentors", "/gm mentors ", "(mentors)");
        }
        if(account.can('admin')) {
            _this.addTab("Admins", "/gm admins ", "(admins)");
        }

        checkTabsShouldShow();
    }
    
    if(ewdlc && ewdlc.account.isReady()) {
        _this.commandProcessor = new CommandProcessor(_this);
        _addRoleTabs();
    } else {
        $(document).on("ewdlc-account-ready", function() {
            _addRoleTabs(); 
            _this.commandProcessor = new CommandProcessor(_this);
        });
    }

    chatInput
        .focus(function () {
            filterMessages();
            $("#charLeft").fadeIn(200);
        })
        .focusout(function () {
            $("#charLeft").fadeOut(200);
        });

    var mutationObserver = new MutationObserver(moCallback);
    mutationObserver.observe(document.getElementsByClassName('chatMsgContainer')[0], {
        childList: true,
        attributres: false,
        characterData: false,
        subtree: false
    });
    
    function moCallback(records) {
        var record = records[0];
        if (!record.addedNodes) return;
        var elem = $(record.addedNodes[0]);

        elem.find(".link.coords").on("click.tabbedChat", openCoord);
        if(elem.find(".tc-timestamp").length > 0 || elem.find(".link.coords").length > 0) return;

        elem.find(".taskid").on("click.tabbedChat", clickTask).contextmenu(rclickTask);

        var msg = makeMsg(elem);
        var scopeToSearch = "";
        var index;

        if(msg.hasUsername) {
            if (_this.prefs.get('tc-enable-markup')) {
                applyMarkup(msg.contentNode);
            }
            addStamp(elem);
            elem.find(".actualText").addClass("tc-msg-text");
        }
        checkStamp(elem, msg);
        checkPM(msg);

        if(shouldBeHidden(msg, elem)) {
            if(msg.hasUsername && _this.prefs.get("tc-grayout-messages") && activeTab.getName() !== "Commands") {
                elem.find(".actualText").addClass("dialogNobody");
            } else {
                elem.hide();
            }

            if(msg.hasUsername) {
                var sound = "chat_public";

                if(elem.find(".playerCallOut.me").length > 0) {
                    sound = "chat_private";
                }

                if(scopes.indexOf(msg.scopeText) >= 0) {
                    scopeToSearch = msg.scopeText;
                }
                else if(msg.scopeText === "(private)") {
                    sound = "chat_private";
                    scopeToSearch = msg.username;
                }
                else if(pmTabs.indexOf(msg.target) >= 0) {
                    scopeToSearch = msg.target;
                }

                if(chatInput.is(":focus")) {
                    SFX.play(sound);
                }

                index = _tabs.findIndex(function(elem) { return elem.getScope() == scopeToSearch; });
                if(_this.prefs.get("tc-enable-unread")) {
                    _tabs[index].setUnread(_tabs[index].getUnread()+1);
                }
            }
        }

        if(msg.scopeText === "(private)") {
            scopeToSearch = msg.username;
        }
        else if(pmTabs.indexOf(msg.target) >= 0) {
            scopeToSearch = msg.target;
        }

        index = _tabs.findIndex(function(elem) { return elem.getScope() == scopeToSearch; });
        _tabs[index].open();

        checkTabsShouldShow();

        chatInput.removeClass("pulsing");
        
        checkCoords(elem);
    }

    chatInput.off("keydown").keydown(function(e) {
        chatInput.click();
        if(e.ctrlKey) {
            fastSwitch(e);
        }
        if(e.keyCode !== Keycodes.codes.shift && !e.metaKey && !e.ctrlKey) {
            e.stopPropagation();
        }
        var chatMsg = $(this).val();

        if(e.keyCode === Keycodes.codes.enter) {
            if(!!e.shiftKey || e.metaKey || e.ctrlKey) {
                e.stopPropagation();
            }

            $(this).val("");
            tomni.chat.history.locator = -1;

            var index = _tabs.findIndex(function(elem) {return elem.getName() !== "All" && elem.getName() !== "Commands" && chatMsg.startsWith(elem.getPrefix());});

            if(index >= 0) {
                var prefixLess = chatMsg.substring(_tabs[index].getPrefix().length);
                if(prefixLess.startsWith("/")) {
                    $(this).val(_tabs[index].getPrefix());

                    if(prefixLess.trim() === "/help") {
                        tomni.chat.submitChatMessage(prefixLess);
                        _this.commandProcessor.exec(prefixLess);
                        return false;
                    }

                    if(_this.commandProcessor.exec(prefixLess))
                        return false;
                    else
                        return tomni.chat.submitChatMessage(prefixLess);
                }
            }

            if(chatMsg.startsWith("/") || (_this.prefs.get("tc-allow-backslash-prefix") && chatMsg.startsWith("\\"))) {
                if(chatMsg.startsWith("\\"))
                    chatMsg = "/" + chatMsg.substring(1);
                
                if(chatMsg.trim() === "/help") {
                    tomni.chat.submitChatMessage(chatMsg);
                    _this.commandProcessor.exec(chatMsg);
                    return false;
                }

                if(_this.commandProcessor.exec(chatMsg))
                    return false;
            }

            return tomni.chat.submitChatMessage(chatMsg);
        }
        else if(e.keyCode === Keycodes.codes.up) {
            return tomni.chat.history.up(this);
        }
        else if(e.keyCode === Keycodes.codes.down) {
            return tomni.chat.history.down(this);
        }

        return true;
    });
    chatInput.on("keydown keypress", function(e) {
        e.stopPropagation();
    });

    $(document).on("keydown.tabbedChat", fastSwitch);

    var jumpArg = _getParameterByName("tcJumpTaskId");
    if(jumpArg) {
        $(".threeDPanel").on("cell-meshes-loaded.tabbedChat", function() {
            tomni.jumpToTaskID(parseInt(jumpArg, 10));
            $(this).off("cell-meshes-loaded.tabbedChat");
        });
        history.replaceState({}, "Cube Jump", window.location.origin);
    }

    $("<div>").addClass("charLeftContainer").insertAfter(".chatInput").append($("<span>").text("180").attr("id", "charLeft").hide());
    $(".chatInput").on("input.tabbedChat change.tabbedChat", setRemainingChars);
    setInterval(setRemainingChars, 500); // hack to still update remaining chars if the textarea's value gets set using .val()
}

function TabbedChatInit() {
    $("<link>").attr("rel", "stylesheet")
               .attr("type", "text/css")
               .attr("href", ewdlc.getResourceUrl("/css/ewdlc.min.css?v=2"))
               .appendTo("head");

    var interval = setInterval(function() {
        var found = false;
        for(var i = 0; i < document.styleSheets.length; i++) {
            if(document.styleSheets[i].href && document.styleSheets[i].href.includes("/css/ewdlc.min.css?v=2"))
                found = true;
        }

        if(!found) return;

        $(".chatInput").trigger("keyup");
        clearInterval(interval);
    }, 500);

    $('<script>', {src: 'https://use.fontawesome.com/7745d29f5b.js'}).appendTo('body');

    ewdlc.modules.tabbedChat = ewdlc.modules.tabbedChat || new TabbedChat();
}




var TabbedChat$1 = Object.freeze({
	TabbedChatInit: TabbedChatInit,
	TabbedChat: TabbedChat,
	Tab: Tab,
	TabbedPrefs: TabbedPrefs
});

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




var SkippableLeaderboard$1 = Object.freeze({
	SkippableLeaderboard: SkippableLeaderboard,
	SkippableLeaderboardInit: SkippableLeaderboardInit
});

function ExtraStats() {
    function addStat(className, id, title) {
        $("<div>").addClass("icon").attr("title", title).addClass(className).appendTo("#funStats");
        $("<div>").attr("id", id).text("No Data").appendTo("#funStats");
    }

    var currentTimeout;

    function changeToSecond() {
        firstSet.css("opacity", "0");
        setTimeout(function() {
            firstSet.appendTo("#funStats");
            firstSet.css("visibility", "hidden");
            secondSet.css("visibility", "visible");
            secondSet.css("opacity", "1");

            currentTimeout = setTimeout(changeToFirst, 10000);
        }, 350);
    }

    function changeToFirst() {
        secondSet.css("opacity", "0");
        setTimeout(function() {
            secondSet.appendTo("#funStats");
            secondSet.css("visibility", "hidden");
            firstSet.css("visibility", "visible");
            firstSet.css("opacity", "1");

            currentTimeout = setTimeout(changeToSecond, 10000);
        }, 350);
    }

    Profile.updateAlwaysVisibleStats = function(t) {
        t = t || {};
        var i = function(e) {
            return Utils.numberToCondensedSI({
                number: e,
                fit: 6,
                maxchars: 6,
                precision: 0
            });
        };
        if(t.username && t.username.toLowerCase() === "grimreaper") {
            $("#pointsValue").addClass("grimReaperPoints").html("&infin;");
            $("#cubesValue").addClass("grimReaperPoints").html("&infin;");
            $("#trailblazingsValue").addClass("grimReaperPoints").html("&infin;");
            $("#funStats #scythedCubes").addClass("grimReaperPoints").html("&infin;");
            $("#funStats #completedCubes").addClass("grimReaperPoints").html("&infin;");
        } else {
            $("#pointsValue").text(i(t.points));
            $("#trailblazingsValue").text(i(t.trailblazes));
            $("#cubesValue").text(i(t.cubes));
            if(t.scythes) {
                $("#funStats #scythedCubes").text(i(t.scythes));
            }
            if(t.complete) {
                $("#funStats #completedCubes").text(i(t.complete));
            }
        }
        $("#profileButton a").text(t.username);
    };

    tomni.taskManager.ui.modeSet = function() {
        $.getJSON("/1.0/player/" + encodeURIComponent(account.account.username) + "/stats", function(e) {
            account.account.stats = e;
            Profile.updateAlwaysVisibleStats({
                username: account.account.username,
                points: e.forever.points,
                cubes: e.forever.cubes,
                trailblazes: e.forever.trailblazes,
                scythes: e.forever.scythes,
                complete: e.forever.complete
            });
        });
    };

    var firstSet = $("#funStats div").slice(0, 6);
    var secondSet;
    var isBigEnough = true;

    account.refresh = function(t) {
        return $.getJSON("/1.0/player/describe/").done(function(i) {
            if(i && i.id) {
                account.account.username = i.username;
                account.account.uid = i.id;
                account.account.rank = i["class"];
                account.account.joined = new Date(i.joined);
                account.account.country = i.country;
                account.account.country_name = i.country_name;
                account.account.trained = i.trained;
                account.account.newbie = i.newbie;
                account.account.first_timer = i.first_timer;
                account.account.language = i.language;
                account.account.level = i.level || 0;
                account.assignRoles(i);
                $.getJSON("/1.0/player/" + account.account.username + "/stats", function(t) {
                    Profile.updateAlwaysVisibleStats({
                        username: i.username,
                        points: t.forever.points,
                        cubes: t.forever.cubes,
                        trailblazes: t.forever.trailblazes,
                        scythes: t.forever.scythes,
                        complete: t.forever.complete
                    });
                    account.account.stats = t;
                });
                $("#acc").html($("#logoutButtons").html());
                if(t) t.call(this);
                $(document).trigger("account-info-ready", [account]);
            }
        });
    };

    function checkWindowWidth() {
        if($(window).width() >= 1920) {
            if(!isBigEnough) {
                isBigEnough = true;

                clearTimeout(currentTimeout);
                firstSet.css("visibility", "visible");
                firstSet.css("opacity", "1");
                if(secondSet) {
                    secondSet.appendTo($("#funStats"));
                    secondSet.css("visibility", "visible");
                    secondSet.css("opacity", "1");
                }
            }
        } else {
            if(isBigEnough) {
                isBigEnough = false;
                if(secondSet) {
                    currentTimeout = setTimeout(changeToSecond, 10000);
                    secondSet.css("visibility", "hidden");
                    secondSet.css("opacity", "0");
                }
            }
        }
    }

    $(document).on("ewdlc-account-ready", function() {
        if(account.can('scout scythe mystic admin')) {
            addStat("scytheIcon", "scythedCubes", "Cubes Scythed");
            secondSet = $("#funStats div").slice(6, 8);
        }
        if(account.can('scythe mystic admin')) {
            addStat("completedCubesIcon", "completedCubes", "Cubes Completed");
            secondSet = $("#funStats div").slice(6, 10);
        }
        checkWindowWidth();
        account.refresh();
    });

    $(document).resize(checkWindowWidth);
}

function ExtraStatsInit() {
    ewdlc.modules.extraStats = ewdlc.modules.extraStats || new ExtraStats();
}




var ExtraStats$1 = Object.freeze({
	ExtraStats: ExtraStats,
	ExtraStatsInit: ExtraStatsInit
});

function ExtraControls() {
    var _enlargeButtons = new Setting("tc-enlarge-reap-buttons", false, false);
    var _swapMoveOnAndFlag = new Setting("tc-swap-moveon-flag", false, false);

    var _accountReady = $.Deferred();
    var _settingsReady = $.Deferred();

    function jumpToCell() {
        if (!account.can('mystic admin')) return;

        let $jumpContainer = $("#jumpContainer").clone().detach();
        let $input = $jumpContainer.find("input");
        let $button = $jumpContainer.find("button");

        // Modify the attributes
        $jumpContainer.css("margin-left", "8px");

        $input.attr("placeholder", "Enter Cell #");
        $input.attr("id", "cellJumpField");

        $button.attr("disabled", "true");
        $button.attr("id", "cellJumpButton");

        // Set the event handlers
        $input.ion('keydown keypress', function (e) {
			e.stopPropagation();
        });

        $button.click(function (e) {
			e.preventDefault();

			var $field = $input.removeClass('error');

			var cid = parseInt($field.val(), 10);

			if (isNaN(cid)) {
				$field.addClass('error');
				return false;
			}

			tomni.setCell({id: cid}).fail(function () {
				$field.addClass('error');
			});

			return false;
		});
        
        $input.ion('change keyup input', function (e) {
			e.stopPropagation();

			$button.prop('disabled', $(this).val().length === 0);

			if (e.keyCode !== Keycodes.codes.enter) {
				$(this).removeClass('error');
			} else {
				$button.click();
			}
		});

        // Reattach the element
        $jumpContainer.appendTo("#cubeFinder");
    }

    function brushControls() {

        $("<div>").attr("title", "Decrease brush size (q)").addClass("fob brush dec")
            .click(function(e) {
            e.stopPropagation();
            SFX.play("button");
            tomni.prefs.decreaseBrushSize();
        }).insertAfter($("#mst-slider-container"));
        $("<div>").attr("title", "Increase brush size (e)").addClass("fob brush inc")
            .click(function(e) {
            e.stopPropagation();
            SFX.play("button");
            tomni.prefs.increaseBrushSize();
        }).insertAfter($("#mst-slider-container"));
    }

    function borderControls() {
        var $twoD = $("#twoD");
        var $borderDiv = $("<div>")
        .addClass("twoD-borders")
        .hide()
        .insertAfter($twoD);
        var borderDivNode = $borderDiv.get(0);
        var twoDNode = $twoD.get(0);

        var observer = new MutationObserver(function(mutations){mutations.forEach(function(mutation){
            if(mutation.type !== "attributes" || mutation.attributeName !== "style") return;

            var style = twoDNode.getAttribute("style");
            var indexOfTransform = style.indexOf("transform");
            var thisStyle = borderDivNode.getAttribute("style");
            var myIndexOfTransform = thisStyle.indexOf("transform");

            if(indexOfTransform >= 0) {
                var transformPart = style.substring(indexOfTransform, style.indexOf(";", indexOfTransform)+1);
                var myTransformPart = thisStyle.substring(myIndexOfTransform, thisStyle.indexOf(";", myIndexOfTransform)+1);

                if(myIndexOfTransform >= 0) {
                    borderDivNode.setAttribute("style", thisStyle.replace(myTransformPart, transformPart));
                } else {
                    borderDivNode.setAttribute("style", thisStyle + transformPart);
                }
            }
        });});

        observer.observe($twoD.get(0), {attributes: true});

        var $button = $("<div>").attr("title", "Toggle spawn borders (b)").addClass("fob").text("SB")
        .click(function(e) {
            e.stopPropagation();
            SFX.play("button");
            $borderDiv.toggle();
        }).appendTo($(".twoD-controls"));

        var firstStartup = true;
        var originalPlay = tomni.play;
        tomni.play = function(data) {
            if(tomni.getCurrentCell().info.dataset_id !== 1) {
                $button.hide();
            } else {
                $button.show();
            }

            if(firstStartup) {
                setTimeout(function(){$borderDiv.hide();}, 500);
                firstStartup = false;
            } else {
                $borderDiv.hide();
            }

            originalPlay(data);
        };

        $(document).on("keydown.spawnBorders", function(e) {
            if(!tomni.gameMode || tomni.getCurrentCell().info.dataset_id !== 1) return;

            if(e.keyCode === Keycodes.codes.b) {
                e.preventDefault();
                SFX.play("button");
                $borderDiv.toggle();
            }
        });
    }

    function toggleEnlargedButtons(name, value) {
        $(".reapAuxButton").toggleClass("tcEnlargeButtons", value);
        $("#editActions").toggleClass("tcEnlargeButtons", value);
    }

    function toggleSwappedButtons(name, value) {
        var $flagButton = $("#flagCube");
        var $moveOnButton = $("#actionInspectReviewContinue");

        if(value) {
            $flagButton.insertAfter($("#deselectSeedGT")).addClass("reapAuxButton enabled tcFlagSwapped").removeClass("reaperButton").empty();
            $moveOnButton.insertAfter($("#saveGT")).addClass("reaperButton tcFlagSwapped").removeClass("reapAuxButton enabled").text("Move On");

            $("<i>").addClass("fa fa-flag-o").appendTo($flagButton);
        } else {
            $flagButton.insertAfter($("#saveGT")).addClass("reaperButton").removeClass("reapAuxButton enabled tcFlagSwapped").empty().text("Flag");
            $moveOnButton.insertAfter($("#deselectSeedGT")).addClass("reapAuxButton enabled").removeClass("reaperButton tcFlagSwapped").empty();
        }

        toggleEnlargedButtons("", _enlargeButtons.getValue());
    }

    $(document).on("ewdlc-account-ready", function() {
        jumpToCell();
        brushControls();
        borderControls();

        _accountReady.resolve();
    });

    $(document).on("ewdlc-preferences-loading.extraControls", function() {
        ewdlc.preferences.registerSetting(_enlargeButtons);
        ewdlc.preferences.registerSetting(_swapMoveOnAndFlag);
        _enlargeButtons.registerCallback(toggleEnlargedButtons);
    });

    $(document).on("ewdlc-preferences-loaded.extraControls", function() {
        _settingsReady.resolve();
    });

    $.when(_accountReady, _settingsReady).then(function() {
        if(account.can('scout scythe mystic admin')) {
            ewdlc.settingsUi.makeCheckbox(_enlargeButtons, "Enlarge in-cube buttons");
        }

        // if(ewdlc.account.isScythe() || !ewdlc.account.isScout()) return;
        if (account.can('scythe mystic admin')) return;

        _swapMoveOnAndFlag.registerCallback(toggleSwappedButtons);
        ewdlc.settingsUi.makeCheckbox(_swapMoveOnAndFlag, "Swap move on/flag buttons");
        toggleSwappedButtons("", _swapMoveOnAndFlag.getValue());
    });
}

function ExtraControlsInit() {
    ewdlc.modules.extraControls = ewdlc.modules.extraControls || new ExtraControls();
}




var ExtraControls$1 = Object.freeze({
	ExtraControls: ExtraControls,
	ExtraControlsInit: ExtraControlsInit
});

function UiBoxImprovements() {
    var $floatingControls = $("#cubeInspectorFloatingControls");
    var observer = new MutationObserver(mutated);

    var _floatinsp_top = new Setting("uibox-top", null, null);
    var _floatinsp_left = new Setting("uibox-left", null, null);
    var _floatinsp_cube_tab = new Setting("uibox-cube-tab", false, false);

    function clamp(number, min, max) {
        return Math.max(min, Math.min(number, max));
    }

    function setCoords(top, left) {
        observer.disconnect();
        $floatingControls.css("top", top + "px");
        $floatingControls.css("left", left + "px");
        observer.observe(document.getElementById("cubeInspectorFloatingControls"), {attributes: true});
    }

    function clampAndSetCoords(top, left) {
        top = clamp(top, 0, $(document).height() - $floatingControls.outerHeight());
        left = clamp(left, 0, $(document).width() - $floatingControls.outerWidth());

        setCoords(top, left);

        _floatinsp_top.setValue(top);
        _floatinsp_left.setValue(left);
    }

    function updateCoords() {
        var top = $floatingControls.css("top");
        var left = $floatingControls.css("left");

        if(top === "auto" || left === "auto" || left.includes("%")) return;

        clampAndSetCoords(parsePx(top), parsePx(left));
    }

    function linkifyCubes(elem, observer) {
        var cubesText = elem.text();

        if(cubesText === '-')
            return;

        elem.empty();

        var cubes = cubesText.split(", ");

        for(var i = 0; i < cubes.length; i++) {
            var $span = $("<span>").addClass("link");
            var cubeNum = parseInt(cubes[i], 10);

            $span.text(cubes[i]);
            $span.data("target", cubeNum);

            $span.click(function(e) {
                $(this).addClass("clicked");
                tomni.jumpToTaskID($(this).data("target"));
                e.stopPropagation();
            });

            elem.append($span);
            if(i < cubes.length - 1)
                elem.append(", ");
        }

        observer.takeRecords();
    }

    function bindLinkifier(elem) {
        elem.addClass("tc");

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if(mutation.addedNodes.length == 0) return;
                
                var $target = $(mutation.target);

                if(elem.children(".link").length > 0) return;

                linkifyCubes($target, observer);
            });
        });

        observer.observe(elem[0], { childList: true, characterData: true });
    }

    function parsePx(px) {
        return parseInt(px.replace("px", "").trim(), 10);
    }

    function mutated(mutations) {
        mutations.forEach(function(mutation) {
            if(mutation.type !== "attributes" || mutation.attributeName !== "style") return;

            updateCoords();
        });
    }

    $(document).on("ewdlc-preferences-loading", function() {
        ewdlc.preferences.registerSetting(_floatinsp_top);
        ewdlc.preferences.registerSetting(_floatinsp_left);
        ewdlc.preferences.registerSetting(_floatinsp_cube_tab);
    });

    $(document).on("ewdlc-preferences-loaded", function() {
        if(_floatinsp_top.getValue() != null && _floatinsp_left.getValue() != null) {
            clampAndSetCoords(_floatinsp_top.getValue(),_floatinsp_left.getValue());
        }
    
        var $cubeButton = $floatingControls.find(".info > .cube.minimalButton");
    
        if(_floatinsp_cube_tab.getValue()) {
            $cubeButton.click();
        } else {
            $floatingControls.find(".info > .player.minimalButton").click();
        }
    
        var tabObserver = new MutationObserver(function(mutations) {mutations.forEach(function(mutation) {
            if(mutation.type !== "attributes" || mutation.attributeName !== "class") return;
    
            _floatinsp_cube_tab.setValue($cubeButton.hasClass("selected"));
        });});
        tabObserver.observe($cubeButton.get(0), {attributes: true});
    
        observer.observe(document.getElementById("cubeInspectorFloatingControls"), {attributes: true});
    
        $(document).resize(function() {
            updateCoords();
        });
    });

    // The selector might be empty at this point, so create an interval to check it every half a second
    var intervalId = setInterval(function () {
        if($floatingControls.length == 0) {
            $floatingControls = $("#cubeInspectorFloatingControls");
            return;
        }
        $floatingControls.find("div.panel.player.selected").bind("DOMNodeInserted", "li", function () {
            let $li = $(this).children().last();
            let text = $li.text();

            let color;

            if($li.hasClass("admin")) {
                color = Cell.ScytheVisionColors.reap;
            } else if($li.hasClass("scythe")) {
                color = Cell.ScytheVisionColors.scythed;
            } else if($li.hasClass("complete")) {
                color = Cell.ScytheVisionColors.complete2;
            } else if($li.hasClass("scout")) {
                color = Cell.ScytheVisionColors.review;
            }

            if(color) {
                $li.css("color", color);
            }

            if (text === "No Cube Selected") return;

            $li.on("click.floatinsp", function () {
                Profile.show({
                    username: text
                });
            });
        });

        bindLinkifier($floatingControls.find(".panel.cube > .parent_task > .value"));
        bindLinkifier($floatingControls.find(".panel.cube > .child_tasks > .value"));

        clearInterval(intervalId);
    }, 500);
}

function UiBoxImprovementsInit() {
    ewdlc.modules.uiBoxImprovements = ewdlc.modules.uiBoxImprovements || new UiBoxImprovements();
}




var UiBoxImprovements$1 = Object.freeze({
	UiBoxImprovements: UiBoxImprovements,
	UiBoxImprovementsInit: UiBoxImprovementsInit
});

function SlHacks() {
    function setColor(selector, color) {
        $(selector).each(function() {
            this.style.setProperty("color", color, "important");
        });
    }

    var intervalId = setInterval(function () {
        // Stop SL bug with R toggling review mode
        if (!document.getElementById("slPanel")) return;

        document.getElementById("slPanel").addEventListener("keypress", function (e) {
            e.stopPropagation();
        });
        console.log("Fixed Scouts' Log Review button bug.");
        clearInterval(intervalId);

        // Set Need Scythe/Admin button colors to match cell colors
        setColor(".sl-need-admin", Cell.ScytheVisionColors.reap);
        setColor(".sl-need-scythe", Cell.ScytheVisionColors.scythed);

    }, 1000);
}

function SlHacksInit() {
    ewdlc.modules.slHacks = ewdlc.modules.slHacks || new SlHacks();
}




var SlHacks$1 = Object.freeze({
	SlHacks: SlHacks,
	SlHacksInit: SlHacksInit
});

function ColorPickerView(_defaults) {
    var _this = this;
    var _isInit = false;

    var _isCollapsed = false;
    var _isExit = false;

    var _$mainContainer;
    var _$collapseButton;

    var _$save;
    var _$discard;
    var _$default;
    var _$exit;

    var _colors = {};
    var _initialColors = {};
    var _currentColors = {};

    var _colorLang = [
        {key: "complete1", lang: "1 SC Vote"},
        {key: "complete2", lang: "2 SC Votes"},
        {key: "complete3", lang: "Admin SC"},
        {key: "review", lang: "Review"},
        {key: "scythed", lang: "Scythed"},
        {key: "reap", lang: "Reaped"},
        {key: "frozen", lang: "Frozen"},
        {key: "duplicate", lang: "Duplicate"},
        {key: "base", lang: "Base"}
    ];

    function makeAction($container, name) {
        return $("<div>").addClass("minimalButton").attr("id", "prvw-action").text(name).appendTo($container);
    }

    function makeColors($container) {
        for(var i = 0; i < _colorLang.length; i++) {
            let $color = $("<div>").attr("id", "prvw-color").text(_colorLang[i].lang);
            let key = _colorLang[i].key;

            let $input = $("<input>").attr("type", "text").appendTo($color);

            $input.spectrum({
                showInitial: true,
                showInput: true,
                preferredFormat: "hex",
                replacerClassName: "prvw-spectrum",
                move: function(color) {
                    _currentColors[key] = color.toHexString();
                    _$mainContainer.trigger("prvw-colors-changed");
                }
            });

            $color.appendTo($container);

            _colors[_colorLang[i].key] = $input;
        }
    }

    function fillTopContainer($topContainer) {
        let $colorContainer = $("<div>").attr("id", "prvw-colors").appendTo($topContainer);
        let $actionContainer = $("<div>").attr("id", "prvw-actions").appendTo($topContainer);

        makeColors($colorContainer);

        _$save = makeAction($actionContainer, "Save");
        _$discard = makeAction($actionContainer, "Discard");
        _$default = makeAction($actionContainer, "Default");
        _$exit = makeAction($actionContainer, "Exit Preview");

        $("<div>").css("padding-left", "10px")
                  .css("padding-bottom", "5px")
                  .text("Note: Saved changes will take effect only after refreshing.")
                  .appendTo($topContainer);
    }

    function fillBottomContainer($bottomContainer) {
        _$collapseButton = $("<div>").attr("id", "prvw-collapse").text("Preview Mode!").appendTo($bottomContainer);
    }

    function buildContainers() {
        _$mainContainer = $("<div>").attr("id", "prvw-container");
        
        let $topContainer = $("<div>").attr("id", "prvw-top").appendTo(_$mainContainer);
        let $bottomContainer = $("<div>").appendTo(_$mainContainer);

        fillTopContainer($topContainer);
        fillBottomContainer($bottomContainer);

        _$mainContainer.appendTo($(".gameBoard"));
    }

    function bindEvents() {
        _$collapseButton.click(function (e) {
            e.stopPropagation();

            if(_isExit) return;

            let options = {duration: 600, queue: false};

            if(_isCollapsed) {
                _$mainContainer.animate({top: 0}, options);
                _isCollapsed = false;
            } else {
                let target = _$mainContainer.outerHeight() - _$collapseButton.outerHeight() + 1;

                _$mainContainer.animate({top: -target}, options);
                _isCollapsed = true;
            }
        });

        _$mainContainer.on("keyup keydown keypress", function(e) {
            e.stopPropagation();
        });

        $(".sp-container").on("keyup keydown keypress", function(e) {
            e.stopPropagation();
        });

        _$discard.on("click", function(e) {
            e.stopPropagation();

            _this.setColors(_initialColors);
        });

        _$save.on("click", function(e) {
            e.stopPropagation();

            _initialColors = $.extend({}, _currentColors);
            _$mainContainer.trigger("prvw-colors-saved");
        });

        _$default.on("click", function(e) {
            e.stopPropagation();

            let cache = $.extend({}, _initialColors);
            _this.setColors(_defaults);
            _initialColors = cache;
        });

        _$exit.on("click", function(e) {
            e.stopPropagation();

            if(_isExit) return;

            let options = {duration: 600, queue: false, complete: function() {
                if(_isExit)
                    _$mainContainer.hide();
            }};

            _isExit = true;
            _$mainContainer.animate({top: -_$mainContainer.outerHeight()}, options);

            _$mainContainer.trigger("prvw-exited");
        });
    }

    _this.init = function() {
        if(_isInit) return;

        buildContainers();
        bindEvents();

        _$mainContainer.css("top", (-_$mainContainer.outerHeight()) + "px");
        _$mainContainer.hide();

        _isExit = true;

        _isInit = true;
    };

    _this.getColors = function() {
        return $.extend({}, _currentColors);
    };

    _this.setColors = function(colors) {
        if(!_isInit) return;

        colors = colors || {};

        for(let color in colors) {
            if(_colors[color]) {
                _colors[color].spectrum("set", colors[color]);
                _initialColors[color] = colors[color];
                _currentColors[color] = colors[color];
            }
        }

        _$mainContainer.trigger("prvw-colors-changed");
    };

    _this.getContainer = function() {
        return _$mainContainer;
    };

    _this.show = function() {
        if(!_isExit) return;

        _isExit = false;
        _isCollapsed = false;

        let options = {duration: 600, queue: false};

        _$mainContainer.show();
        _$mainContainer.animate({top: 0}, options);
    };
}

function CellColorPicker() {
    var _view = null;
    var _this = this;
    var _$showButton;

    var _setting = new Setting("prvw-colors", $.extend({}, Cell.ScytheVisionColors));

    var _tasks;
    var _groups;
    var _tasksRequest;
    var _heatmapRequest;
    var _requestsDone;
    var _isOpen;
    var _order = [];
    var _cell;
    var _originalColorFunc;
    var _originalUpdateFunc;

    var _accountReady = $.Deferred();
    var _settingsReady = $.Deferred();
    var _spectrumReady = $.Deferred();

    function start() {
        if(_tasksRequest) _tasksRequest.abort();
        if(_heatmapRequest) _heatmapRequest.abort();

        _tasks = [];
        _groups = {};

        _cell = tomni.getCurrentCell();
        _originalColorFunc = _cell.resetTaskColors;
        _originalUpdateFunc = _cell.updateCompleteColoring;
        _cell.resetTaskColors = function() {};
        _cell.updateCompleteColoring = function() {};

        if(_cell.info.tags.ReapGrow) {
            _order = [
                "scythed",
                "complete1",
                "complete2",
                "complete3",
                "review",
                "reap",
                "duplicate",
                "frozen"
            ];
        } else {
            _order = [
                "complete1",
                "complete2",
                "complete3",
                "review",
                "scythed",
                "reap",
                "duplicate",
                "frozen"
            ];
        }

        _isOpen = true;
        _view.show();

        _requestsDone = false;

        _tasksRequest = $.getJSON("/1.0/cell/" + tomni.cell + "/tasks").done(processTasks);
        _heatmapRequest = $.getJSON("/1.0/cell/" + tomni.cell + "/heatmap/scythe").done(processHeatmap);

        $.when(_tasksRequest, _heatmapRequest).done(function() {
            _requestsDone = true;
            applyColors();
        });
    }

    function stop() {
        // Do some cleanup
        _isOpen = false;

        if(_tasksRequest)
            _tasksRequest.abort();
        if(_heatmapRequest)
            _heatmapRequest.abort();

        _tasksRequest = null;
        _heatmapRequest = null;

        if(_cell) {
            _cell.updateCompleteColoring = _originalUpdateFunc;
            _cell.resetTaskColors = _originalColorFunc;
            _cell.resetTaskColors({hard: true});
        }

        _originalColorFunc = null;
        _cell = null;

        _tasks = null;
        _groups = null;
        _order = null;

        _requestsDone = false;
    }

    function save() {
        _setting.setValue($.extend({}, _setting.getValue(), _view.getColors()));
    }

    function applyColors() {
        if(!_isOpen || !_requestsDone) return;

        var colors = _view.getColors();

        _cell.colorCubes({cubeids: _tasks, color: ColorUtils.hexToRGB(colors.base), blending: 1});

        for(var i = 0; i < _order.length; i++) {
            _cell.colorCubes({cubeids: _groups[_order[i]], color: ColorUtils.hexToRGB(colors[_order[i]]), blending: 1});
        }

        _cell.render();
    }

    function processTasks(tasks) {
        _tasks = tasks.tasks.map((task) => task.id);
    }

    function processHeatmap(heatmap) {
        _groups.scythed = heatmap.scythed;
        _groups.reap = heatmap.reaped;

        _groups.complete1 = heatmap.complete.filter((task) => task.votes == 1).map((task) => task.id);
        _groups.complete2 = heatmap.complete.filter((task) => task.votes == 2).map((task) => task.id);
        _groups.complete3 = heatmap.complete.filter((task) => task.votes >= 1000000).map((task) => task.id);

        _groups.review = heatmap.review;
        _groups.frozen = heatmap.frozen;
        _groups.duplicate = heatmap.duplicate;
    }

    jQuery.cachedScript = function (url, options) {
        options = $.extend(options || {}, {
            dataType: "script",
            cache: true,
            url: url
        });

        return jQuery.ajax(options);
    };

    $("<link>").attr("rel", "stylesheet").attr("href", "https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.8.0/spectrum.min.css").appendTo($("head"));
    $.cachedScript("https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.8.0/spectrum.min.js").done(_spectrumReady.resolve);

    _this.getView = function() {
        return _view;
    };

    $(document).on("ewdlc-account-ready", _accountReady.resolve);

    $(document).on("ewdlc-preferences-loaded.cellColorPicker", _settingsReady.resolve);

    $.when(_accountReady, _settingsReady, _spectrumReady).then(function() {
        if(!account.can('scout scythe mystic admin')) return;

        _view = new ColorPickerView($.extend({}, Cell.ScytheVisionColors));
        _view.init();
        _view.setColors($.extend({}, _setting.getValue()));

        let $container = _view.getContainer();

        $container.on("prvw-exited.cellColorPicker", stop);
        $container.on("prvw-colors-changed.cellColorPicker", applyColors);
        $container.on("prvw-colors-saved.cellColorPicker", save);

        _$showButton = ewdlc.settingsUi.makeButton("Show Cell Color Picker");
        _$showButton.click(start);
    });

    $(document).on("ewdlc-preferences-loading.cellColorPicker", function() {
        ewdlc.preferences.registerSetting(_setting);
    });

    $(document).on("ewdlc-preferences-loaded.cellColorPicker", function() {
        Cell.ScytheVisionColors = _setting.getValue();
    });
}

function CellColorPickerInit() {
    ewdlc.modules.cellColorPicker = ewdlc.modules.cellColorPicker || new CellColorPicker();
}



var CellColorPicker$1 = Object.freeze({
	CellColorPickerInit: CellColorPickerInit,
	CellColorPicker: CellColorPicker
});

function ProfileWindowChanges() {
    var _$joinedDateSpan = $("#profileJoinedDate span");
    var _$profUsername = $("#profileContainer #profUsername");
    var _observer;

    function updateJoinedDate() {
        var username = _$profUsername.text();

        $.getJSON("/1.0/player/" + username + "/bio").done(function(bio) {
            var joinedMoment = moment(bio.joined * 1000);
            var nowMoment = moment();
            var fromNow = joinedMoment.fromNow();

            var $span = $("<span>").text(" (" + fromNow + ")");

            var years = nowMoment.diff(joinedMoment, 'years');
            nowMoment.add(-years, 'years');

            var months = nowMoment.diff(joinedMoment, 'months');
            nowMoment.add(-months, 'months');

            var days = nowMoment.diff(joinedMoment, 'days');
            
            var arr = [];
            if(years > 0)
                arr.push(years + "y");
            
            if(months > 0)
                arr.push(months + "m");

            if(days > 0)
                arr.push(days + "d");

            if(arr.length > 0)
                $span.attr("title", arr.join(", ") + " ago");

            _$joinedDateSpan.append($span.hide().fadeIn());
            _observer.takeRecords();
        });
    }

    (function registerObserver() {
        _observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if(mutation.addedNodes.length === 0) return;
                if(_$joinedDateSpan.children("span").length > 0) return;

                updateJoinedDate();
            });
        });

        _observer.observe(_$joinedDateSpan[0], {childList: true, characterData: true});
    })();
}

function ProfileWindowChangesInit() {
    ewdlc.modules.profileWindowChanges = ewdlc.modules.profileWindowChanges || new ProfileWindowChanges();
    $("body").append('<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.20.1/moment.min.js" integrity="sha256-ABVkpwb9K9PxubvRrHMkk6wmWcIHUE9eBxNZLXYQ84k=" crossorigin="anonymous"></script>');
}




var ProfileWindowChanges$1 = Object.freeze({
	ProfileWindowChangesInit: ProfileWindowChangesInit,
	ProfileWindowChanges: ProfileWindowChanges
});

var Modules = {
    TabbedChat: TabbedChat$1,
    SkippableLeaderboard: SkippableLeaderboard$1,
    ExtraStats: ExtraStats$1,
    ExtraControls: ExtraControls$1,
    UiBoxImprovements: UiBoxImprovements$1,
    SlHacks: SlHacks$1,
    CellColorPicker: CellColorPicker$1,
    ProfileWindowChanges: ProfileWindowChanges$1
};

function initModules() {
    for(var key in Modules) {
        Modules[key][key + "Init"]();
    }
}

$(document).ready(function () {
    if($(".gameBoard").length == 0) return;

    window.ewdlc = new EWDLC("https://chrisraven.github.io/EWDLC/build/static");

    initModules();
    ewdlc.init();
});

exports.Modules = Modules;
exports.EWDLC = EWDLC;
exports.Preferences = Preferences;
exports.Account = Account;
exports.Setting = Setting;
exports.SettingsUi = SettingsUi;
exports.TaskStatus = TaskStatus;

return exports;

}({}));
//# sourceMappingURL=ewdlc.js.map
