var tour = null, helpTour = null;
var helpTourCurrentPage = "";

$(document).ready(function() {
    tour = new Tour({
        backdrop: true,
        steps: [
            {
                element: "#tutorial-step-1",
                title: "Welcome to the PowerRanks editor!",
                content: "This introduction will show you how to use this editor.",
                placement: "bottom"
                // backdrop: false
            },
            {
                element: "#tutorial-step-2",
                title: "Navigation",
                content: "To navigate between different configurations, click the desired item."
            },
            {
                element: "#tutorial-step-3",
                title: "Dashboard",
                content: "This is the main page, you can find information and errors here."
            },
            {
                element: "#tutorial-step-4",
                title: "Configuration",
                content: "Configure PowerRanks itself here."
            },
            {
                element: "#tutorial-step-5",
                title: "Ranks",
                content: "Here are all ranks of your server displayed and can be configured here."
            },
            {
                element: "#tutorial-step-6",
                title: "Usertags",
                content: "Here are all usertags of your server displayed and can be configured here."
            },
            {
                element: "#tutorial-step-7",
                title: "Players",
                content: "The list of all players in your server."
            },
            {
                element: "#tutorial-step-8",
                title: "Exit",
                content: "Exit the editor (Any unsaved progress will be lost)"
            },
            {
                element: "#editorsavedatabutton",
                title: "Save",
                content: "When saved you can edit this later without re-initializing the webeditor from within your game, a geen button called 'load' will appear on the Editor ID select screen.<br/><br/><code>This does not export data to your server.</code>"
            },
            {
                element: "#editorexportdatabutton",
                title: "Export",
                content: "Export the data from this web editor session back to your server.<br/><br/>This will create a new ID that then can be used with <code>/pr webeditor load <ID></code>"
            },
            {
                element: "#tutorial-step-11",
                title: "Help",
                content: "If you need help on a specific page. You can click this icon.",
                placement: "bottom"
            }
        ],
        onShow: function (tour) {
                $(".tour-backdrop").remove();
        },
        onShown: function (tour) {
            $("#editorexportdatabutton").show();
            $("#editorsavedatabutton").show();

            $(".popover-navigation .btn-group").empty();
            if (!tour.isLast()) $(".popover-navigation .btn-group").append("<button class='btn btn-warning' onclick='tour.end();'>Skip</button>");
            $(".popover-navigation .btn-group").append("<button class='btn btn-secondary' onclick='tour.goTo(tour.getCurrentStep() - 1);'>Previous</button>");
            if (!tour.isLast()) $(".popover-navigation .btn-group").append("<button class='btn btn-primary' onclick='tour.goTo(tour.getCurrentStep() + 1);'>Next</button>");
            else $(".popover-navigation .btn-group").append("<button class='btn btn-danger' onclick='tour.end();'>Exit</button>");
        },
        onEnd: function (tour) {
            $(".tour-tour").remove();
            $(".tour-backdrop").remove();

            if (parseURLParams(window.location.href).id[0].toLowerCase() === "demo") {
                $("#editorexportdatabutton").hide();
                $("#editorsavedatabutton").hide();
            }
        }
    });

    // Initialize the tour
    tour.init();

    // Start the tour
    tour.start();
    tour.goTo(0);
});

function showHelpTour() {
    helpTour = new Tour({
        backdrop: true,
        steps: [],
        onShow: function (helpTour) {
                $(".tour-backdrop").remove();
        },
        onShown: function (helpTour) {
            $(".popover-navigation .btn-group").empty();
            if (!helpTour.isLast()) $(".popover-navigation .btn-group").append("<button class='btn btn-warning' onclick='helpTour.end();'>Skip</button>");
            $(".popover-navigation .btn-group").append("<button class='btn btn-secondary' onclick='helpTour.goTo(helpTour.getCurrentStep() - 1);'>Previous</button>");
            if (!helpTour.isLast()) $(".popover-navigation .btn-group").append("<button class='btn btn-primary' onclick='helpTour.goTo(helpTour.getCurrentStep() + 1);'>Next</button>");
            else $(".popover-navigation .btn-group").append("<button class='btn btn-danger' onclick='helpTour.end();'>Exit</button>");
        },
        onEnd: function (tour) {
            $(".tour-tour").remove();
            $(".tour-backdrop").remove();
        }
    });
    if (helpTourCurrentPage == "dashboard") {
        helpTour.addStep({
            element: "#content-dashboard",
            title: "Dashboard",
            content: "This is the dashboard window, all information about ranks in your server is displayed here.",
            placement: "bottom"
        });

        helpTour.addStep({
            element: "#help-dashboard-1",
            title: "Player stats",
            content: "The number of online player and the maximum amount of players are displayed here.",
            placement: "bottom"
        });

        helpTour.addStep({
            element: "#help-dashboard-2",
            title: "Server version",
            content: "The version of your server is displayed here.",
            placement: "bottom"
        });

        helpTour.addStep({
            element: "#help-dashboard-3",
            title: "PowerRanks stats",
            content: "The amount of ranks and registered players are displayed here.",
            placement: "bottom"
        });

        helpTour.addStep({
            element: "#help-dashboard-4",
            title: "Date & Time",
            content: "The current date & time, as reported by your browser.",
            placement: "bottom"
        });

        helpTour.addStep({
            element: "#help-dashboard-5",
            title: "Rank Distribution",
            content: "Show the distribution of ranks.",
            placement: "right"
        });

        helpTour.addStep({
            element: "#help-dashboard-6",
            title: "Errors",
            content: "If PowerRanks detects ant errosm it will be displayed here.",
            placement: "left"
        });
    } else if (helpTourCurrentPage == "config") {

        helpTour.addStep({
            element: "#help-configuration-1",
            title: "Configuration",
            content: "Change the configuration of PowerRanks here.",
            placement: "top"
        });

    // } else if (helpTourCurrentPage == "ranks") {

    // } else if (helpTourCurrentPage == "usertags") {

    // } else if (helpTourCurrentPage == "players") {

    } else {
        alert("Help page for " + helpTourCurrentPage + " is not available!");
        return;
    }

    helpTour.init();
    helpTour.start(true);
    helpTour.goTo(0);
}