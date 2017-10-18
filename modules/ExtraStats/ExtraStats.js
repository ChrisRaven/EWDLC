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

    window.Profile.updateAlwaysVisibleStats = function(t) {
        t = t || {};
        var i = function(e) {
            return window.Utils.numberToCondensedSI({
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

    window.tomni.taskManager.ui.modeSet = function() {
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

    window.account.refresh = function(t) {
        return $.getJSON("/1.0/player/describe/").done(function(i) {
            if(i && i.id) {
                window.account.account.username = i.username;
                window.account.account.uid = i.id;
                window.account.account.rank = i["class"];
                window.account.account.joined = new Date(i.joined);
                window.account.account.country = i.country;
                window.account.account.country_name = i.country_name;
                window.account.account.trained = i.trained;
                window.account.account.newbie = i.newbie;
                window.account.account.first_timer = i.first_timer;
                window.account.account.language = i.language;
                window.account.account.level = i.level || 0;
                window.account.assignRoles(i);
                $.getJSON("/1.0/player/" + window.account.account.username + "/stats", function(t) {
                    Profile.updateAlwaysVisibleStats({
                        username: i.username,
                        points: t.forever.points,
                        cubes: t.forever.cubes,
                        trailblazes: t.forever.trailblazes,
                        scythes: t.forever.scythes,
                        complete: t.forever.complete
                    });
                    window.account.account.stats = t;
                });
                $("#acc").html($("#logoutButtons").html());
                if(t) t.call(this);
                $(window).trigger("account-info-ready", [window.account]);
            }
        });
    };

    function checkWindowWidth() {
        if($(window).width() >= 1920) {
            if(!isBigEnough) {
                isBigEnough = true;

                window.clearTimeout(currentTimeout);
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

    $(window).on("ewdlc-account-ready", function() {
        if(window.ewdlc.account.isScout()) {
            addStat("scytheIcon", "scythedCubes", "Cubes Scythed");
            secondSet = $("#funStats div").slice(6, 8);
        }
        if(window.ewdlc.account.isScythe()) {
            addStat("completedCubesIcon", "completedCubes", "Cubes Completed");
            secondSet = $("#funStats div").slice(6, 10);
        }
        window.account.refresh();
    });

    checkWindowWidth();

    $(window).resize(checkWindowWidth);
}

function ExtraStatsInit() {
    window.ewdlc.modules.extraStats = window.ewdlc.modules.extraStats || new ExtraStats();
}

export {ExtraStats}
export {ExtraStatsInit}
