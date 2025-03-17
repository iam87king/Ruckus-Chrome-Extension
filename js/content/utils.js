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
            populateTextField(fieldText, fieldValue);
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

function copyMenuPath() {
    const breadcrumbsList = $('.ant-breadcrumb > ol > li > span:first-child').toArray()
        .filter(item => item.textContent.trim() !== '' && item.textContent.trim() !== '\u00A0') // '\u00A0' => &nbsp;
        .map(item => item.textContent);
    const headerText = getMenuSpecificHeaderText(breadcrumbsList, $('.ant-page-header-heading-title').text().split(' (')[0]);
    const result = [...breadcrumbsList, headerText]
    copyToClipboard(result.join(' → '));
}

function getMenuSpecificHeaderText (breadcrumbsList, headerText) {
    if (breadcrumbsList.length <= 2) return headerText

    if (headerText.startsWith('Add')) {
        return '{Create}'
    } else if (headerText.startsWith('Edit') || headerText.startsWith('Configure')) {
        return '{Edit}'
    }

    return '{Details}'
}


function copyToClipboard(message) {
    var bodyDom = document.getElementsByTagName('body')[0];
    var tempInput = document.createElement('INPUT');
    bodyDom.appendChild(tempInput);
    tempInput.setAttribute('value', message)
    tempInput.select();
    document.execCommand('copy');
    bodyDom.removeChild(tempInput);
}

function getDeployedServiceList() {
    const textServiceList = $("ol > li.auto-cursor-target:contains(Service owner confirm build number on Friday)").parents("ol:first").next().text();
    const serviceList = textServiceList.split('/alto-cd deploy ').slice(1);
    const result = [];

    serviceList.forEach(item => {
        item = item.replace(' master ', ':').replace(/\s*dev\s*/, '');
        result.push(item);
    });

    return result;
}

function getFeatureFlagStatus(featureId) {
    const tenantIdMatch = window.location.href.match(/ruckus\.cloud\/(\w{32})\//);
    const tenantId = tenantIdMatch ? tenantIdMatch[1] : null;

    if (!tenantId) return;

    const featureFlags = {};
    for (const key in localStorage) {
        if (key.includes('.SPLITIO.split.') && key.includes(featureId)) {
            const flagData = JSON.parse(localStorage.getItem(key));
            featureFlags[key] = {
                defaultTreatment: flagData.defaultTreatment,
                currentTenantTreatment: getFeatureFlagStatusFromConditions(flagData.conditions, tenantId)
            }
        }
    }

    return featureFlags;
}

function getFeatureFlagStatusFromConditions(conditions, tenantId) {
    let status;
    
    conditions.some(condition => {
        if (condition.matcherGroup.matchers[0].matcherType === "WHITELIST") {
            const tenantIds = condition.matcherGroup.matchers[0].whitelistMatcherData.whitelist;

            if (tenantIds.includes(tenantId)) {
                status = condition.partitions.some(partition => partition.treatment === "on" && partition.size > 0);
                return true;
            }
        }
    });
    
    return status;
}