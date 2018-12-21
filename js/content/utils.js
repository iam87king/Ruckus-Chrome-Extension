function getIssueWorkflowForm () {
    return $('#issue-workflow-transition');
}

function getIssueWorkflowFormFieldLabel (fieldText) {
    return getIssueWorkflowForm().find('.field-group label:contains("' + fieldText.trim() + '")');
}

function getCommonIssueWorkflowFormField (fieldText) {
    return getIssueWorkflowFormFieldLabel(fieldText).siblings(':input');
}

function populateTextField (fieldText, fieldValue) {
    getCommonIssueWorkflowFormField(fieldText).val(fieldValue);
}

function populateIframeTextField(fieldValue) {
    return $('#cke_comment iframe').contents().find('p').html(fieldValue);
}

function populateSelectField (fieldText, fieldValue) {
    var option = getCommonIssueWorkflowFormField(fieldText).find('option:contains("' + fieldValue + '")');
    if (option.length > 1) {
        option.filter(function () {
            return this.text.trim() === fieldValue.trim();
        });
    }
    option.prop('selected', true);
}

function populateSuggestionField (fieldText, fieldValue) {
    var jTextarea = getIssueWorkflowFormFieldLabel(fieldText).siblings().find('textarea');
    // Input some value to textarea and then trigger events to make the suggestion list be generated.
    jTextarea.val(fieldValue).click().blur().val('');

    $('.ajs-layer.active').find('.aui-list-item').removeClass('active').filter(function () {
        return this.textContent.trim() === fieldValue;
    }).addClass('active').click(); // The click handler of suggestion item works properly only if the suggestion item is active (has 'active' css class).
}

function populateIframeField (fieldText, fieldValue) {
    var iframe = getIssueWorkflowFormFieldLabel(fieldText).siblings().find('iframe').get(0);
    var iframeBody = iframe.contentWindow.document.getElementsByTagName('body')[0];
    iframeBody.innerText = fieldValue;
}

function populateField (fieldType, fieldText, fieldValue) {
    switch (fieldType) {
        case 'text':
            if(fieldText !== 'Comment') {
                populateTextField(fieldText, fieldValue);
            } else {
                populateIframeTextField(fieldValue);
            }
            break;
        case 'select':
            populateSelectField(fieldText, fieldValue);
            break;
        case 'suggestion':
            populateSuggestionField(fieldText, fieldValue);
            break;
        case 'iframe':
            populateIframeField(fieldText, fieldValue);
            break;
    };
}

function getIssueWorkflowFormFieldGroup (fieldText) {
    return getIssueWorkflowForm().find('.field-group > label').filter(function () {
        return this.textContent.trim() === fieldText;
    }).parents('.field-group:first');
}
