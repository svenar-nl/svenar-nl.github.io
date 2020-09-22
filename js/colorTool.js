var is_color_tool_open = false;
var color_tool_output_element = null;

function openColorTool(self, parent_element_id, target_element_name) { // Open from element where target field is next to it
    if (is_color_tool_open) return;

    color_tool_output_element = $("#" + parent_element_id + " " + target_element_name);
    is_color_tool_open = true;
    $("#powerranks-color-tool-background").fadeIn();
    $("#powerranks-color-tool").fadeIn();
    $("#powerranks-color-tool").css("left", (self.offsetLeft + $(self).width() + $("#powerranks-color-tool").width() + 70) + "px");
    $("#powerranks-color-tool").css("top", self.offsetTop + "px");

    $("#powerranks-color-tool-simple-gradient-input").val(stripMinecraftColors(color_tool_output_element.val(), true, true));

    updateGradientPreview();
}

function closeColorTool() {
    $("#powerranks-color-tool-background").fadeOut();
    $("#powerranks-color-tool").fadeOut();
    is_color_tool_open = false;
}

function updateGradientPreview() {
    var r1 = $("#powerranks-color-tool-simple-gradient-color1-red").val();
    var g1 = $("#powerranks-color-tool-simple-gradient-color1-green").val();
    var b1 = $("#powerranks-color-tool-simple-gradient-color1-blue").val();
    var r2 = $("#powerranks-color-tool-simple-gradient-color2-red").val();
    var g2 = $("#powerranks-color-tool-simple-gradient-color2-green").val();
    var b2 = $("#powerranks-color-tool-simple-gradient-color2-blue").val();
    $("#powerranks-color-tool-btn-close").attr("style", "background:linear-gradient(90deg, rgba(" + r1 + "," + g1 + "," + b1 + ",1) 0%, rgba(" + r2 + "," + g2 + "," + b2 + ",1) 100%);width:calc(100% + 20px);height:50px;margin-left:-10px;margin-top:-10px;border-top-left-radius:5px;border-top-right-radius:5px;text-shadow: 0px 0px 2px rgba(0, 0, 0, 1);");
    $("#powerranks-color-tool-btn-apply").attr("style", "background:linear-gradient(90deg, rgba(" + r1 + "," + g1 + "," + b1 + ",1) 0%, rgba(" + r2 + "," + g2 + "," + b2 + ",1) 100%);width:calc(100% + 20px);height:50px;margin-left:-10px;margin-bottom:-10px;border-bottom-left-radius:5px;border-bottom-right-radius:5px;text-shadow: 0px 0px 2px rgba(0, 0, 0, 1);");

    var gradient_steps = generateSteppedGradient();

    var preview = "";
    for (var i = 0; i < gradient_steps.length; i++) {
        preview += "<span style=\"color:" + gradient_steps[i] + ";\">" + $("#powerranks-color-tool-simple-gradient-input").val()[i] + "</span>";
    }
    $("#powerranks-color-tool-simple-gradient-preview").html(preview);
}

//

function generateSteppedGradient() {
    var r1 = $("#powerranks-color-tool-simple-gradient-color1-red").val();
    var g1 = $("#powerranks-color-tool-simple-gradient-color1-green").val();
    var b1 = $("#powerranks-color-tool-simple-gradient-color1-blue").val();
    var r2 = $("#powerranks-color-tool-simple-gradient-color2-red").val();
    var g2 = $("#powerranks-color-tool-simple-gradient-color2-green").val();
    var b2 = $("#powerranks-color-tool-simple-gradient-color2-blue").val();

    return generateSteppedGradientRGB(r1, g1, b1, r2, g2, b2);
}

function generateSteppedGradientRGB(r1, g1, b1, r2, g2, b2) {
    var color1 = [parseInt(r1, 10), parseInt(g1, 10), parseInt(b1, 10)];
    var color2 = [parseInt(r2, 10), parseInt(g2, 10), parseInt(b2, 10)];

    var colors = [];

    var stepsInt = parseInt($("#powerranks-color-tool-simple-gradient-input").val().length, 10);

    for (var i = 0; i < stepsInt; i++) {
        var percentVal = i / stepsInt;

        colors[i] = getGradientColor(color1[0], color1[1], color1[2], color2[0], color2[1], color2[2], percentVal);
    }

    return colors;
}

function getGradientColor(start_red, start_green, start_blue, end_red, end_green, end_blue, percent) {
    var diff_red = end_red - start_red;
    var diff_green = end_green - start_green;
    var diff_blue = end_blue - start_blue;
 
    diff_red = ( (diff_red * percent) + start_red ).toString(16).split('.')[0];
    diff_green = ( (diff_green * percent) + start_green ).toString(16).split('.')[0];
    diff_blue = ( (diff_blue * percent) + start_blue ).toString(16).split('.')[0];
 
    if( diff_red.length == 1 ) diff_red = '0' + diff_red
    if( diff_green.length == 1 ) diff_green = '0' + diff_green
    if( diff_blue.length == 1 ) diff_blue = '0' + diff_blue
 
    return '#' + diff_red + diff_green + diff_blue;
  };

function applySteppedGradient() {
    var gradient_steps = generateSteppedGradient();

    var value = "";
    if (gradient_steps[0] == gradient_steps[gradient_steps.length - 1]) {
        value = gradient_steps[0] + $("#powerranks-color-tool-simple-gradient-input").val();
    } else {
        for (var i = 0; i < gradient_steps.length; i++) {
            value += gradient_steps[i] + $("#powerranks-color-tool-simple-gradient-input").val()[i];
        }
    }
    color_tool_output_element.val(value);
    color_tool_output_element.trigger("change");
}

function stripMinecraftColors(input, strip_default, strip_hex) {
    var mc_color_reg = new RegExp("&[a-fA-F0-9lLmMnNoOkKrRiIjJ]{1}");
    var hex_color_reg = new RegExp("#[a-fA-F0-9]{6}");

    var hex_color_match, mc_color_match;
    var output = input;

    if (strip_default) {
        while (mc_color_match = mc_color_reg.exec(output)) {
            output = output.replace(mc_color_match[0], "");
        }
    }

    if (strip_hex) {
        while (hex_color_match = hex_color_reg.exec(output)) {
            output = output.replace(hex_color_match[0], "");
        }
    }

    return output;
}