// require ../../framework/ewdlc.js

function ExtraControls() {
    function jumpToCell() {
        if(window.ewdlc.account.isMystic()) {
            var $formHolder = $("<form>").css("display", "inline-block").submit(function(e) {e.preventDefault(); e.stopPropagation();});
            var $cellInput = $("<input>").attr("type", "text").attr("placeholder", "Jump to cell").attr("size", "10").attr("id", "cellJumpField")
            .css("margin-left", "25px");

            $cellInput.on("keyup keydown keypress", function(e) {
                e.stopPropagation();
            });

            $cellInput.on("keydown", function(e) {
                if(e.keyCode === 13) {
                    var num = $cellInput.val();
                    window.tomni.setCell({id: num}).done(function() {
                        $cellInput.removeClass("error");
                    }).fail(function() {
                        $cellInput.addClass("error");
                    });
                }
            });

            $cellInput.appendTo($formHolder);
            $formHolder.insertAfter($("#jumpForm"));
            $("#jumpForm").css("display", "inline-block");
        }
    }

    function brushControls() {
        $("<div>").attr("title", "Decrease brush size (q)").addClass("fob").text("B")
            .append($("<sup>").css("margin-top", "-10px").text("-"))
            .click(function(e) {
            e.stopPropagation();
            SFX.play("button");
            window.tomni.prefs.decreaseBrushSize();
        }).insertAfter($("#mst-slider-container"));
        $("<div>").attr("title", "Increase brush size (e)").addClass("fob").text("B")
            .append($("<sup>").css("margin-top", "-10px").text("+"))
            .click(function(e) {
            e.stopPropagation();
            SFX.play("button");
            window.tomni.prefs.increaseBrushSize();
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
        var originalPlay = window.tomni.play;
        window.tomni.play = function(data) {
            if(window.tomni.getCurrentCell().info.dataset_id !== 1) {
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
            if(!window.tomni.gameMode || window.tomni.getCurrentCell().info.dataset_id !== 1) return;

            if(e.keyCode === Keycodes.codes.b) {
                e.preventDefault();
                SFX.play("button");
                $borderDiv.toggle();
            }
        });
    }

    $(window).on("ewdlc-account-ready", function() {
        jumpToCell();
        brushControls();
        borderControls();
    });
}

$(document).ready(function() {
    window.EWDLC.modules.extraControls = window.EWDLC.modules.extraControls || new ExtraControls();
});