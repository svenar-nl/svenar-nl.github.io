var raw_data_input = "";
var file_base_url = "https://file.io/";
var editor_data = {};

var rankDistributionChart = undefined;

var server_data = undefined;
var config_data = undefined;
var ranks_data = undefined;
var players_data = undefined;

$(document).ready(function() {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        $("#mobileDetected").show();
    }

    $("#noidoverlayinputid").on("input", function() {
        if ($("#noidoverlayinputid").val().length === 0) {
            $("#noidoverlaybtneditorsubmit").hide();
            $("#noidoverlaybtneditordemo").show();
        } else {
            $("#noidoverlaybtneditorsubmit").show();
            $("#noidoverlaybtneditordemo").hide();
        }
    });

    // Privacy policy

    var seen_privacy_policy_notice = getCookie("seen_privacy_policy_notice").length > 0;
    if (!seen_privacy_policy_notice) {
        $("#popup-privacy-policy").fadeIn();
    }

    // Privacy policy

    if (getFromLocalStorage("save_data_size") !== null) {
        if (getFromLocalStorage("save_data_size").length > 0) {
            $("#noidoverlaybtneditorloadcookie").show();
        } else {
            $("#noidoverlaybtneditorloadcookie").hide();
        }
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
    $("#prdevtime").text(new Date().getFullYear() - 2014);

    
    $(window).resize(function() {
        $("#content-players-output-div-tablist").css("bottom", $("#content-players-output-image").height());
    });
});

