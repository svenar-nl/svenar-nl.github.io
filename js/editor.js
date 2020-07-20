var raw_data_input = "";
var file_base_url = "https://file.io/";
var editor_data = {};

var rankDistributionChart = undefined;

var server_data = undefined;
var config_data = undefined;
var ranks_data = undefined;
var players_data = undefined;

$(document).ready(function() {
    $("#noidoverlayinputid").on("input", function() {
        if ($("#noidoverlayinputid").val().length === 0) {
            $("#noidoverlaybtneditorsubmit").hide();
            $("#noidoverlaybtneditordemo").show();
        } else {
            $("#noidoverlaybtneditorsubmit").show();
            $("#noidoverlaybtneditordemo").hide();
        }
    });

    if (getCookie("save_data_size").length > 0) {
        $("#noidoverlaybtneditorloadcookie").show();
    } else {
        $("#noidoverlaybtneditorloadcookie").hide();
    }

    if (parseURLParams(window.location.href) === undefined || parseURLParams(window.location.href).id === undefined) {
        $("#noidoverlay").show();
    } else {
        var request_url = file_base_url + parseURLParams(window.location.href).id[0];
        if (parseURLParams(window.location.href).id[0].toLowerCase() === "demo") {
            request_url = "demo.txt";
            $("#editorexportdatabutton").hide();
            $("#editorsavedatabutton").hide();
        } else {
            $("#editorexportdatabutton").show();
            $("#editorsavedatabutton").show();
        }

        $("#noidoverlayloading").show();

        if (parseURLParams(window.location.href).id[0].toLowerCase() === "save") {
            loadDataCookie();
            // request_url = "demo.txt";
            // $("#editorexportdatabutton").hide();
        } else {
            setTimeout(function(){
                $.ajax({
                    type: 'GET',
                    url: request_url,
                    async: false,
                    success: function(data) {
                        if (data.includes("@")) {
                            var data_split = data.split("@");
                            if (data_split[0] == "POWERRANKS") {
                                raw_data_input = data_split[1];
                                $("#noidoverlay").hide();
                                $("#noidoverlayloading").hide();
                                $("#noidoverlayinvalidid").hide();
                                setup_editor();
                            } else {
                                $("#noidoverlay").show();
                                $("#noidoverlayloading").hide();
                                $("#noidoverlayinvalidid").fadeIn();
                            }
                        } else {
                            $("#noidoverlay").show();
                            $("#noidoverlayloading").hide();
                            $("#noidoverlayinvalidid").fadeIn();
                        }
                    },
                    error: function(data) {
                        $("#noidoverlay").show();
                        $("#noidoverlayloading").hide();
                        $("#noidoverlayinvalidid").fadeIn();
                    }
                });
            }, 1000);
        }
    }

    $("#crcurryear").text(new Date().getFullYear());
      
});

function setup_editor() {
    var tmp_raw_data_split = atob(raw_data_input).split("\n");
    server_data = JSON.parse(tmp_raw_data_split[0]);
    config_data = JSON.parse(tmp_raw_data_split[1]);
    ranks_data = JSON.parse(tmp_raw_data_split[2]);
    players_data = JSON.parse(tmp_raw_data_split[3]);
    
    replace_menu_dropdown_items(config_data, ranks_data, players_data);
    replace_dashboard_info(server_data, config_data, ranks_data, players_data);
    show_content("dashboard", "");

    console.log(tmp_raw_data_split);
    console.log(server_data);
    console.log(config_data);
    console.log(ranks_data);
    console.log(players_data);

    var data = {
        datasets: [{
            data: [],
            backgroundColor: []
          }],
        labels: []
    };
    setTimeout(function() { // Little delay for replaceOnPage to finish
        var ctx = $('#rank-distribution-chart');
        rankDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {}
        });
      }, 1000);
}

