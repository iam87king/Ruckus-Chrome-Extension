const Rks = {
    Constant : {
        NEW_LINE : '\r\n',
        CACHE_MAX_CREDENTIAL_COUNT : 20
    }
};

function getRedirectorUrlWithTarget (target, redirectorOptions, ticketNumber) {
    switch (target) {
        case 'JIRA':
            return redirectorOptions.jiraUrlPrefix + ticketNumber;
        case 'FISYEYE':
            return redirectorOptions.fisheyeCharUrlPrefix + ticketNumber;
    };
}

function getRedirectorUrl (redirectorOptions, ticketNumber) {
    return getRedirectorUrlWithTarget(redirectorOptions.defaultTarget, redirectorOptions, ticketNumber);
}

function goToTicket (ticketNumber) {
    chrome.storage.sync.get('options', function (data) {
        var jiraRegExp, fisheyeRegExp;

        if ($.isNumeric(ticketNumber)) {
            chrome.tabs.create({ url : getRedirectorUrl(data.options.redirector, ticketNumber) });
        } else {
            jiraRegExp = new RegExp(data.options.redirector.jiraChar, 'g');
            fisheyeRegExp = new RegExp(data.options.redirector.fisheyeChar, 'g');

            if (jiraRegExp.test(ticketNumber)) {
                chrome.tabs.create({ url : getRedirectorUrlWithTarget('JIRA', data.options.redirector, ticketNumber.replace(jiraRegExp, '')) });
            } else if (fisheyeRegExp.test(ticketNumber)) {
                chrome.tabs.create({ url : getRedirectorUrlWithTarget('FISYEYE', data.options.redirector, ticketNumber.replace(fisheyeRegExp, '')) });
            } else {
                chrome.tabs.create({ url : getRedirectorUrlWithTarget('JIRA', data.options.redirector, ticketNumber.replace(/\D/g, '')) });
            }
        }
    });
}

function getHostNameFromUrl (url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname;
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

function getFromStorage(key) {
    return new Promise(function (resolve, reject) {
        chrome.storage.sync.get(key, data => {
            resolve(data[key]);
        });
    });
}

function sendMessageToCurrentWindow (request, callback) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, request, res => {
                if ($.isFunction(callback)) {
                    callback(res);
                }
                resolve(res);
            });
        });
    });
}