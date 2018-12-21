var ResolveIssueFormConst = {
    fieldWidth : 140,
    panelHeight : 'auto'
};

function initResolveIssueFormTemplate () {
    var comboboxConfig = {
        panelHeight : ResolveIssueFormConst.panelHeight,
        width : ResolveIssueFormConst.fieldWidth
    };

    $('#collateral').combobox(comboboxConfig);

    $('#fixVersion').textbox({
        prompt : 'e.g. R5.1...',
        width : ResolveIssueFormConst.fieldWidth
    });

    $('#rootCause').textbox({
        prompt : 'default : n/a',
        width : ResolveIssueFormConst.fieldWidth
    });

    $('#i23s').combobox(comboboxConfig);

    $('#bugSource').combobox(comboboxConfig);

    $('#releaseVersion').combobox(comboboxConfig);

    $('#autofillComment').combobox(comboboxConfig);
}

function setResolveIssueFormTemplateData () {
    chrome.storage.sync.get('resolveIssueFormData', function (data) {
        if (!data.resolveIssueFormData) {
            return;
        }
        $('#collateral').combobox('setValue', data.resolveIssueFormData.collateral);
        $('#fixVersion').textbox('setValue', data.resolveIssueFormData.fixVersion);
        $('#rootCause').textbox('setValue', data.resolveIssueFormData.rootCause);
        $('#i23s').combobox('setValue', data.resolveIssueFormData.i23s);
        $('#bugSource').combobox('setValue', data.resolveIssueFormData.bugSource);
        $('#releaseVersion').combobox('setValue', data.resolveIssueFormData.releaseVersion);
        $('#autofillComment').combobox('setValue', data.resolveIssueFormData.autofillComment);
    });
}