function replace_menu_dropdown_items(config_data, ranks_data, players_data) {
    var config_dropdown_items = "";
    var ranks_dropdown_items = "";
    var usertag_dropdown_items = "";
    var player_dropdown_items = "";

    for (var item in config_data) {
        if (item.toLowerCase() !== "version") {
            config_dropdown_items += "<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('config', '" + item + "');\" style=\"cursor: pointer;\">" + item + "</a></li>";
        }
    }

    for (var item in ranks_data.Groups) {
        ranks_dropdown_items += "<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('ranks', '" + item + "');\" style=\"cursor: pointer;\">" + item + "</a></li>";
    }

    if (typeof(ranks_data.Usertags) !== "string") {
        for (var item in ranks_data.Usertags) {
            usertag_dropdown_items += "<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('usertags', '" + item + "');\" style=\"cursor: pointer;\">" + item + "</a></li>";
        }
    }

    for (var item in players_data.players) {
        player_dropdown_items += "<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('players', '" + item + "');\" style=\"cursor: pointer;\">" + players_data.players[item].name + "</a></li>";
    }

    replaceOnPage("{{menu_dropdown_config}}", config_dropdown_items);
    replaceOnPage("{{menu_dropdown_ranks}}", ranks_dropdown_items);
    replaceOnPage("{{menu_dropdown_usertags}}", usertag_dropdown_items);
    replaceOnPage("{{menu_dropdown_players}}", player_dropdown_items);
}

function replace_dashboard_info(server_data, config_data, ranks_data, players_data) {
    if (server_data.server_version !== undefined && server_data.server_version.includes("-") && server_data.server_version.split("-").length > 1 && server_data.server_version.includes("(") && server_data.server_version.split("(").length > 1) {
        replaceOnPage("{{server_placeholder}}", server_data.server_version.split("-")[1] + " " + server_data.server_version.split("(")[1].replace(")", "").replace("MC: ", ""));
    } else {
        replaceOnPage("{{server_placeholder}}", server_data.server_name);
    }

    replaceOnPage("{{server_players}}", server_data.server_players + " / " + server_data.server_players_max);
    replaceOnPage("{{server_players_percent}}", Math.round((100 / server_data.server_players_max) * server_data.server_players) + "%");
    replaceOnPage("{{server_version}}", server_data.server_version);
    replaceOnPage("{{powerranks_version}}", server_data.powerranks_version);
    
    update_datetime();
    setInterval(function(){
        update_datetime();
    }, 1000);

    var number_of_registered_ranks = 0;
    var number_of_registered_players = 0;

    for (var rank in ranks_data.Groups) {
        number_of_registered_ranks += 1;
    }

    for (var player in players_data.players) {
        number_of_registered_players += 1;
    }

    replaceOnPage("{{powerranks_num_ranks}}", number_of_registered_ranks);
    replaceOnPage("{{powerranks_num_players}}", number_of_registered_players);

    check_for_configuration_errors(server_data, config_data, ranks_data, players_data);

    setTimeout(function() { // Wait for chart load
        var rank_count = {};
        for (var player in players_data.players) {
            if (rank_count[players_data.players[player].rank] === undefined) {
                rank_count[players_data.players[player].rank] = 1;
            } else {
                rank_count[players_data.players[player].rank] = rank_count[players_data.players[player].rank] + 1;
            }
        }

        var rand = new Math.seedrandom(1059);
        for (var rank in rank_count) {
            rankDistributionChart.data.labels.push(rank);
            rankDistributionChart.data.datasets[0].data.push(rank_count[rank]);
            rankDistributionChart.data.datasets[0].backgroundColor.push("rgb(" + Math.round(rand.quick() * 10) * 25 + ", " + Math.round(rand.quick() * 10) * 25 + ", " + Math.round(rand.quick() * 10) * 25 + ")");
        }
        rankDistributionChart.update();
    }, 1100);
}

function addUsertag(name) {
    if (typeof(player_rank.Usertags) == "string") {
        player_rank.Usertags = {};
    }

    player_rank.Usertags[name] = "[" + name + "]";

}

