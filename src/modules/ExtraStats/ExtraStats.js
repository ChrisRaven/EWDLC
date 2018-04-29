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

export {ExtraStats}
export {ExtraStatsInit}