function setup_editor() {
    var tmp_raw_data_split = decodeUnicode(raw_data_input).split("\n");
    server_data = JSON.parse(tmp_raw_data_split[0]);
    config_data = JSON.parse(tmp_raw_data_split[1]);
    ranks_data = JSON.parse(tmp_raw_data_split[2]);
    players_data = JSON.parse(tmp_raw_data_split[3]);

    for (rank in ranks_data.Groups) {
        ranks_data.Groups[rank.replaceAll("\\+", "prplus")] = ranks_data.Groups[rank];
        
        if (rank.includes("+")) {
            delete ranks_data.Groups[rank];
        }
    }
    
    replace_menu_dropdown_items(config_data, ranks_data, players_data);
    replace_dashboard_info(server_data, config_data, ranks_data, players_data);
    show_content("dashboard", "");

    // console.log(tmp_raw_data_split);
    // console.log(server_data);
    // console.log(config_data);
    // console.log(ranks_data);
    // console.log(players_data);

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
        ranks_dropdown_items += "<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('ranks', '" + item.replaceAll("\\+", "prplus") + "');\" style=\"cursor: pointer;\">" + item.replaceAll("prplus", "+") + "</a></li>";
    }

    if (typeof(ranks_data.Usertags) !== "string") {
        for (var item in ranks_data.Usertags) {
            usertag_dropdown_items += "<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('usertags', '" + item + "');\" style=\"cursor: pointer;\">" + item + "</a></li>";
        }
    }

    for (var item in players_data.players) {
        player_dropdown_items += "<li class=\"nav-item\"><a class=\"nav-link\" onclick=\"show_content('players', '" + item + "');\" style=\"cursor: pointer;\"><img src=\"https://crafatar.com/avatars/" + item + "?size=24&default=MHF_Steve\" alt=\"[plrhead]\" style=\"width: 24px; margin-right: 5px;\" /> " + players_data.players[item].name + "</a></li>";
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

        if (player_usertag !== undefined) {
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
    helpTourCurrentPage = page.toLowerCase();
    
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
        $("#content-configuration-item").text(item.replaceAll("_", " "));

        updateConfigContentBody(item);
    }

    if (page.toLowerCase() === "ranks") {
        $("#content-dashboard").hide();
        $("#content-configuration").hide();
        $("#content-ranks").show();
        $("#content-usertags").hide();
        $("#content-players").hide();
        $("#content-about").hide();
        $("#content-ranks-item").text(item.replaceAll("prplus", "+"));

        $("#content-ranks-table-rank-button-remove").attr("onclick", "deleteRank('" + item + "');");

        $("#content-ranks-table-rank-name").html("<input type=\"text\" class=\"form-control\" value=\"" + item.replaceAll("prplus", "+") + "\" onchange=\"renameRank('" + item + "', $(this).val());\" />");
        $("#content-ranks-table-rank-build").html("<input class=\"checkbox-input checkbox-ranks-build-enable\" type=\"checkbox\" " + (ranks_data.Groups[item].build ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-ranks-build-enable').attr('checked', !$('.checkbox-ranks-build-enable').attr('checked')); ranks_data.Groups['" + item + "'].build = !!$('.checkbox-ranks-build-enable').attr('checked');\"></span>");
        $("#content-ranks-table-rank-prefix").html("<input type=\"text\" class=\"form-control\" value=\"" + ranks_data.Groups[item].chat.prefix + "\" onchange=\"ranks_data.Groups['" + item + "'].chat.prefix = $(this).val(); $('#content-ranks-table-rank-prefix-preview').html(formatMinecraftColor(ranks_data.Groups['" + item + "'].chat.prefix));\" />");
        $("#content-ranks-table-rank-suffix").html("<input type=\"text\" class=\"form-control\" value=\"" + ranks_data.Groups[item].chat.suffix + "\" onchange=\"ranks_data.Groups['" + item + "'].chat.suffix = $(this).val(); $('#content-ranks-table-rank-suffix-preview').html(formatMinecraftColor(ranks_data.Groups['" + item + "'].chat.suffix));\" />");
        $("#content-ranks-table-rank-chatcolor-color").attr("onchange", "if(ranks_data.Groups['" + item + "'].chat.chatColor.match('[0-9a-fA-F]')){if($(this).val().length > 0){ranks_data.Groups['" + item + "'].chat.chatColor = ranks_data.Groups['" + item + "'].chat.chatColor.replaceAt(ranks_data.Groups['" + item + "'].chat.chatColor.match('[0-9a-fA-F]').index-1, $(this).val());}else{ranks_data.Groups['" + item + "'].chat.chatColor = ranks_data.Groups['" + item + "'].chat.chatColor.replaceAt(ranks_data.Groups['" + item + "'].chat.chatColor.match('[0-9a-fA-F]').index-1, '  ').replaceAll('  ', '');}}else{ranks_data.Groups['" + item + "'].chat.chatColor=$(this).val()+ranks_data.Groups['" + item + "'].chat.chatColor;}");
        $("#content-ranks-table-rank-chatcolor-special").attr("onchange", "if(ranks_data.Groups['" + item + "'].chat.chatColor.match('[LlMmNnOoKk]')){if($(this).val().length > 0){ranks_data.Groups['" + item + "'].chat.chatColor = ranks_data.Groups['" + item + "'].chat.chatColor.replaceAt(ranks_data.Groups['" + item + "'].chat.chatColor.match('[LlMmNnOoKk]').index-1, $(this).val());}else{ranks_data.Groups['" + item + "'].chat.chatColor = ranks_data.Groups['" + item + "'].chat.chatColor.replaceAt(ranks_data.Groups['" + item + "'].chat.chatColor.match('[LlMmNnOoKk]').index-1, '  ').replaceAll('  ', '');}}else{ranks_data.Groups['" + item + "'].chat.chatColor=ranks_data.Groups['" + item + "'].chat.chatColor+$(this).val();}");
        $("#content-ranks-table-rank-namecolor-color").attr("onchange", "if(ranks_data.Groups['" + item + "'].chat.nameColor.match('[0-9a-fA-F]')){if($(this).val().length > 0){ranks_data.Groups['" + item + "'].chat.nameColor = ranks_data.Groups['" + item + "'].chat.nameColor.replaceAt(ranks_data.Groups['" + item + "'].chat.nameColor.match('[0-9a-fA-F]').index-1, $(this).val());}else{ranks_data.Groups['" + item + "'].chat.nameColor = ranks_data.Groups['" + item + "'].chat.nameColor.replaceAt(ranks_data.Groups['" + item + "'].chat.nameColor.match('[0-9a-fA-F]').index-1, '  ').replaceAll('  ', '');}}else{ranks_data.Groups['" + item + "'].chat.nameColor=$(this).val()+ranks_data.Groups['" + item + "'].chat.nameColor;}");
        $("#content-ranks-table-rank-namecolor-special").attr("onchange", "if(ranks_data.Groups['" + item + "'].chat.nameColor.match('[LlMmNnOoKk]')){if($(this).val().length > 0){ranks_data.Groups['" + item + "'].chat.nameColor = ranks_data.Groups['" + item + "'].chat.nameColor.replaceAt(ranks_data.Groups['" + item + "'].chat.nameColor.match('[LlMmNnOoKk]').index-1, $(this).val());}else{ranks_data.Groups['" + item + "'].chat.nameColor = ranks_data.Groups['" + item + "'].chat.nameColor.replaceAt(ranks_data.Groups['" + item + "'].chat.nameColor.match('[LlMmNnOoKk]').index-1, '  ').replaceAll('  ', '');}}else{ranks_data.Groups['" + item + "'].chat.nameColor=ranks_data.Groups['" + item + "'].chat.nameColor+$(this).val();}");

        var content_ranks_table_rank_inheritances = "";
        content_ranks_table_rank_inheritances += "<select id=\"content-ranks-table-rank-" + item + "-inheritance-select\" class=\"form-select\">";
        for (var rank in ranks_data.Groups) {
            if (rank !== item && !ranks_data.Groups[item].inheritance.includes(rank)) {
                content_ranks_table_rank_inheritances += "<option value=\"" + rank + "\">" + rank.replaceAll("prplus", "+") + "</option>";
            }
        }
        content_ranks_table_rank_inheritances += "</select>";
        content_ranks_table_rank_inheritances += "<button class=\"btn btn-success\" onclick=\"addRankInheritance('content-ranks-table-rank-" + item + "-inheritance-select', '" + item + "');\" style=\"width: 100%; margin-bottom: 25px;\">Add Inheritance</button>";
        content_ranks_table_rank_inheritances += "<div>";
        for (var key in ranks_data.Groups[item].inheritance) {
            var inheritance_rank = ranks_data.Groups[item].inheritance[key];
            content_ranks_table_rank_inheritances += "<p style=\"border-bottom: 1px solid #2c2e33;margin-bottom: 25px;\">" + inheritance_rank.replaceAll("prplus", "+");
            content_ranks_table_rank_inheritances += "<button class=\"btn btn-danger\" style=\"float: right;margin-top: -15px;\" onclick=\"ranks_data.Groups['" + item + "'].inheritance.splice( $.inArray('" + inheritance_rank + "', ranks_data.Groups['" + item + "'].inheritance), 1); show_content('ranks', '" + item + "');\">X</button>";
            content_ranks_table_rank_inheritances += "</p>";
        }
        content_ranks_table_rank_inheritances += "</div>";
        $("#content-ranks-table-rank-inheritances").html(content_ranks_table_rank_inheritances);

        var content_ranks_table_rank_buyable = "";
        content_ranks_table_rank_buyable += "<select id=\"content-ranks-table-rank-" + item + "-economy-buyable-select\" class=\"form-select\">";
        for (var rank in ranks_data.Groups) {
            if (rank !== item && !ranks_data.Groups[item].economy.buyable.includes(rank)) {
                content_ranks_table_rank_buyable += "<option value=\"" + rank + "\">" + rank + "</option>";
            }
        }
        content_ranks_table_rank_buyable += "</select>";
        content_ranks_table_rank_buyable += "<button class=\"btn btn-success\" onclick=\"addRankEconomyBuyable('content-ranks-table-rank-" + item + "-economy-buyable-select', '" + item + "');\" style=\"width: 100%; margin-bottom: 25px;\">Add Inheritance</button>";
        content_ranks_table_rank_buyable += "<div>";
        for (var key in ranks_data.Groups[item].economy.buyable) {
            var buyable_rank = ranks_data.Groups[item].economy.buyable[key];
            content_ranks_table_rank_buyable += "<p style=\"border-bottom: 1px solid #2c2e33;margin-bottom: 25px;\">" + buyable_rank;
            content_ranks_table_rank_buyable += "<button class=\"btn btn-danger\" style=\"float: right;margin-top: -15px;\" onclick=\"ranks_data.Groups['" + item + "'].economy.buyable.splice( $.inArray('" + buyable_rank + "', ranks_data.Groups['" + item + "'].economy.buyable), 1); show_content('ranks', '" + item + "');\">X</button>";
            content_ranks_table_rank_buyable += "</p>";
        }
        content_ranks_table_rank_buyable += "</div>";
        $("#content-ranks-table-rank-economy-buyable").html(content_ranks_table_rank_buyable);

        var content_ranks_table_rank_promote = "";
        var content_ranks_table_rank_demote = "";

        content_ranks_table_rank_promote += "<option value=\"\">None</option>";
        content_ranks_table_rank_demote += "<option value=\"\">None</option>";
        for (var rank in ranks_data.Groups) {
            if (rank !== item) {
                content_ranks_table_rank_promote += "<option value=\"" + rank + "\" " + (rank === ranks_data.Groups[item].level.promote ? "selected" : "") + ">" + rank + "</option>";
                content_ranks_table_rank_demote += "<option value=\"" + rank + "\" " + (rank === ranks_data.Groups[item].level.demote ? "selected" : "") + ">" + rank + "</option>";
            }
        }
        $("#content-ranks-table-rank-promote").attr("onchange", "if ($(this).val().length>0){ranks_data.Groups['" + item + "'].level.promote=$(this).val();}else{ranks_data.Groups['" + item + "'].level.promote='';}show_content('ranks', '" + item + "');");
        $("#content-ranks-table-rank-demote").attr("onchange", "if ($(this).val().length>0){ranks_data.Groups['" + item + "'].level.demote=$(this).val();}else{ranks_data.Groups['" + item + "'].level.demote='';}show_content('ranks', '" + item + "');");
        $("#content-ranks-table-rank-promote").html(content_ranks_table_rank_promote);
        $("#content-ranks-table-rank-demote").html(content_ranks_table_rank_demote);

        $("#content-ranks-table-rank-economy-cost").attr("onchange", "ranks_data.Groups['" + item + "'].economy.cost=$(this).val();show_content('ranks', '" + item + "');");
        $("#content-ranks-table-rank-economy-cost").val(parseInt(ranks_data.Groups[item].economy.cost));

        var content_ranks_table_rank_gui_icon = "";
        for (var i = 0; i < minecraft_items.length; i++) {
            var mcitem = minecraft_items[i].toLowerCase();
            // if (mcitem !== item) {
                content_ranks_table_rank_gui_icon += "<option value=\"" + mcitem + "\" " + (mcitem === ranks_data.Groups[item].gui.icon.toLowerCase() ? "selected" : "") + ">" + mcitem + "</option>";
            // }
        }
        $("#content-ranks-table-rank-gui-icon").html(content_ranks_table_rank_gui_icon);
        $("#content-ranks-table-rank-gui-icon").attr("onchange", "ranks_data.Groups['" + item + "'].gui.icon=$(this).val();show_content('ranks', '" + item + "');");

        // ///////////

        if (ranks_data.Groups[item].chat.chatColor.match('[0-9a-fA-F]')) {
            $("#content-ranks-table-rank-chatcolor-color").val(ranks_data.Groups[item].chat.chatColor[ranks_data.Groups[item].chat.chatColor.match('[0-9a-fA-F]').index - 1] + ranks_data.Groups[item].chat.chatColor[ranks_data.Groups[item].chat.chatColor.match('[0-9a-fA-F]').index])
        } else {
            $("#content-ranks-table-rank-chatcolor-color").val("");
        }

        if (ranks_data.Groups[item].chat.chatColor.match('[LlMmNnOoKk]')) {
            $("#content-ranks-table-rank-chatcolor-special").val(ranks_data.Groups[item].chat.chatColor[ranks_data.Groups[item].chat.chatColor.match('[LlMmNnOoKk]').index - 1] + ranks_data.Groups[item].chat.chatColor[ranks_data.Groups[item].chat.chatColor.match('[LlMmNnOoKk]').index])
        } else {
            $("#content-ranks-table-rank-chatcolor-special").val("");
        }

        if (ranks_data.Groups[item].chat.nameColor.match('[0-9a-fA-F]')) {
            $("#content-ranks-table-rank-namecolor-color").val(ranks_data.Groups[item].chat.nameColor[ranks_data.Groups[item].chat.nameColor.match('[0-9a-fA-F]').index - 1] + ranks_data.Groups[item].chat.nameColor[ranks_data.Groups[item].chat.nameColor.match('[0-9a-fA-F]').index])
        } else {
            $("#content-ranks-table-rank-namecolor-color").val("");
        }

        if (ranks_data.Groups[item].chat.nameColor.match('[LlMmNnOoKk]')) {
            $("#content-ranks-table-rank-namecolor-special").val(ranks_data.Groups[item].chat.nameColor[ranks_data.Groups[item].chat.nameColor.match('[LlMmNnOoKk]').index - 1] + ranks_data.Groups[item].chat.nameColor[ranks_data.Groups[item].chat.nameColor.match('[LlMmNnOoKk]').index])
        } else {
            $("#content-ranks-table-rank-namecolor-special").val("");
        }
        
        $('#content-ranks-table-rank-prefix-preview').html(formatMinecraftColor(ranks_data.Groups[item].chat.prefix));
        $('#content-ranks-table-rank-suffix-preview').html(formatMinecraftColor(ranks_data.Groups[item].chat.suffix));

        $("#content-ranks-table-permissions-button-add").attr("onclick", "if ($('#content-ranks-table-permissions-input-add').val().length > 0) {if (!ranks_data.Groups['" + item + "'].permissions.includes($('#content-ranks-table-permissions-input-add').val()) && !ranks_data.Groups['" + item + "'].permissions.includes('-' + $('#content-ranks-table-permissions-input-add').val())) {ranks_data.Groups['" + item + "'].permissions.push($('#content-ranks-table-permissions-input-add').val()); $('#content-ranks-table-permissions-input-add').val(''); show_content('ranks', '" + item + "');}$('#content-ranks-table-permissions-input-add').val('');}");

        //$("#content-players-table-permissions-button-add").attr("onclick", "if ($('#content-players-table-permissions-input-add').val().length > 0) {if (!players_data.players['" + item + "'].permissions.includes($('#content-players-table-permissions-input-add').val()) && !players_data.players['" + item + "'].permissions.includes('-' + $('#content-players-table-permissions-input-add').val())) {players_data.players['" + item + "'].permissions.push($('#content-players-table-permissions-input-add').val()); $('#content-players-table-permissions-input-add').val(''); show_content('players', '" + item + "');}$('#content-players-table-permissions-input-add').val('');}");

        var content_ranks_table_permissions = "";
        for (var i = 0; i < ranks_data.Groups[item].permissions.length; i++) {
            var permission = ranks_data.Groups[item].permissions[i];
            content_ranks_table_permissions += "<tr>";
            content_ranks_table_permissions += "<td>" + permission + "</td>";
            content_ranks_table_permissions += "<td>";
            content_ranks_table_permissions += "<button class=\"btn btn-" + (permission[0] === "-" ? "warning" : "success") + "\" onclick=\"toggleRankPermission(this, '" + item + "', '" + permission + "'); show_content('ranks', '" + item + "');\">" + (permission[0] === "-" ? "Disallowed" : "Allowed") + "</button>";
            content_ranks_table_permissions += "<button class=\"btn btn-danger\" style=\"float: right;\" onclick=\"ranks_data.Groups['" + item + "'].permissions.splice( $.inArray('" + permission + "', ranks_data.Groups['" + item + "'].permissions), 1); show_content('ranks', '" + item + "');\">X</button>";
            content_ranks_table_permissions += "</td>";
            content_ranks_table_permissions += "</tr>";
        }
        $("#content-ranks-table-permissions").html(content_ranks_table_permissions);

        autocomplete(document.getElementById("content-ranks-table-permissions-input-add"), server_data.server_permissions.split(","));
    }

    if (page.toLowerCase() === "usertags") {
        $("#content-dashboard").hide();
        $("#content-configuration").hide();
        $("#content-ranks").hide();
        $("#content-usertags").show();
        $("#content-players").hide();
        $("#content-about").hide();

        var content = "<div class=\"row\">";
        content += "<div class=\"col-md-12\">";
        content += "<div class=\"card\">";
        content += "<h1 class=\"card-title\" style=\"margin-left: 20px;margin-top: 20px;text-align: center;\">" + item + "</h1>";
        content += "<div class=\"card-body\">";
        content += "<button class=\"btn btn-danger\" onclick=\"delete ranks_data.Usertags['" + item + "']; $('#menu_side_dropdown_usertags').children().remove(':contains(" + item + "):first()'); show_content('dashboard', '');\" style=\"left: 40%;width: 20%;position: absolute;\">Delete</button>";
        content += "<table class=\"table table-bordered\" style=\"margin-top: 45px;\"><thead><tr><th scope=\"col\">Key</th><th scope=\"col\">Value</th><th scope=\"col\">Description</th></tr></thead><tbody>";
        content += "<tr><td>Format</td><td>";
        content += "<input class=\"form-control\" type=\"text\" value=\"" + ranks_data.Usertags[item] + "\" onchange=\"ranks_data.Usertags['" + item + "'] = this.value; $('.usertag-format-preview').html(formatMinecraftColor(ranks_data.Usertags['" + item + "']));\" style=\"width: 100%;\">";
        content += "</td><td>Change the look of this usertag<br /><br />Preview: <span class=\"usertag-format-preview\" style=\"background-color: #5f4225;\"></span></td></tr>";
        content += "</tbody></table>";
        content += "</div>";
        content += "</div>";
        content += "</div>";
        content += "</div>";
        content += "";
        $("#content-usertags-item").html(content);
        $('.usertag-format-preview').html(formatMinecraftColor(ranks_data.Usertags[item]));
    }

    if (page.toLowerCase() === "players") {
        $("#content-dashboard").hide();
        $("#content-configuration").hide();
        $("#content-ranks").hide();
        $("#content-usertags").hide();
        $("#content-players").show();
        $("#content-about").hide();

        $("#content-players-playername").html("<img src=\"https://crafatar.com/avatars/" + item + "?size=36&amp;default=MHF_Steve\" alt=\"[plrhead]\" style=\"width: 36px;margin-right: 5px;margin-top: -10px;\">" + players_data.players[item].name);
        $("#content-players-table-player-button-remove").attr("onclick", "$('#menu_side_dropdown_players').children().remove(':contains(" + players_data.players[item].name + "):first()'); delete players_data.players['" + item + "']; show_content('dashboard', '');");

        updatePlayerContentGamePreview(item);

        $("#content-players-table-uuid").text(item);
        $("#content-players-table-playername").text(players_data.players[item].name);
        $("#content-players-table-playtime").text(players_data.players[item].playtime !== undefined ? players_data.players[item].playtime.toString().toHHMMSS() : "0".toHHMMSS());
        $("#content-players-table-usertag").text(players_data.players[item].usertag);

        var select_content_player_rank = "";
        for (var rank in ranks_data.Groups) {
            select_content_player_rank += "<option value=\"" + rank + "\" " + (rank === players_data.players[item].rank ? "selected" : "") + ">" + rank + "</option>";
        }
        if (!select_content_player_rank.includes("selected")) {
            select_content_player_rank += "<option value=\"" + players_data.players[item].rank + "\" selected style=\"color: #b12121\">" + players_data.players[item].rank + "</option>";
        }
        $("#content-players-table-rank").html(select_content_player_rank);
        $("#content-players-table-rank").attr("onchange", "players_data.players['" + item + "'].rank = this.selectedOptions[0].value; show_content('players', '" + item + "');");

        var select_content_player_usertag = "<option value=\"\">None</option>";
        for (var usertag in ranks_data.Usertags) {
            select_content_player_usertag += "<option value=\"" + usertag + "\" " + (usertag === players_data.players[item].usertag ? "selected" : "") + ">" + usertag + "</option>";
        }
        if (!select_content_player_usertag.includes("selected")) {
            select_content_player_usertag += "<option value=\"" + players_data.players[item].usertag + "\" selected style=\"color: #b12121\">" + players_data.players[item].usertag + "</option>";
        }
        $("#content-players-table-usertag").html(select_content_player_usertag);
        $("#content-players-table-usertag").attr("onchange", "players_data.players['" + item + "'].usertag = this.selectedOptions[0].value; show_content('players', '" + item + "');");

        var table_content_subranks = "";
        if (typeof(players_data.players[item].subranks) !== "string") {
            for (var key in players_data.players[item].subranks) {
                if (players_data.players[item].subranks[key].worlds.length == 0) {
                    players_data.players[item].subranks[key].worlds.push("All");
                } else {
                    var toRemove = "";
                    for (var i = 0; i < players_data.players[item].subranks[key].worlds.length; i++) {
                        var world = players_data.players[item].subranks[key].worlds[i];
                        if (world.toLowerCase() === "all") {
                            toRemove = world;
                            break;
                        }
                    }
                    if (toRemove.length > 0) {
                        players_data.players[item].subranks[key].worlds.splice( $.inArray(toRemove, players_data.players[item].subranks[key].worlds), 1);
                    }
                }

                table_content_subranks += "<tr>";
                table_content_subranks += "<td rowspan=\"5\">" + key + "</td>";
                table_content_subranks += "<td>Use Prefix</td>";
                table_content_subranks += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-players-subranks-" + key + "-use-prefix\" type=\"checkbox\" " + (players_data.players[item].subranks[key].use_prefix ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-players-subranks-" + key + "-use-prefix').attr('checked', !$('.checkbox-players-subranks-" + key + "-use-prefix').attr('checked')); players_data.players['" + item + "'].subranks['" + key + "'].use_prefix = !!$('.checkbox-players-subranks-" + key + "-use-prefix').attr('checked');\"></span></td>";
                table_content_subranks += "<td>Show the subrank's prefix before the player's name</td>";
                table_content_subranks += "</tr>";
                table_content_subranks += "<tr>";
                table_content_subranks += "<td>Use Suffix</td>";
                table_content_subranks += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-players-subranks-" + key + "-use-suffix\" type=\"checkbox\" " + (players_data.players[item].subranks[key].use_suffix ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-players-subranks-" + key + "-use-suffix').attr('checked', !$('.checkbox-players-subranks-" + key + "-use-suffix').attr('checked')); players_data.players['" + item + "'].subranks['" + key + "'].use_suffix = !!$('.checkbox-players-subranks-" + key + "-use-suffix').attr('checked');\"></span></td>";
                table_content_subranks += "<td>Show the subrank's suffix after the player's name</td>";
                table_content_subranks += "</tr>";
                table_content_subranks += "<tr>";
                table_content_subranks += "<td>Use Permissions</td>";
                table_content_subranks += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-players-subranks-" + key + "-use-permissions\" type=\"checkbox\" " + (players_data.players[item].subranks[key].use_permissions ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-players-subranks-" + key + "-use-permissions').attr('checked', !$('.checkbox-players-subranks-" + key + "-use-permissions').attr('checked')); players_data.players['" + item + "'].subranks['" + key + "'].use_permissions = !!$('.checkbox-players-subranks-" + key + "-use-permissions').attr('checked');\"></span></td>";
                table_content_subranks += "<td>Give the player this subrank's permissions</td>";
                table_content_subranks += "</tr>";
                table_content_subranks += "<tr>";
                table_content_subranks += "<td>Worlds</td>";
                table_content_subranks += "<td>";
                table_content_subranks += "<select id=\"content-players-table-subranks-select-" + key + "-worlds\" class=\"form-select\">";
                for (var i = 0; i < server_data.server_worlds.split(",").length; i++) {
                    var world = server_data.server_worlds.split(",")[i];
                    if (!players_data.players[item].subranks[key].worlds.includes(world)) {
                        table_content_subranks += "<option value=\"" + world + "\">" + world + "</option>";
                    }
                }
                table_content_subranks += "</select>";
                table_content_subranks += "<button class=\"btn btn-success\" style=\"width: 100%;margin-bottom: 25px;\" onclick=\"if ($('#content-players-table-subranks-select-" + key + "-worlds').val() !== null) {players_data.players['" + item + "'].subranks['" + key + "'].worlds.push($('#content-players-table-subranks-select-" + key + "-worlds').val()); show_content('players', '" + item + "');}\">Add World</button>";
                table_content_subranks += "<div>";
                for (var i = 0; i < players_data.players[item].subranks[key].worlds.length; i++) {
                    var world = players_data.players[item].subranks[key].worlds[i];
                    table_content_subranks += "<p style=\"border-bottom: 1px solid #2c2e33;margin-bottom: 25px;\">";
                    table_content_subranks += world;
                    if (world.toLowerCase() !== "all") {
                        table_content_subranks += "<button class=\"btn btn-danger\" style=\"float: right;margin-top: -15px;\" onclick=\"players_data.players['" + item + "'].subranks['" + key + "'].worlds.splice( $.inArray('" + world + "', players_data.players['" + item + "'].subranks['" + key + "'].worlds), 1); show_content('players', '" + item + "');\">X</button>";
                    }
                    table_content_subranks += "</p>";
                }
                table_content_subranks += "</div>";
                table_content_subranks += "</td>";
                table_content_subranks += "<td>In what worlds show the player have this subrank</td>";
                table_content_subranks += "</tr>";
                table_content_subranks += "<tr>";
                table_content_subranks += "<td>Delete?</td>";
                table_content_subranks += "<td><button class=\"btn btn-danger\" onclick=\"delete players_data.players['" + item + "'].subranks['" + key + "']; show_content('players', '" + item + "');\">Delete</button></td>";
                table_content_subranks += "<td>Delete this subrank from the player</td>";
                table_content_subranks += "</tr>";
            }
        }
        $("#content-players-table-subranks").html(table_content_subranks);

        var select_content_player_subranks_add = "";
        for (var rank in ranks_data.Groups) {
            if (players_data.players[item].subranks === undefined || typeof(players_data.players[item].subranks) === "string") {
                players_data.players[item].subranks = {};
            }
            if (!(rank in players_data.players[item].subranks) && rank !== players_data.players[item].rank) {
                select_content_player_subranks_add += "<option value=\"" + rank + "\">" + rank + "</option>";
            }
        }
        $("#content-players-table-subranks-select-add").html(select_content_player_subranks_add);
        $("#content-players-table-subranks-button-add").attr("onclick", "if ($('#content-players-table-subranks-select-add').val() !== null) {players_data.players['" + item + "'].subranks[$('#content-players-table-subranks-select-add').val()] = {use_prefix: true, use_suffix: true, use_permissions: true, worlds: []}; show_content('players', '" + item + "');}");

        $("#content-players-output-div-tablist").css("bottom", $("#content-players-output-image").height());

        $("#content-players-table-permissions-button-add").attr("onclick", "if ($('#content-players-table-permissions-input-add').val().length > 0) {if (!players_data.players['" + item + "'].permissions.includes($('#content-players-table-permissions-input-add').val()) && !players_data.players['" + item + "'].permissions.includes('-' + $('#content-players-table-permissions-input-add').val())) {players_data.players['" + item + "'].permissions.push($('#content-players-table-permissions-input-add').val()); $('#content-players-table-permissions-input-add').val(''); show_content('players', '" + item + "');}$('#content-players-table-permissions-input-add').val('');}");

        var content_players_table_permissions = "";
        if (players_data.players[item].permissions === undefined || typeof(players_data.players[item].permissions) === "string") {
            players_data.players[item].permissions = {};
        }
        if (players_data.players[item].permissions) {
            for (var i = 0; i < players_data.players[item].permissions.length; i++) {
                var permission = players_data.players[item].permissions[i];

                content_players_table_permissions += "<tr>";
                content_players_table_permissions += "<td>" + permission + "</td>";
                content_players_table_permissions += "<td>";
                content_players_table_permissions += "<button class=\"btn btn-" + (permission[0] === "-" ? "warning" : "success") + "\" onclick=\"togglePlayerPermission(this, '" + item + "', '" + permission + "'); show_content('players', '" + item + "');\">" + (permission[0] === "-" ? "Disallowed" : "Allowed") + "</button>";
                content_players_table_permissions += "<button class=\"btn btn-danger\" style=\"float: right;\" onclick=\"players_data.players['" + item + "'].permissions.splice( $.inArray('" + permission + "', players_data.players['" + item + "'].permissions), 1); show_content('players', '" + item + "');\">X</button>";
                content_players_table_permissions += "</td>";
                content_players_table_permissions += "</tr>";
            }
        }

        $("#content-players-table-permissions").html(content_players_table_permissions);

        autocomplete(document.getElementById("content-players-table-permissions-input-add"), server_data.server_permissions.split(","));
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

function updateConfigContentBody(config_item) {
    var body = "<table class=\"table table-bordered\"><thead><tr><th scope=\"col\">Key</th><th scope=\"col\">Value</th><th scope=\"col\">Description</th></tr></thead><tbody>";
    var error = false;

    switch(config_item.toLowerCase()) {
        case "chat":
            body += "<tr>";
            body += "<td>Enabled</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-chat-enabled\" type=\"checkbox\" " + (config_data.chat.enabled ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-chat-enabled').attr('checked', !$('.checkbox-chat-enabled').attr('checked')); config_data.chat.enabled = !!$('.checkbox-chat-enabled').attr('checked');\"></span></td>";
            body += "<td>Enable or disable modification of the chat format</td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td>Format</td>";
            body += "<td><input class=\"form-control\" type=\"text\" value=\"" + config_data.chat.format + "\" onchange=\"config_data.chat.format = this.value;\" style=\"width: 100%;\"/></td>";
            body += "<td>Change the chat format</td>";
            body += "</tr>";
            break;

        case "tablist_modification":
            body += "<tr>";
            body += "<td>Enabled</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-tablist-modification-enabled\" type=\"checkbox\" " + (config_data.tablist_modification.enabled ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-tablist-modification-enabled').attr('checked', !$('.checkbox-tablist-modification-enabled').attr('checked')); config_data.tablist_modification.enabled = !!$('.checkbox-tablist-modification-enabled').attr('checked');\"></span></td>";
            body += "<td>Enable or disable modification of the tab(player) list format</td>";
            body += "</tr>";
    
            body += "<tr>";
            body += "<td>Format</td>";
            body += "<td><input class=\"form-control\" type=\"text\" value=\"" + config_data.tablist_modification.format + "\" onchange=\"config_data.tablist_modification.format = this.value;\" style=\"width: 100%;\"/></td>";
            body += "<td>Change the tab(player) list format</td>";
            body += "</tr>";
            break;

        case "build_modification":
            body += "<tr>";
            body += "<td>Enabled</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-build-modification-enabled\" type=\"checkbox\" " + (config_data.build_modification.enabled ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-build-modification-enabled').attr('checked', !$('.checkbox-build-modification-enabled').attr('checked')); config_data.build_modification.enabled = !!$('.checkbox-build-modification-enabled').attr('checked');\"></span></td>";
            body += "<td>Enable or disable the use of <code>build:</code> parameter in <code>Ranks.yml</code></td>";
            body += "</tr>";
            break;

        case "signs":
            body += "<tr>";
            body += "<td>Enabled</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-signs-enabled\" type=\"checkbox\" " + (config_data.signs.enabled ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-signs-enabled').attr('checked', !$('.checkbox-signs-enabled').attr('checked')); config_data.signs.enabled = !!$('.checkbox-signs-enabled').attr('checked');\"></span></td>";
            body += "<td>Enable or disable tue use of PowerRanks signs. <br /><small>When enabled put <code><small>PowerRanks</small></code> on the first line followed by a command on the second line</small></td>";
            body += "</tr>";
    
            body += "<tr>";
            body += "<td>Signs TitleFormat</td>";
            body += "<td><input class=\"form-control\" type=\"text\" value=\"" + config_data.signs.title_format + "\" onchange=\"config_data.signs.title_format = this.value; $('.signs-title-format-preview').html(formatMinecraftColor(config_data.signs.title_format.replace('%plugin_name%', 'PowerRanks')));\" style=\"width: 100%;\"/></td>";
            body += "<td>Change the title format on signs <span class=\"signs-title-format-preview\" style=\"background-color: #5f4225;\"></span></td>";
            body += "</tr>";
            break;

        case "plugin_hook":
            if (calculatePowerRanksVersionFromString(server_data.powerranks_version) >= calculatePowerRanksVersionFromString("1.3")) {
                body += "<tr>";
                body += "<td>Vault Economy</td>";
                body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-vault-economy-enabled\" type=\"checkbox\" " + (config_data.plugin_hook.vault_economy ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-vault-economy-enabled').attr('checked', !$('.checkbox-vault-economy-enabled').attr('checked')); config_data.plugin_hook.vault_economy = !!$('.checkbox-vault-economy-enabled').attr('checked');\"></span></td>";
                body += "<td>Enable or disable the use of <code>Vault Economy</code></td>";
                body += "</tr>";

                body += "<tr>";
                body += "<td>Vault Permissions</td>";
                body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-vault-permissions-enabled\" type=\"checkbox\" " + (config_data.plugin_hook.vault_permissions ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-vault-permissions-enabled').attr('checked', !$('.checkbox-vault-permissions-enabled').attr('checked')); config_data.plugin_hook.vault_permissions = !!$('.checkbox-vault-permissions-enabled').attr('checked');\"></span></td>";
                body += "<td>Enable or disable the use of <code>Vault Permissions</code></td>";
                body += "</tr>";
            } else {
                body += "<tr>";
                body += "<td>Vault</td>";
                body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-vault-enabled\" type=\"checkbox\" " + (config_data.plugin_hook.vault ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-vault-enabled').attr('checked', !$('.checkbox-vault-enabled').attr('checked')); config_data.plugin_hook.vault = !!$('.checkbox-vault-enabled').attr('checked');\"></span></td>";
                body += "<td>Enable or disable the use of <code>Vault Economy</code></td>";
                body += "</tr>";
            }

            body += "<tr>";
            body += "<td>PlaceholderAPI</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-placeholderapi-enabled\" type=\"checkbox\" " + (config_data.plugin_hook.placeholderapi ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-placeholderapi-enabled').attr('checked', !$('.checkbox-placeholderapi-enabled').attr('checked')); config_data.plugin_hook.placeholderapi = !!$('.checkbox-placeholderapi-enabled').attr('checked');\"></span></td>";
            body += "<td>Enable or disable the use of <code>PlaceholderAPI</code></td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td>DeluxeTags</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-deluxetags-enabled\" type=\"checkbox\" " + (config_data.plugin_hook.deluxetags ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-deluxetags-enabled').attr('checked', !$('.checkbox-deluxetags-enabled').attr('checked')); config_data.plugin_hook.deluxetags = !!$('.checkbox-deluxetags-enabled').attr('checked');\"></span></td>";
            body += "<td>Enable or disable the use of <code>DeluxeTags</code><br /><small>Warning: When enabled this will disable the UserTags in PowerRanks in favour of DeluxeTags</small></td>";
            body += "</tr>";
            break;

        case "updates":
            body += "<tr>";
            body += "<td>Enable update checking</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-enable-update-checking-enabled\" type=\"checkbox\" " + (config_data.updates.enable_update_checking ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-enable-update-checking-enabled').attr('checked', !$('.checkbox-enable-update-checking-enabled').attr('checked')); config_data.updates.enable_update_checking = !!$('.checkbox-enable-update-checking-enabled').attr('checked');\"></span></td>";
            body += "<td>Enable automatic update checking, a notification will be shown in your server console when a update is available</td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td>Enable automatic update download</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-enable-automatic-update-download\" type=\"checkbox\" " + (config_data.updates.automatic_download_updates ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-enable-automatic-update-download').attr('checked', !$('.checkbox-enable-automatic-update-download').attr('checked')); config_data.updates.automatic_download_updates = !!$('.checkbox-enable-automatic-update-download').attr('checked');\"></span></td>";
            body += "<td>Enable automatic update download, requires <code>Enable update checking</code> to be enabled<br /><small>When an update is downloaded, PowerRanks will be disabled until the server is restarted!</small></td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td>Enable automatic config file updater</td>";
            body += "<td class=\"checkbox-container\"><input class=\"checkbox-input checkbox-enable-automatic-config-update\" type=\"checkbox\" " + (config_data.updates.automatic_update_config_files ? "checked" : "") + " /><span class=\"checkbox-checkmark\" onclick=\"$('.checkbox-enable-automatic-config-update').attr('checked', !$('.checkbox-enable-automatic-config-update').attr('checked')); config_data.updates.automatic_update_config_files = !!$('.checkbox-enable-automatic-config-update').attr('checked');\"></span></td>";
            body += "<td>When enabled PowerRanks will automatically update the configuration files to the latest version<br /><small>It is recommended to leave this on</small></td>";
            body += "</tr>";
            break;

        default:
            body = "<h6 style=\"text-align: center;\">Unknown config option.</h6>";
            error = true;
            break;
    }

    if (!error) {
        body += "</tbody></table>";
    }

    $("#content-configuration-body").html(body);

    if (config_item.toLowerCase() == "signs") {
        $('.signs-title-format-preview').html(formatMinecraftColor(config_data.signs.title_format.replace('%plugin_name%', 'PowerRanks')));
    }
}

function updatePlayerContentGamePreview(player_uuid) {
    var chat_content = "";
    var tab_content = "";

    var chat_format = config_data.chat.format;
    var tab_format = config_data.tablist_modification.format;

    var random_world = server_data.server_worlds.split(",")[Math.round(Math.random() * (server_data.server_worlds.split(",").length - 1))];

    var subprefix_output = "";
    var subsuffix_output = "";

    for (var subrank in players_data.players[player_uuid].subranks) {
        if (players_data.players[player_uuid].subranks[subrank].use_prefix) {
            if (ranks_data.Groups[subrank] !== undefined) {
                subprefix_output += ranks_data.Groups[subrank].chat.prefix + " ";
            }
        }
    }

    for (var subrank in players_data.players[player_uuid].subranks) {
        if (players_data.players[player_uuid].subranks[subrank].use_suffix) {
            if (ranks_data.Groups[subrank] !== undefined) {
                subsuffix_output += ranks_data.Groups[subrank].chat.suffix + " ";
            }
        }
    }

    subprefix_output = subprefix_output.substring(0, subprefix_output.length - 1);
    subsuffix_output = subsuffix_output.substring(0, subsuffix_output.length - 1);

    chat_format = chat_format.replace("[world]", random_world);
    tab_format = tab_format.replace("[world]", random_world);

    chat_format = chat_format.replace("[usertag]", "&r" + (ranks_data.Usertags[players_data.players[player_uuid].usertag] !== undefined && players_data.players[player_uuid].usertag.length > 0 ? ranks_data.Usertags[players_data.players[player_uuid].usertag] : ""));
    tab_format = tab_format.replace("[usertag]", "&r" + (ranks_data.Usertags[players_data.players[player_uuid].usertag] !== undefined && players_data.players[player_uuid].usertag.length > 0 ? ranks_data.Usertags[players_data.players[player_uuid].usertag] : ""));

    chat_format = chat_format.replace("[prefix]", "&r" + (players_data.players[player_uuid].rank.length > 0 && ranks_data.Groups[players_data.players[player_uuid].rank] !== undefined ? ranks_data.Groups[players_data.players[player_uuid].rank].chat.prefix : ""));
    tab_format = tab_format.replace("[prefix]", "&r" + (players_data.players[player_uuid].rank.length > 0 && ranks_data.Groups[players_data.players[player_uuid].rank] !== undefined ? ranks_data.Groups[players_data.players[player_uuid].rank].chat.prefix : ""));

    chat_format = chat_format.replace("[subprefix]", "&r" + subprefix_output);
    tab_format = tab_format.replace("[subprefix]", "&r" + subprefix_output);

    chat_format = chat_format.replace("[subsuffix]", "&r" + subsuffix_output);
    tab_format = tab_format.replace("[subsuffix]", "&r" + subsuffix_output);

    chat_format = chat_format.replace("[player]", (players_data.players[player_uuid].rank.length > 0 && ranks_data.Groups[players_data.players[player_uuid].rank] !== undefined ? ranks_data.Groups[players_data.players[player_uuid].rank].chat.nameColor : "") + players_data.players[player_uuid].name);
    tab_format = tab_format.replace("[player]", (players_data.players[player_uuid].rank.length > 0 && ranks_data.Groups[players_data.players[player_uuid].rank] !== undefined ? ranks_data.Groups[players_data.players[player_uuid].rank].chat.nameColor : "") + players_data.players[player_uuid].name);

    chat_format = chat_format.replace("[msg]", (players_data.players[player_uuid].rank.length > 0 && ranks_data.Groups[players_data.players[player_uuid].rank] !== undefined ? ranks_data.Groups[players_data.players[player_uuid].rank].chat.chatColor : "") + "Hello!");

    chat_format = chat_format.replace("[suffix]", "&r" + (players_data.players[player_uuid].rank.length > 0 && ranks_data.Groups[players_data.players[player_uuid].rank] !== undefined ? ranks_data.Groups[players_data.players[player_uuid].rank].chat.suffix : ""));
    tab_format = tab_format.replace("[suffix]", "&r" + (players_data.players[player_uuid].rank.length > 0 && ranks_data.Groups[players_data.players[player_uuid].rank] !== undefined ? ranks_data.Groups[players_data.players[player_uuid].rank].chat.suffix : ""));

    chat_format = chat_format.replaceAll("  ", " ");
    tab_format = tab_format.replaceAll("  ", " ");

    chat_content = formatMinecraftColor(chat_format);
    tab_content = formatMinecraftColor(tab_format);

    tab_content = "<img src=\"https://crafatar.com/avatars/" + player_uuid + "?size=96&default=MHF_Steve\" alt=\"\" style=\"width: 24px;margin-right: 5px;margin-top: -5px;\">" + tab_content;
    tab_content += "<img src=\"assets/images/ConnectionBars.png\" alt=\"\" style=\"width: 24px;margin-right: 5px;margin-top: -5px;\">";

    $("#content-players-output-chat").html(chat_content);
    $("#content-players-output-tablist").html(tab_content);
}
//encodeURIComponent
function saveDataCookie() {
    var raw_data = "POWERRANKS@" + encodeUnicode(JSON.stringify(server_data) + "\n" + JSON.stringify(config_data) + "\n" + JSON.stringify(ranks_data) + "\n" + JSON.stringify(players_data));
    var splitData = [];
    var split_size = 2048;
    do{ splitData.push(raw_data.substring(0, split_size)) } 
    while( (raw_data = raw_data.substring(split_size, raw_data.length)) != "" );

    // setCookie("save_data_size", splitData.length, 365);
    // for (var i = 0; i < splitData.length; i++) {
    //     setCookie("save_data_" + i, splitData[i], 365);
    // }

    saveToLocalStorage("save_data_size", splitData.length);
    for (var i = 0; i < splitData.length; i++) {
        saveToLocalStorage("save_data_" + i, splitData[i]);
    }

    $('#popup-save').fadeOut();
    $('#popup-save-done').fadeIn();
}

function loadDataCookie() {
    // if (getCookie("save_data_size").length > 0) {
    //     var saveData = "";
    //     for (var i = 0; i < getCookie("save_data_size"); i++) {
    //         saveData += getCookie("save_data_" + i);
    //     }
    //     raw_data_input = saveData.split("@")[1];
    //     $("#noidoverlay").hide();
    //     $("#noidoverlayloading").hide();
    //     $("#noidoverlayinvalidid").hide();
    //     setup_editor();
    // }

    if (getFromLocalStorage("save_data_size").length > 0) {
        var saveData = "";
        for (var i = 0; i < getFromLocalStorage("save_data_size"); i++) {
            saveData += getFromLocalStorage("save_data_" + i);
        }
        raw_data_input = saveData.split("@")[1];
        $("#noidoverlay").hide();
        $("#noidoverlayloading").hide();
        $("#noidoverlayinvalidid").hide();
        setup_editor();
    }
}

function exportData() {
    console.log("Exporting...");
    for (rank in ranks_data.Groups) {
        ranks_data.Groups[rank.replaceAll("prplus", "+")] = ranks_data.Groups[rank];

        ranks_data.Groups[rank].economy.cost = parseInt(ranks_data.Groups[rank].economy.cost);

        if (rank.includes("prplus")) {
            delete ranks_data.Groups[rank];
        }
    }

    var raw_data = "POWERRANKS@" + btoa(JSON.stringify(server_data) + "\n" + JSON.stringify(config_data) + "\n" + JSON.stringify(ranks_data) + "\n" + JSON.stringify(players_data));

    for (rank in ranks_data.Groups) {
        ranks_data.Groups[rank.replaceAll("\\+", "prplus")] = ranks_data.Groups[rank];
        
        if (rank.includes("+")) {
            delete ranks_data.Groups[rank];
        }
    }

    const API_ENDPOINT = file_base_url;
    const request = new XMLHttpRequest();
    const formData = new FormData();

    request.open("POST", API_ENDPOINT, true);
    request.onreadystatechange = () => {
        console.log(request);
        console.log(request.responseText);
        if (request.readyState === 4) {
            if (request.status === 200) {
                var data = JSON.parse(request.responseText);
                $("#popup-exporting").fadeOut();
                $("#popup-export-done").fadeIn();
                $("#export-id").text(data["key"]);
                $("#export-command").text("/pr webeditor load " + data["key"]);
            } else {
                alert("There was a error exporting your data, please save and try again in a few minutes.");
                $("#popup-exporting").fadeOut();
            }
        }
    };
    formData.append("file", new Blob([raw_data], {type: "text/plain"}));
    request.send(formData);

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

function formatMinecraftColor(input) {
    var output = "";
    input = "&f" + input;

    // HEX Colors
    output = input;

    var hex_reg = new RegExp("#[a-fA-F0-9]{6}", "gm");
    var hex_match;
    while (hex_match = hex_reg.exec(input)) {
        console.log("Found", hex_match[0], "at", hex_match.index);

        var msg = "";
        for (var i = hex_match.index + 7; i < input.length; i++) {
            if (input[i] != "#" && input[i] != "&") {
                msg += input[i];
            } else {
                break;
            }
        }
        output = output.replace(hex_match[0] + msg, "<span style=\"color:" + hex_match[0] + "\">" + msg + "</span>")
    }
    output += "</span>"
    // HEX Colors

    // Normal MC Colors
    var input_split = output.split("&");
    for (var val in input_split) {
        if (input_split[val].length > 0) {
            var color = input_split[val][0];
            var text = input_split.length > 1 ? input_split[val].substring(1) : input_split[val];

            input_split[val] = "<span style=\"" + minecraftColorToCSS(color) + "\">" + text + "</span>";
        }
    }

    output = input_split.join("");
    // Normal MC Colors

    return output;
}

function minecraftColorToCSS(color) {
    var colorOut = "";
    var specialOut = "";

    if (color.match("[0-9a-fA-F]") !== null) {
        switch (color) {
            case "0":
                colorOut = "#000";
                break;
            case "1":
                colorOut = "#0000AA";
                break;
            case "2":
                colorOut = "#00AA00";
                break;
            case "3":
                colorOut = "#00AAAA";
                break;
            case "4":
                colorOut = "#AA0000";
                break;
            case "5":
                colorOut = "#AA00AA";
                break;
            case "6":
                colorOut = "#FFAA00";
                break;
            case "7":
                colorOut = "#AAAAAA";
                break;
            case "8":
                colorOut = "#555555";
                break;
            case "9":
                colorOut = "#5555FF";
                break;
            case "a":
                colorOut = "#55FF55";
                break;
            case "b":
                colorOut = "#55FFFF";
                break;
            case "c":
                colorOut = "#FF5555";
                break;
            case "d":
                colorOut = "#FF55FF";
                break;
            case "e":
                colorOut = "#FFFF55";
                break;
            case "f":
                colorOut = "#FFF";
                break;
            default:
                colorOut = "#FFF";
                break;
        }
    }

    if (color.toLowerCase().match("[lnom]") !== null) {
        switch (color) {
            case "l":
                specialOut = "font-weight: bold;";
                break;
            case "n":
                specialOut = "text-decoration: underline;";
                break;
            case "o":
                specialOut = "font-style: italic;";
                break;
            case "m":
                specialOut = "text-decoration: line-through;";
                break;
            default:
                specialOut = "";
                break;
        }
    }

    var out = "";
    out += colorOut.length > 0 ? "color: " + colorOut + ";" : "";
    out += specialOut.length > 0 ? specialOut + ";" : "";
    return out;
}

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
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

function saveToLocalStorage(key, value) {
    localStorage.setItem(key, value);
}

function getFromLocalStorage(key) {
    return localStorage.getItem(key);
}

function calculatePowerRanksVersionFromString(input) {
    var output = 0;
    input = input.replaceAll("[a-zA-Z ]", "");
    var input_split = input.split(".");

    var calcString = "1000000";
    for (var i = 0; i < input_split.length; i++) {
        if (input_split[i].length != 0) {
            var num = parseInt(input_split[i]) * parseInt(calcString);
            if (calcString.charAt(calcString.length - 1) == '0') {
                calcString = calcString.substring(0, calcString.length - 1);
            }
            output += num;
        }
    }
    
    return output;
}

function createEmptyRank(name) {
    if (name.length == 0) return;
    ranks_data.Groups[name.replaceAll("\\+", "prplus")] = {permissions: [], inheritance: [], build: true, chat: {prefix: "&r[&7" + name + "&r]", suffix: "", chatColor: "&f", nameColor: "&f"}, level: {promote: "", demote: ""}, gui: {icon: "stick"}, economy: {buyable: [], cost: 0}};
    $("#menu_side_dropdown_ranks").append("<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('ranks', '" + name.replaceAll("\\+", "prplus") + "');\" style=\"cursor: pointer;\">" + name + "</a></li>");
    show_content('ranks', name.replaceAll("\\+", "prplus"));
}

function createEmptyUsertag(name) {
    if (name.length == 0) return;
    if (typeof(ranks_data.Usertags) === "string") ranks_data.Usertags = {};
    ranks_data.Usertags[name] = "&r[&7" + name + "&r]";
    $("#menu_side_dropdown_usertags").append("<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('usertags', '" + name + "');\" style=\"cursor: pointer;\">" + name + "</a></li>");
    show_content('usertags', name);
}

function togglePlayerPermission(_this, uuid, permission) {
    var button = $(_this);
    for (var i = 0; i < players_data.players[uuid].permissions.length; i++) {
        if (players_data.players[uuid].permissions[i].includes(permission)) {
            if (players_data.players[uuid].permissions[i][0] === "-") {
                players_data.players[uuid].permissions[i] = players_data.players[uuid].permissions[i].replace("-", "");
                button.addClass("btn-success").removeClass("btn-warning");
                button.text("Allowed");
            } else {
                players_data.players[uuid].permissions[i] = "-" + players_data.players[uuid].permissions[i];
                button.addClass("btn-warning").removeClass("btn-success");
                button.text("Disllowed");
            }
        }
    }
}

function toggleRankPermission(_this, rank, permission) {
    var button = $(_this);
    for (var i = 0; i < ranks_data.Groups[rank].permissions.length; i++) {
        if (ranks_data.Groups[rank].permissions[i].includes(permission)) {
            if (ranks_data.Groups[rank].permissions[i][0] === "-") {
                ranks_data.Groups[rank].permissions[i] = ranks_data.Groups[rank].permissions[i].replace("-", "");
                button.addClass("btn-success").removeClass("btn-warning");
                button.text("Allowed");
            } else {
                ranks_data.Groups[rank].permissions[i] = "-" + ranks_data.Groups[rank].permissions[i];
                button.addClass("btn-warning").removeClass("btn-success");
                button.text("Disllowed");
            }
        }
    }
}

function renameRank(rank, new_name) {
    ranks_data.Groups[new_name.replaceAll("\\+", "prplus")] = ranks_data.Groups[rank.replaceAll("\\+", "prplus")];
    delete ranks_data.Groups[rank.replaceAll("\\+", "prplus")];
    $("#menu_side_dropdown_ranks").append("<li class=\"nav-item\"> <a class=\"nav-link\" onclick=\"show_content('ranks', '" + new_name.replaceAll("\\+", "prplus") + "');\" style='cursor: pointer;'>" + new_name.replaceAll("prplus", "+") + "</a></li>");
    $('#menu_side_dropdown_ranks').children().remove(":contains('" + rank.replaceAll("prplus", "+") + "'):first()");
    show_content('ranks', new_name.replaceAll("\\+", "prplus"));
}

function deleteRank(rank) {
    delete ranks_data.Groups[rank];
    $('#menu_side_dropdown_ranks').children().remove(":contains('" + rank + "'):first()");
    show_content('dashboard', "");
}

function addRankInheritance(select_id, rank) {
    var contains_rank = false;
    var select = $("#" + select_id);
    if (select.val().length === 0) {
        return;
    }

    for (var r in ranks_data.Groups[rank]) {
        if (select.val() === r) {
            contains_rank = true;
            break;
        }
    }

    if (!contains_rank) {
        ranks_data.Groups[rank].inheritance.push(select.val());
        show_content("ranks", rank);
    } else {
        return;
    }
}

function addRankEconomyBuyable(select_id, rank) {
    var contains_rank = false;
    var select = $("#" + select_id);
    if (select.val().length === 0) {
        return;
    }

    for (var r in ranks_data.Groups[rank]) {
        if (select.val() === r) {
            contains_rank = true;
            break;
        }
    }

    if (!contains_rank) {
        ranks_data.Groups[rank].economy.buyable.push(select.val());
        show_content("ranks", rank);
    } else {
        return;
    }
}

function closePrivacyPolicy() {
    $("#popup-privacy-policy").fadeOut();
    setCookie("seen_privacy_policy_notice", "1", 365);
}

function encodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
  }

  function decodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }