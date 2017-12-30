import { Setting } from "../../framework/Setting.js"

function ExtraControls() {
    var _enlargeButtons = new Setting("tc-enlarge-reap-buttons", false, false);

    function jumpToCell() {
        if (!window.ewdlc.account.isMystic()) return;

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

			window.tomni.setCell({id: cid}).fail(function () {
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

    function toggleEnlargedButtons(name, value) {
        $(".reapAuxButton").toggleClass("tcEnlargeButtons", value);
        $("#editActions").toggleClass("tcEnlargeButtons", value);
    };

    $(window).on("ewdlc-account-ready", function() {
        jumpToCell();
        brushControls();
        borderControls();
    });

    $(window).on("ewdlc-preferences-loading.extraControls", function() {
        window.ewdlc.preferences.registerSetting(_enlargeButtons);
        _enlargeButtons.registerCallback(toggleEnlargedButtons);
    });

    $(window).on("ewdlc-preferences-loaded.extraControls", function() {
        window.ewdlc.settingsUi.makeCheckbox(_enlargeButtons, "Enlarge d. trace/seed, show parent/kids buttons");
    });
}

function ExtraControlsInit() {
    window.ewdlc.modules.extraControls = window.ewdlc.modules.extraControls || new ExtraControls();
}

export {ExtraControls}
export {ExtraControlsInit}
