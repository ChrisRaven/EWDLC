import {Tab} from "./Tab.js"
import {TabbedPrefs} from "./TabbedPrefs.js"
import {CommandProcessor} from "./CommandProcessor.js"

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
        });

        _tabs.push(tab);
        return tab;
    };

    this.prefs = new TabbedPrefs(updateSettings);
    this.commandProcessor = new CommandProcessor(this);

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
    };

    function makeMsg(elem) {
        var username = elem.children(".userName").text();
        var hasUsername = elem.children(".userName").length !== 0;
        var scopeText = elem.children(".dialogNobody").not(".tc-timestamp,.tc-msg-text").text().trim();
        var target = scopeText.substring(1, scopeText.length - 1);

        var msg = {username: username, hasUsername: hasUsername, scopeText: scopeText, target: target};

        return msg;
    }

    function isPointMsg(text) {
        return (text.includes(" earned ") && text.includes(" points")) ||
            text.includes(" trailblazed a cube") || text.includes(" scythed a cube for") ||
            text.includes(" scouted a cube for");
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
            if(hasUsername && scopeText && _this.prefs.get("tc-show-only-all"))
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
        if(_this.prefs.get("tc-disable-unread")) {
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
            window.tomni.ui.recenterView(new THREE.Vector3(-x, -y, -z));
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


    // Add the default tab
    activeTab = _this.addTab("All", "", "");
    activeTab.setActive(true);

    // Add any tab per role
    function _addRoleTabs() {
        let account = window.ewdlc.account;
        if(account.isScythe()) {
            _this.addTab("Commands", "", "");
        }
        if(account.isScout()) {
            _this.addTab("Scouts", "/gm scouts ", "(scouts)");
        }
        if(account.isMystic()) {
            _this.addTab("Mystics", "/gm mystics ", "(mystics)");
        }
        if(account.isModerator()) {
            _this.addTab("Mods", "/gm mods ", "(mods)");
        }
        if(account.isMentor()) {
            _this.addTab("Mentors", "/gm mentors ", "(mentors)");
        }
        if(account.isAdmin()) {
            _this.addTab("Admins", "/gm admins ", "(admins)");
        }
    }
    
    if(window.ewdlc && window.ewdlc.account.isReady()) {
        _addRoleTabs();
    } else {
        $(window).on("ewdlc-account-ready", _addRoleTabs);
    }

    chatInput.focus(function() {filterMessages(); $("#charLeft").fadeIn(200);}).focusout(function () {$("#charLeft").fadeOut(200);});
    $(".chatMsgContainer").bind("DOMNodeInserted", ".chatMsg", function() {
        var elem = $(this).children().last();
        elem.find(".link.coords").on("click.tabbedChat", openCoord);
        if(elem.find(".tc-timestamp").length > 0 || elem.find(".link.coords").length > 0) return;

        elem.find(".taskid").on("click.tabbedChat", clickTask).contextmenu(rclickTask);

        var msg = makeMsg(elem);
        var scopeToSearch = "";
        var index;

        if(msg.hasUsername) {
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
                if(msg.username !== window.account.account.username) {
                }

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
                    window.SFX.play(sound);
                }

                index = _tabs.findIndex(function(elem) { return elem.getScope() == scopeToSearch; });
                if(!_this.prefs.get("tc-disable-unread")) {
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

        chatInput.removeClass("pulsing");
        
        checkCoords(elem);
    });

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
            window.tomni.chat.history.locator = -1;

            var index = _tabs.findIndex(function(elem) {return elem.getName() !== "All" && elem.getName() !== "Commands" && chatMsg.startsWith(elem.getPrefix());});

            if(index >= 0) {
                var prefixLess = chatMsg.substring(_tabs[index].getPrefix().length);
                if(prefixLess.startsWith("/")) {
                    $(this).val(_tabs[index].getPrefix());

                    if(prefixLess.trim() === "/help") {
                        window.tomni.chat.submitChatMessage(prefixLess);
                        _this.commandProcessor.exec(prefixLess);
                        return false;
                    }

                    if(_this.commandProcessor.exec(prefixLess))
                        return false;
                    else
                        return window.tomni.chat.submitChatMessage(prefixLess);
                }
            }

            if(chatMsg.startsWith("/") || chatMsg.startsWith("\\")) {
                if(chatMsg.startsWith("\\"))
                    chatMsg = "/" + chatMsg.substring(1);
                
                if(chatMsg.trim() === "/help") {
                    window.tomni.chat.submitChatMessage(chatMsg);
                    _this.commandProcessor.exec(chatMsg);
                    return false;
                }

                if(_this.commandProcessor.exec(chatMsg))
                    return false;
            }

            return window.tomni.chat.submitChatMessage(chatMsg);
        }
        else if(e.keyCode === Keycodes.codes.up) {
            return window.tomni.chat.history.up(this);
        }
        else if(e.keyCode === Keycodes.codes.down) {
            return window.tomni.chat.history.down(this);
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
            window.tomni.jumpToTaskID(parseInt(jumpArg, 10));
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
               .attr("href", window.ewdlc.getResourceUrl("/css/ewdlc.min.css"))
               .appendTo("head");

    setTimeout(function() {$(".chatInput").trigger("keyup");}, 5000);

    $('<script>', {src: 'https://use.fontawesome.com/7745d29f5b.js'}).appendTo('body');

    window.ewdlc.modules.tabbedChat = window.ewdlc.modules.tabbedChat || new TabbedChat();
}

export {TabbedChatInit}
export {TabbedChat}
export {Tab} from "./Tab.js"
export {TabbedPrefs} from "./TabbedPrefs.js"