const Rks = {
    Constant : {
        newLine : '\r\n'
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
        var newTicketNumber, jiraRegExp, fisheyeRegExp;

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

function sendMessageToCurrentWindow (request, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, request, callback);
    });
}
