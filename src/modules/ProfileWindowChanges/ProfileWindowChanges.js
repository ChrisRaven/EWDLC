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

export {ProfileWindowChangesInit}
export {ProfileWindowChanges}
