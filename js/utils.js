const Rks = {
    Constant: {
        NEW_LINE: '\r\n',
        CACHE_MAX_CREDENTIAL_COUNT: 20
    }
};

function getRedirectorUrlWithTarget(target, redirectorOptions, ticketNumber) {
    switch (target) {
        case 'JIRA':
            return redirectorOptions.jiraUrlPrefix + ticketNumber;
        case 'FISYEYE':
            return redirectorOptions.fisheyeCharUrlPrefix + ticketNumber;
    }
}

function getRedirectorUrl(redirectorOptions, ticketNumber) {
    return getRedirectorUrlWithTarget(redirectorOptions.defaultTarget, redirectorOptions, ticketNumber);
}

function goToTicket(ticketNumber) {
    chrome.storage.sync.get('options', (data) => {
        if (!data.options) return;

        const { redirector } = data.options;
        const jiraRegExp = new RegExp(redirector.jiraChar, 'g');
        const fisheyeRegExp = new RegExp(redirector.fisheyeChar, 'g');

        if (!isNaN(ticketNumber)) {
            chrome.tabs.create({ url: getRedirectorUrl(redirector, ticketNumber) });
        } else if (jiraRegExp.test(ticketNumber)) {
            chrome.tabs.create({ url: getRedirectorUrlWithTarget('JIRA', redirector, ticketNumber.replace(jiraRegExp, '')) });
        } else if (fisheyeRegExp.test(ticketNumber)) {
            chrome.tabs.create({ url: getRedirectorUrlWithTarget('FISYEYE', redirector, ticketNumber.replace(fisheyeRegExp, '')) });
        } else {
            chrome.tabs.create({ url: getRedirectorUrlWithTarget('JIRA', redirector, ticketNumber.replace(/\D/g, '')) });
        }
    });
}

function getHostNameFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return '';
    }
}

function getFromStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(key, (data) => resolve(data[key]));
    });
}

function sendMessageToCurrentWindow(request) {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, request, resolve);
            }
        });
    });
}