function update_datetime() {
    var current_date = new Date();
    $(".generaldatetime").text((current_date.getDate() < 10 ? "0" + current_date.getDate() : current_date.getDate()) + "-" + ((current_date.getMonth() + 1) < 10 ? "0" + (current_date.getMonth() + 1) : (current_date.getMonth() + 1)) + "-" + current_date.getFullYear() + " " + (current_date.getHours() < 10 ? "0" + current_date.getHours() : current_date.getHours()) + ":" + (current_date.getMinutes() < 10 ? "0" + current_date.getMinutes() : current_date.getMinutes()) + ":" + (current_date.getSeconds() < 10 ? "0" + current_date.getSeconds() : current_date.getSeconds()));
}

function check_for_configuration_errors(server_data, config_data, ranks_data, players_data) {
    var has_valid_default_rank = false;
    for (var rank in ranks_data.Groups) {
        if (rank.toLowerCase() == ranks_data.Default.toLowerCase()) {
            has_valid_default_rank = true;
            break;
        }
    }
    if (!has_valid_default_rank) {
        create_dashoard_errorcard("Undefined Default Rank", "The default rank '" + ranks_data.Default + "' does not exist in Ranks.yml", "Ranks.yml");
    }

    for (var uuid in players_data.players) {
        var player_rank = players_data.players[uuid].rank;
        var player_name = players_data.players[uuid].name;
        var player_usertag = players_data.players[uuid].usertag;
        var player_subranks = players_data.players[uuid].subranks;
        // if (!ranks_data.Groups.hasOwnProperty(player_rank)) {
        //     create_dashoard_errorcard("Undefined Rank", "Player " + player_name + " has the rank '" + player_rank + "' which does not exist in Ranks.yml", "Players.yml");
        // }
        var has_valid_rank = false;
        var has_valid_usertag = false;
        for (var rank in ranks_data.Groups) {
            if (rank.toLowerCase() == player_rank.toLowerCase()) {
                has_valid_rank = true;
                break;
            }
        }

        if (player_usertag.length > 0) {
            for (var usertag in ranks_data.Usertags) {
                if (usertag.toLowerCase() == player_usertag.toLowerCase()) {
                    has_valid_usertag = true;
                    break;
                }
            }
        } else {
            has_valid_usertag = true;
        }

        if (!has_valid_rank) {
            create_dashoard_errorcard("Undefined Rank", "Player " + player_name + " has the rank '" + player_rank + "' which does not exist in Ranks.yml", "Players.yml");
        }

        if (!has_valid_usertag) {
            create_dashoard_errorcard("Undefined Usertag", "Player " + player_name + " has the usertag '" + player_usertag + "' which does not exist in Ranks.yml", "Players.yml");
        }

        if (typeof(player_subranks) != "string") {
            for (var subrank in player_subranks) {
                var has_valid_subrank = false;

                for (var rank in ranks_data.Groups) {
                    if (rank.toLowerCase() == subrank.toLowerCase()) {
                        has_valid_subrank = true;
                        break;
                    }
                }

                if (!has_valid_subrank) {
                    create_dashoard_errorcard("Undefined Subrank", "Player " + player_name + " has the subrank '" + subrank + "' which does not exist in Ranks.yml", "Players.yml");
                }
            }
        }

        
    }
}

function create_dashoard_errorcard(title, msg, location) {
    var base = "<div class=\"preview-list\"><div class=\"preview-item border-bottom\"><div class=\"preview-thumbnail\"><div class=\"preview-icon bg-danger\"><i class=\"mdi mdi mdi-alert-circle-outline\"></i></div></div><div class=\"preview-item-content d-sm-flex flex-grow\"><div class=\"flex-grow\"><h6 class=\"preview-subject\">{{error_title}}</h6><p class=\"text-muted mb-0\">{{error_message}}</p></div><div class=\"mr-auto text-sm-right pt-2 pt-sm-0\"><p class=\"text-muted\">{{error_location}}</p></div></div></div></div>";
    base = base.replace("{{error_title}}", title).replace("{{error_message}}", msg).replace("{{error_location}}", location);
    $("#error-log-content").append(base);
    $("#error-log-count").text($("#error-log-content").children().length);
}

