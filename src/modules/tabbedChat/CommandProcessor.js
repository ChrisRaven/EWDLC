import {TaskStatus} from "../../framework/TaskStatus.js"

function CommandProcessor(tabbedChat) {
    var self = this;
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
        window.tomni.chat.addMsg({}, "An error was encountered while running this command. Please wait a moment and try again.");
    }

    function filterByStatus(tasks) {
        return tasks.filter(function(task) {return task.status != TaskStatus.frozen && task.status != TaskStatus.stashed})
                    .map(function(task) {return task.id});
    }

    function help(args) {
        window.tomni.chat.addMsg({}, "------------------");
        window.tomni.chat.addMsg({}, "Tabbed Chat commands:");

        for(var key in boundCallbacks) {
            if(key === "/help") continue;

            var bound = boundCallbacks[key];
            var msg = key;

            if(bound.description || bound.usage) msg += ": ";
            if(bound.description) msg += bound.description;
            if(bound.description && bound.usage) msg += ", Usage: ";
            if(bound.usage) msg += bound.usage;
            window.tomni.chat.addMsg({}, msg);
        }

        window.tomni.chat.addMsg({}, "------------------");
    }

    function getCellLimit(args) {
        var cellId = window.tomni.cell;
        var limit = 15;

        if(args.length >= 2) {
            if(args[1].toLowerCase() === "this") {
                cellId = window.tomni.cell;
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
            window.tomni.chat.addMsg({}, "Usage: /low-wt [cell=this] [limit=15]");
        };

        if(!window.ewdlc.account.isScout()) {
            window.tomni.chat.addMsg({}, "You must be a scout or higher to use this command.");
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

        window.tomni.chat.history.add(args.join(' '));

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
                    window.tomni.chat.addMsg({}, "There are no low weight cubes in cell " + cellId);
                } else {
                    window.tomni.chat.addMsg({}, msg);
                }
            }).fail(err);
        }).fail(err);
    }

    function clear(args) {
        $(".chatMsgContainer").empty();
        window.tomni.chat.addMsg({}, "The chat has been cleared.");
    }

    function scInfo(args) {
        var help = function() {
            window.tomni.chat.addMsg({}, "Usage: /sc-info [cell=this] [limit=15]");
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

        if(!window.ewdlc.account.isScythe()) {
            window.tomni.chat.addMsg({}, "You must be a scythe or higher to use this command.");
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

        window.tomni.chat.history.add(args.join(' '));
        window.tomni.chat.addMsg({}, "Please wait while Grim's minions collect some data...");

        $.when($.getJSON("/1.0/cell/" + cellId + "/tasks"), $.getJSON("/1.0/cell/" + cellId + "/heatmap/scythe"),
               $.getJSON("/1.0/cell/" + cellId + "/tasks/complete/player"), $.getJSON("/1.0/cell/" + cellId + "/heatmap/low-weight?weight=3"))
            .done(function(tasks, scytheData, completeData, data) {
                tasks = filterByStatus(tasks[0].tasks);
                scytheData = scytheData[0];
                completeData = completeData[0];
                data = data[0];

                var potentialTasks = tasks;
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

                cleanTasks(potentialTasks, frozen);

                var myTasks = completeData.scythe[window.account.account.uid.toString()] || [];

                cleanTasks(potentialTasks, myTasks);

                var count = 0;

                var msg = "Scythe info for cell " + cellId + " (limit " + limit + "):\n";

                msg += "Your SC count: " + myTasks.length + "\n";

                if(data["0"]) cleanTasks(potentialTasks, data["0"].map(function(elem) {return elem.task_id;}));
                if(data["1"]) cleanTasks(potentialTasks, data["1"].map(function(elem) {return elem.task_id;}));
                if(data["2"]) cleanTasks(potentialTasks, data["2"].map(function(elem) {return elem.task_id;}));

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

                window.tomni.chat.addMsg({}, msg);
            })
            .fail(err);
    }

    function addCell(args) {
        for(var i = 1; i < args.length; i++) {
            var id = parseInt(args[i], 10);
            if(!isNaN(id)) {
                window.tomni.threeD.addCell( {cellid: id, center: true});
            }
        }
    }

    function cellSize(args) {
        var cellInfo = window.tomni.threeD.getCell(window.tomni.cell).info;
        window.tomni.chat.history.add(args[0]);

        $.get("/1.0/cell/" + window.tomni.cell + "/tasks").done(function(data) {
            var filteredTasks = data.tasks.filter(function(task) {return task.status != TaskStatus.stashed});
            window.tomni.chat.addMsg({}, cellInfo.name + " is " + filteredTasks.length + " cube" + (data.tasks.length !== 1 ? "s" : "") + " big.");
        }).fail(err);
    }

    function cubeDupes(args) {
        if(!window.ewdlc.account.isScout()) {
            window.tomni.chat.addMsg({}, "You must be a scout or higher to use this command.");
            return;
        }

        window.tomni.chat.history.add(args[0]);

        if(!window.tomni.gameMode || !window.tomni.task.inspect) {
            window.tomni.chat.addMsg({}, "You must be inspecting a cube to use this command.");
            return;
        }

        if(window.tomni.task.duplicates.length === 0) {
            window.tomni.chat.addMsg({}, "There are no duplicates in this cube.");
            return;
        }

        var msg = "Duplicates in the current cube:\n ";
        msg += window.tomni.task.duplicates.map(function(e) { return "#" + e.task_id;}).join(' ');
        window.tomni.chat.addMsg({}, msg);
    }

    function huntGuess(args) {
        if(!window.tomni.getCurrentCell().info.is_hunt) {
            window.tomni.chat.addMsg({}, "You must be in a hunt cell to use this command.");
            return;
        }

        var center = window.tomni.center.rotation.clone().multiplyScalar(100).round().multiplyScalar(1/100).floor();
        center = [center.x, center.y, center.z];
        center = center.join(" ");

        var msg = "/pm thehunt " + center;
        window.tomni.chat.submitChatMessage(msg);
    }

    this.bind("/help", "", "", help);
    this.bind("/low-wt", "Lists low weight cubes in cell", "/low-wt [cell=this] [limit=15]", lowWt);
    this.bind("/clear", "Clears the chat", "", clear);
    this.bind("/support", "See how to support the author of this script", "", function() {window.tomni.chat.addMsg({}, "While this script will forever remain free, you can buy me a coffee at https://ko-fi.com/iliyang \n" +
                                                                                                                   "Whether you chip in or not, your support means a lot to me :)");});
    this.bind("/sc-info", "Shows count of the SC you've done, the amount you can do, and lists cube IDs with SC < 2, wt >= 3", "/sc-info [cell=this] [limit=15]", scInfo);
    this.bind("/add-cell", "Adds one or more cells to the overview", "/add-cell Cell ID 1 [Cell ID 2] ...", addCell);
    this.bind("/size", "Shows the size of the current cell", "", cellSize);
    this.bind("/dupe", "Lists the duplicates in the current cube", "", cubeDupes);
    this.bind("/guess", "Submits your current coordinates as a hunt guess", "", huntGuess);
}

export {CommandProcessor}
