'use strict';

chrome.runtime.onInstalled.addListener(function(details) {
    chrome.storage.sync.get('buildNumberCache', function (data) {
        if (!data.buildNumberCache) {
            chrome.storage.sync.set({ buildNumberCache : { latest : {} } });
        }
    });

    chrome.storage.sync.get('resolveIssueFormData', function (data) {
        if (!data.resolveIssueFormData) {
            chrome.storage.sync.set({
                resolveIssueFormData : {
                    collateral : 'NO',
                    fixVersion : 'R5.1.1',
                    rootCause : 'n/a',
                    i23s : 'No',
                    bugSource : 'Legacy',
                    module : 'VSCG',
                    releaseVersion : 'R5.1.1',
                    autofillComment : 'YES'
                }
            });
        }
    });

    chrome.storage.sync.get('options', function (data) {
        if (!data.options) {
            chrome.storage.sync.set({ options : {
                redirector : {
                    defaultTarget : 'JIRA', // [JIRA, FISYEYE]
                    jiraChar : 's',
                    jiraUrlPrefix : 'https://jira.ruckuswireless.com/browse/SCG-',
                    fisheyeChar : 'c',
                    fisheyeCharUrlPrefix : 'http://fisheye.video54.local/cru/CR-',
                },
                autoLogin : {
                    enabled : true,
                    username : 'admin',
                    password : 'admin!234'
                },
                fisheyeLazyText : {
                    template : 'Hi {reviewers}, please help to review {url}, {desc}, thanks.',
                    reviewerTextPrefix : '@',
                    reviewerSeparator : ', ',
                    reviewersReplacement : '{reviewers}',
                    urlReplacement : '{url}',
                    descReplacement : '{desc}'
                },
                autofillCommentText : {
                    template : '[Root Cause]\n[Solution]\n[UT & Result]\n(Result)\n[Code review link]\nhttp://fisheye.video54.local/cru/\n[Fix CL][Fix Version]'
                }
            }});
        }
    });
});

chrome.omnibox.onInputEntered.addListener(function(text, suggest) {
    goToTicket(text);
});

chrome.commands.onCommand.addListener(function(command) {
    switch (command) {
        case 'copyGeneratedFisheyeLazyText':
            sendMessageToCurrentWindow({ action : 'copyGeneratedFisheyeLazyText' });
            break;
    };
});

function updateCredentialRes (ip, statusCode, timeStamp, requestId) {
    if (!ip || !statusCode || !timeStamp || !requestId) {
        return;
    }

    chrome.storage.sync.get('credentials', function (data) {
        try {
            if (data.credentials[ip].requestId == requestId) {
                data.credentials[ip].statusCode = statusCode;
                data.credentials[ip].timeStamp = timeStamp;
                chrome.storage.sync.set({credentials : data.credentials});
            }
        } catch (e) {
            // ignore
        }
    });
}

function updateCredentialListenerRes (detail) {
    if (detail.method != 'POST') {
        return;
    }

    updateCredentialRes(detail.ip, detail.statusCode, detail.timeStamp, detail.requestId);
}

function updateCredentialReq (ip, requestId, username, password) {
    if (!ip || !requestId || !username || !username) {
        return;
    }

    getPreUpdatePromise().then(function () {
        chrome.storage.sync.get('credentials', function (data) {
            var credentials = data.credentials || {};
            credentials[ip] = {
                ip : ip,
                requestId : requestId,
                username : username,
                password : password
            }
    
            chrome.storage.sync.set({credentials : credentials});
        });
    });
}

function getPreUpdatePromise () {
    return new Promise(function (resolve, reject) {
        chrome.storage.sync.get('credentials', function (data) {
            if (data.credentials && Object.keys(data.credentials).length < Rks.Constant.CACHE_MAX_CREDENTIAL_COUNT) {
                resolve(true);
            } else {
                removeOutdatedCredentials(resolve, reject);
            }
        });
    });
}

function removeOutdatedCredentials(resolve, reject) {
    chrome.storage.sync.get('credentials', function (data) {
        if (!data.credential) {
            resolve(true);
            return;
        }

        const newData = {};
        const sortedValues = Object.values(data.credentials).sort(function (c1, c2) {
            return c2.timeStamp - c1.timeStamp;
        });

        sortedValues.slice(0, Rks.Constant.CACHE_MAX_CREDENTIAL_COUNT).forEach(function (item) {
            newData[item.ip] = item;
        });
        chrome.storage.sync.set({credentials : newData}, resolve);
    });
}

function updateCredentialListenerReq (detail) {
    if (detail.method != 'POST' || $.isEmptyObject(detail.requestBody)) {
        return;
    }

    var ip = getHostNameFromUrl(detail.url);
    var formData = detail.requestBody.formData;
    var username = formData.username[0];
    var password = formData.password[0];
    updateCredentialReq(ip, detail.requestId, username, password);
}

chrome.webRequest.onBeforeRedirect.addListener(updateCredentialListenerRes, {
    urls : ['https://*:8443/cas/login*']
});

chrome.webRequest.onCompleted.addListener(updateCredentialListenerRes, {
    urls : ['https://*:8443/cas/login*']
});

chrome.webRequest.onBeforeRequest.addListener(updateCredentialListenerReq, {
    urls : ['https://*:8443/cas/login*']
}, ['requestBody']);
