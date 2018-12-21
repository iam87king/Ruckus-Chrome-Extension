'use strict';

 const fieldWidth = 320;
 const fieldHeight = 200;

function initForm () {
    $('#mainPanel').accordion({
        multiple : true
    });
}

function saveOptions (dataPath, value) {
    chrome.storage.sync.get('options', function (data) {
        if (_.has(data, dataPath)) {
            _.set(data, dataPath, value);
            chrome.storage.sync.set({ options : data.options });
        }
    });
}

function getSavingOnBlurListener (inputType, dataPath) {
    return $.extend({}, $.fn[inputType].defaults.inputEvents, {
        blur : function (e) {
            $.fn[inputType].defaults.inputEvents.blur.call(this, e);
            saveOptions(dataPath, $(e.data.target)[inputType]('getValue'));
        }
    });
}

function initRedirectorFields (options) {
    if (!options.redirector) {
        return;
    }

    $('#redirectorDefaultTarget').combobox({
        panelHeight : 70,
        width : fieldWidth,
        value : options.redirector.defaultTarget,
        inputEvents : getSavingOnBlurListener('combobox', 'options.redirector.defaultTarget')
    });

    $('#redirectorJiraChar').textbox({
        width : fieldWidth,
        value : options.redirector.jiraChar,
        inputEvents : getSavingOnBlurListener('textbox', 'options.redirector.jiraChar')
    });

    $('#jiraUrlPrefix').textbox({
        width : fieldWidth,
        value : options.redirector.jiraUrlPrefix,
        inputEvents : getSavingOnBlurListener('textbox', 'options.redirector.jiraUrlPrefix')
    });

    $('#redirectorFisheyeChar').textbox({
        width : fieldWidth,
        value : options.redirector.fisheyeChar,
        inputEvents : getSavingOnBlurListener('textbox', 'options.redirector.fisheyeChar')
    });

    $('#fisheyeCharUrlPrefix').textbox({
        width : fieldWidth,
        value : options.redirector.fisheyeCharUrlPrefix,
        inputEvents : getSavingOnBlurListener('textbox', 'options.redirector.fisheyeCharUrlPrefix')
    });
}

function initAutoLoginFields (options) {
    if (!options.autoLogin) {
        return;
    }

    $('#autoLoginSwitcher').switchbutton({
        checked: options.autoLogin.enabled,
        onChange : function (checked) {
            saveOptions('options.autoLogin.enabled', checked);
        }
    });

    $('#defaultUsername').textbox({
        width : fieldWidth,
        value : options.autoLogin.username,
        inputEvents : getSavingOnBlurListener('textbox', 'options.autoLogin.username')
    });

    $('#defaultPassword').textbox({
        width : fieldWidth,
        value : options.autoLogin.password,
        inputEvents : getSavingOnBlurListener('textbox', 'options.autoLogin.password')
    });
}

function initFisheyeLazyTextFields (options) {
    if (!options.fisheyeLazyText) {
        return;
    }

    $('#ftlContainer .form-field .option-item.textbox-item').each(function (index, element) {
        $(element).textbox({
            width : fieldWidth,
            multiline : element.className.indexOf('multiline') > -1,
            height : (element.className.indexOf('multiline') > -1 ? 100 : 'auto'),
            value : options.fisheyeLazyText[element.name],
            inputEvents : getSavingOnBlurListener('textbox', 'options.fisheyeLazyText.' + element.name)
        });
    });

}

function initAutofillCommentTextFields (options) {
    if (!options.autofillCommentText) {
        return;
    }

    $('#optAutofillComment .form-field .option-item.textbox-item').each(function (index, element) {
        $(element).textbox({
            width : fieldWidth,
            multiline : element.className.indexOf('multiline') > -1,
            height : (element.className.indexOf('multiline') > -1 ? 100 : 'auto'),
            value : options.autofillCommentText[element.name],
            inputEvents : getSavingOnBlurListener('textbox', 'options.autofillCommentText.' + element.name)
        });
    });
}

function initFormFields () {
    chrome.storage.sync.get('options', function (data) {
        if (!data.options) {
            return;
        }
        initRedirectorFields(data.options);
        initAutoLoginFields(data.options);
        initFisheyeLazyTextFields(data.options);
        initAutofillCommentTextFields(data.options);
    });
}

$(document).ready(function () {
    initForm();
    initFormFields();
});
