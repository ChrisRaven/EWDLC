import { Setting } from "../../framework/Setting.js"

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
        $jumpContainer[0].id = 'additionalJumpContainer';
        $button.insertBefore($input);

        // Modify the attributes
        $input.attr("placeholder", "           Enter Cell #");
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

        var $button = $("<div>").attr("title", "Toggle spawn borders (b)").addClass("fob").text("SB")//.addClass("fob show-borders")
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

    function resetCubePositionControls() {
        $('.twoD-controls').append('<div id="reset-cube-position" title="Reset cube position" class="fob reset-cube-position"></div>');
        $('#reset-cube-position').click(function (e) {
            resetCubePosition();
        });
    }

    function toggleEnlargedButtons(name, value) {
        $(".reapAuxButton").toggleClass("tcEnlargeButtons", value);
        $("#editActions").toggleClass("tcEnlargeButtons", value);
    };

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
/*
    camera.fov = cameraProps.fov;
    camera.position.set(cameraProps.position.x, cameraProps.position.y, cameraProps.position.z);
    camera.rotation.set(cameraProps.rotation.x, cameraProps.rotation.y, cameraProps.rotation.z);
    camera.up.set(cameraProps.up.x, cameraProps.up.y, cameraProps.up.z);
    tomni.center.rotation.set(tomniRotation.x, tomniRotation.y, tomniRotation.z);
    tomni.threeD.zoom = threeDZoom;
    camera.updateProjectionMatrix();
    tomni.forceRedraw();*/


    function resetCubePosition() {
        let camera = tomni.threeD.getCamera();
        camera.fov = 40;
        let center = tomni.getCurrentCell().getCenter();
        let shift = tomni.getCurrentCell().info.dataset_id === 1 ? 256 : 2014;
        switch (tomni.twoD.axis) {
            case 'x':
                camera.position.set(-500, 0, 0);
                camera.up.set(0, 0, -1);
                // tomni.center.rotation.set(center.x + shift, center.y, center.z);
                break;
            case 'y':
                camera.position.set(0, 500, 0);
                camera.up.set(0, 0, -1);
                // tomni.center.rotation.set(center.x, center.y + shift, center.z);
                break;
            case 'z':
                camera.position.set(0, 0, -500);
                camera.up.set(0, -1, 0);
                // tomni.center.rotation.set(center.x, center.y, center.z + shift);
                break;
        }

        camera.rotation.set(0, 1, 1);
        tomni.center.rotation = tomni.getCurrentCell().getCenter();//.set(1, 1, 1);
        tomni.threeD.zoom = 750;
        camera.updateProjectionMatrix();
        tomni.forceRedraw();
    }

    $(document).on("ewdlc-account-ready", function() {
        jumpToCell();
        brushControls();
        borderControls();
        // resetCubePositionControls();

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

export {ExtraControls}
export {ExtraControlsInit}