function show_content(page, item) {
    if (page.toLowerCase() === "dashboard") {
        $("#content-dashboard").show();
        $("#content-configuration").hide();
        $("#content-ranks").hide();
        $("#content-usertags").hide();
        $("#content-players").hide();
        $("#content-about").hide();
    }

    if (page.toLowerCase() === "config") {
        $("#content-dashboard").hide();
        $("#content-configuration").show();
        $("#content-ranks").hide();
        $("#content-usertags").hide();
        $("#content-players").hide();
        $("#content-about").hide();
        $("#content-configuration-item").text(item);
    }

    if (page.toLowerCase() === "ranks") {
        $("#content-dashboard").hide();
        $("#content-configuration").hide();
        $("#content-ranks").show();
        $("#content-usertags").hide();
        $("#content-players").hide();
        $("#content-about").hide();
        $("#content-ranks-item").text(item);
    }

    if (page.toLowerCase() === "usertags") {
        $("#content-dashboard").hide();
        $("#content-configuration").hide();
        $("#content-ranks").hide();
        $("#content-usertags").show();
        $("#content-players").hide();
        $("#content-about").hide();
        $("#content-usertags-item").text(item);
    }

    if (page.toLowerCase() === "players") {
        $("#content-dashboard").hide();
        $("#content-configuration").hide();
        $("#content-ranks").hide();
        $("#content-usertags").hide();
        $("#content-players").show();
        $("#content-about").hide();
        $("#content-players-item").text(item);
    }

    if (page.toLowerCase() === "about") {
        $("#content-dashboard").hide();
        $("#content-configuration").hide();
        $("#content-ranks").hide();
        $("#content-usertags").hide();
        $("#content-players").hide();
        $("#content-about").show();
    }
}

function saveDataCookie() {
    var raw_data = "POWERRANKS@" + btoa(JSON.stringify(server_data) + "\n" + JSON.stringify(config_data) + "\n" + JSON.stringify(ranks_data) + "\n" + JSON.stringify(players_data));
    var splitData = [];
    var split_size = 2048;
    do{ splitData.push(raw_data.substring(0, split_size)) } 
    while( (raw_data = raw_data.substring(split_size, raw_data.length)) != "" );

    setCookie("save_data_size", splitData.length, 365);
    for (var i = 0; i < splitData.length; i++) {
        setCookie("save_data_" + i, splitData[i], 365);
    }

    $('#popup-save').fadeOut();
    $('#popup-save-done').fadeIn();
}

function loadDataCookie() {
    if (getCookie("save_data_size").length > 0) {
        var saveData = "";
        for (var i = 0; i < getCookie("save_data_size"); i++) {
            saveData += getCookie("save_data_" + i);
        }
        raw_data_input = saveData.split("@")[1];
        $("#noidoverlay").hide();
        $("#noidoverlayloading").hide();
        $("#noidoverlayinvalidid").hide();
        setup_editor();
    }
}

function exportData() {
    var raw_data = "POWERRANKS@" + btoa(JSON.stringify(server_data) + "\n" + JSON.stringify(config_data) + "\n" + JSON.stringify(ranks_data) + "\n" + JSON.stringify(players_data));

    $.post(file_base_url, {text: raw_data}, function(data) {
        $("#popup-exporting").fadeOut();
        $("#popup-export-done").fadeIn();
        $("#export-id").text(data["key"]);
        $("#export-command").text("/pr webeditor load " + data["key"]);
    })
    .fail(function(data) {
        alert("There was a error exporting your data, please save and try again in a few minutes.");
        $("#popup-exporting").fadeOut();
    })
}

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
    queryEnd = url.indexOf("#") + 1 || url.length + 1,
    query = url.slice(queryStart, queryEnd - 1),
    pairs = query.replace(/\+/g, " ").split("&"),
    parms = {}, i, n, v, nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) parms[n] = [];
            parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function replaceOnPage(search, replacement) {
    document.getElementsByTagName("body")[0].innerHTML = document.getElementsByTagName("body")[0].innerHTML.replaceAll(search, replacement);
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
