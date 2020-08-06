$(document).ready(function() {
    // $("#tutorial-overlay").show();

    $("#tutorial-overlay-title-prwe").css({letterSpacing: 1000, fontSize: 120, left: 2500}).animate({letterSpacing: 0, fontSize: 60, left: 0},
        {
            duration: 1000,
            done: function( now, fx ){
            setTimeout(function() {
                $("#tutorial-overlay").fadeOut();
            }, 1000);
        }
    });
});