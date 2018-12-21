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
                    template : '<p>[Root Cause]</p>\n<p>[Solution]</p>\n<p>[UT & Result]</p>\n<p>(Result)</p>\n<p>[Code review link]</p>\n<p>http://fisheye.video54.local/cru/</p>\n<p>[Fix CL]</p><p>[Fix Version]</p>'
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

    chrome.storage.sync.get('credentials', function (data) {
        var credentials = data.credentials || {};
        credentials[ip] = {
            requestId : requestId,
            username : username,
            password : password
        }
        chrome.storage.sync.set({credentials : credentials});
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
