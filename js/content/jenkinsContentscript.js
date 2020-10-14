$(document).ready(function() {
    insertUploadButtonToBuildHistory();
    insertUploadButtonToBuildDescription();
});

var serviceHost = "http://10.206.84.177:8787/versions/{0}";

function insertUploadButtonToBuildHistory() {
    $("#buildHistory .pane.desc").each(function() {
        var target = $(this);
        if (!validateContent(target)) {
            return;
        }
        insertUploadButton(target);
    });
}

function insertUploadButtonToBuildDescription() {
    $("#description").each(function() {
        var target = $(this);
        if (!validateContent(target)) {
            return;
        }
        insertUploadButton(target);
    });
}

function validateContent(target) {
    return target.find("a").siblings().length > 0;
}

function insertUploadButton(target) {
    var version = target.find("a").text();

    var uploadButton = createUploadButton(version);
    var btnWrapper = $("<div></div>");
    btnWrapper.css({"margin": "5px 0"});
    btnWrapper.append(uploadButton);
    
    target.append(btnWrapper);
}

function createUploadButton(version) {
    var uploadButton = $("<a></a>");
    uploadButton.linkbutton({
        text: 'Upload to GCS',
        iconCls : 'icon-upload',
        onClick : function () {
            $.post(stringFormat(serviceHost, version), function(data) {
                alert("Build: " + version + " has been uploaded to GCS!");
            });
        }
    });

    return uploadButton;
}

function stringFormat() {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {       
        var reg = new RegExp("\\{" + i + "\\}", "gm");             
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
}