'use strict';

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['buildNumberCache', 'resolveIssueFormData', 'options'], (data) => {
        if (!data.buildNumberCache) {
            chrome.storage.sync.set({ buildNumberCache: { latest: {} } });
        }

        if (!data.resolveIssueFormData) {
            chrome.storage.sync.set({
                resolveIssueFormData: {
                    collateral: 'NO',
                    fixVersion: 'R5.1.1',
                    rootCause: 'n/a',
                    i23s: 'No',
                    bugSource: 'Legacy',
                    module: 'VSCG',
                    releaseVersion: 'R5.1.1',
                    autofillComment: 'YES'
                }
            });
        }

        if (!data.options) {
            chrome.storage.sync.set({
                options: {
                    redirector: {
                        defaultTarget: 'JIRA',
                        jiraChar: 's',
                        jiraUrlPrefix: 'https://ruckus.atlassian.net/browse/ACX-',
                        fisheyeChar: 'c',
                        fisheyeCharUrlPrefix: 'http://fisheye.video54.local/cru/CR-',
                    },
                    autoLogin: {
                        enabled: true,
                        username: 'admin',
                        password: 'admin!234'
                    }
                }
            });
        }
    });
});

chrome.omnibox.onInputEntered.addListener((text) => {
    goToTicket(text);
});

chrome.commands.onCommand.addListener((command) => {
    if (command === 'copyMenuPath') {
        sendMessageToCurrentWindow({ action: 'copyMenuPath' });
    }
});

function updateCredentialRes(ip, statusCode, timeStamp, requestId) {
    if (!ip || !statusCode || !timeStamp || !requestId) {
        return;
    }

    chrome.storage.sync.get('credentials', (data) => {
        try {
            if (data.credentials[ip].requestId === requestId) {
                data.credentials[ip].statusCode = statusCode;
                data.credentials[ip].timeStamp = timeStamp;
                chrome.storage.sync.set({ credentials: data.credentials });
            }
        } catch (e) {
            console.error('Error updating credentials:', e);
        }
    });
}

function updateCredentialListenerRes(detail) {
    if (detail.method !== 'POST') {
        return;
    }
    updateCredentialRes(detail.ip, detail.statusCode, detail.timeStamp, detail.requestId);
}

function updateCredentialReq(ip, requestId, username, password) {
    if (!ip || !requestId || !username || !password) {
        return;
    }

    getPreUpdatePromise().then(() => {
        chrome.storage.sync.get('credentials', (data) => {
            const credentials = data.credentials || {};
            credentials[ip] = { ip, requestId, username, password };
            chrome.storage.sync.set({ credentials });
        });
    });
}

function getPreUpdatePromise() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('credentials', (data) => {
            if (data.credentials && Object.keys(data.credentials).length < Rks.Constant.CACHE_MAX_CREDENTIAL_COUNT) {
                resolve(true);
            } else {
                removeOutdatedCredentials(resolve);
            }
        });
    });
}

function removeOutdatedCredentials(resolve) {
    chrome.storage.sync.get('credentials', (data) => {
        if (!data.credentials) {
            resolve(true);
            return;
        }

        const sortedValues = Object.values(data.credentials).sort((c1, c2) => c2.timeStamp - c1.timeStamp);
        const newData = sortedValues.slice(0, Rks.Constant.CACHE_MAX_CREDENTIAL_COUNT).reduce((acc, item) => {
            acc[item.ip] = item;
            return acc;
        }, {});

        chrome.storage.sync.set({ credentials: newData }, resolve);
    });
}

function updateCredentialListenerReq(detail) {
    if (detail.method !== 'POST' || !detail.requestBody || Object.keys(detail.requestBody).length === 0) {
        return;
    }

    const ip = getHostNameFromUrl(detail.url);
    const formData = detail.requestBody.formData;
    const username = formData.username?.[0];
    const password = formData.password?.[0];

    if (username && password) {
        updateCredentialReq(ip, detail.requestId, username, password);
    }
}

chrome.webRequest.onBeforeRequest.addListener(updateCredentialListenerReq, {
    urls: ['https://*:8443/cas/login*']
}, ['requestBody']);

chrome.webRequest.onCompleted.addListener(updateCredentialListenerRes, {
    urls: ['https://*:8443/cas/login*']
});
