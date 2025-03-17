function bookmarkSearchResoultFormatter (row) {
    return '<span style="font-weight:bold">' + row.title + '</span><br/>' + '<span style="color:#888">' + row.url + '</span>';
}

function getBuildServerUrl (module, releaseVersion) {
    var url;
    switch (releaseVersion) {
        case 'R5.1':
            url = 'http://jenkins-tdc.video54.local:8080/view/ESPP/view/5.1/job/R5_1_VSCG_IMG/buildHistory/ajax';
            break;
        case 'R5.1.1':
            url = 'http://jenkins-tdc.video54.local:8080/view/ESPP/view/5.1.1/job/R5_1_1_VSCG_IMG/buildHistory/ajax';
            break;
        case 'R5.1.2':
            url = 'http://jenkins-tdc.video54.local:8080/view/ESPP/view/5.1.2/job/R5_1_2_VSCG_IMG/buildHistory/ajax';
            break;
        case 'R5.2':
            url = 'http://jenkins-tdc.video54.local:8080/view/ESPP/view/5.2/job/R5_2_VSCG_IMG/buildHistory/ajax';
            break;
        case 'R5.2.1':
            url = 'http://jenkins-tdc.video54.local:8080/view/ESPP/view/5.2.1/job/R5_2_1_VSCG_IMG/buildHistory/ajax';
            break;
        case 'R6.0':
	        url = 'http://jenkins-tdc.video54.local:8080/view/ESPP/view/6.0/job/R6_0_VSCG_IMG/buildHistory/ajax';
            break;
        case 'R6.1':
            url = 'http://jenkins-tdc.video54.local:8080/view/ESPP/view/master/job/R6_1_VSCG_IMG/buildHistory/ajax';
            break;
    };

    return url;
}

function getNextBuildNumber (buildNumber) {
    if (!buildNumber) {
        return;
    }

    var buildNumberAry = buildNumber.split('.');
    var minorNumber = extractMinorBuildNumber(buildNumber);

    if (isNaN(minorNumber)) {
        return buildNumber;
    }

    buildNumberAry[buildNumberAry.length - 1] = minorNumber + 1;
    return buildNumberAry.join('.');
}

function extractMinorBuildNumber (buildNumber) {
    var buildNumberAry = buildNumber.split('.');
    return parseInt(buildNumberAry[buildNumberAry.length - 1], 10);;
}

function extractReleaseNumber (buildNumber) {
    var buildNumberAry = buildNumber.split('.');
    return buildNumberAry[0] + '.' + buildNumberAry[1];
}

function doAjax (url, method, params, headers, successCb) {
    $.ajax({
        url: url,
        type: method,
        data : params,
        headers: headers,
        dataType: 'html',
        success: successCb
    });
}

function getLatestBuildNumberFromResponse (response) {
    var jDOM = $(response.trim());
    var latestBuildItem = jDOM.find('tr.build-row:first');

    if (latestBuildItem.length === 0) {
        return;
    }

    return latestBuildItem.find('.display-name').text().trim();
}

function getLatestMinorBuildNumberFromCache (module, releaseVersion, callback) {
    chrome.storage.sync.get('buildNumberCache', function(data) {
        var buildNumberCache = data.buildNumberCache;
        var latestBuildNumberObj = {};

        try {
            latestBuildNumberObj = buildNumberCache.latest[module][releaseVersion];
        } catch (e) {
            // ignore, this means the cache doesn't has the latest build number
        }

        callback(latestBuildNumberObj);
    });
}

function setLatestBuildNumberToCache (module, releaseVersion, latestBuildNumber, callback) {
    chrome.storage.sync.get('buildNumberCache', function(data) {
        var buildNumberCache = data.buildNumberCache;

        if (!buildNumberCache.latest.hasOwnProperty(module)) {
            buildNumberCache.latest[module] = {};
        }

        if (!buildNumberCache.latest[module].hasOwnProperty(releaseVersion)) {
            buildNumberCache.latest[module][releaseVersion] = {};
        }

        buildNumberCache.latest[module][releaseVersion].full = latestBuildNumber;
        buildNumberCache.latest[module][releaseVersion].minor = extractMinorBuildNumber(latestBuildNumber);

        chrome.storage.sync.set({ buildNumberCache : buildNumberCache }, callback || $.noop);
    });
}

function getLatestBuildNumber (module, releaseVersion, callback, toNext) {
    var buildServerUrl = getBuildServerUrl(module, releaseVersion);

    getLatestMinorBuildNumberFromCache(module, releaseVersion, function (latestBuildNumberObj) {
        var headers;

        if (latestBuildNumberObj && latestBuildNumberObj.minor) {
            headers = {
                n : latestBuildNumberObj.minor
            };
        }

        doAjax(buildServerUrl, 'post', null, headers, function (response) {
            var latestBuildNumber = getLatestBuildNumberFromResponse(response) || latestBuildNumberObj.full;
            var nextOfLatestBuildNumber = latestBuildNumber;

            if (!latestBuildNumber) {
                return;
            }

            if (toNext) {
                nextOfLatestBuildNumber = getNextBuildNumber(latestBuildNumber);
            }

            setLatestBuildNumberToCache(module, releaseVersion, latestBuildNumber);
            callback(nextOfLatestBuildNumber);
        });
    });
}

function populateField (fieldType, fieldText, fieldValue) {
    sendMessageToCurrentWindow({ action : 'populateField', fieldType : fieldType, fieldText : fieldText, fieldValue : fieldValue });
}

function populateLatestBuildNumber (module, releaseVersion) {
    getLatestBuildNumber(module, releaseVersion, function (latestBuildNumber) {
        populateField('text', 'Fixed in Build', latestBuildNumber);
    }, true);
}

function populateComment2 (module, releaseVersion) {
    getLatestBuildNumber(module, releaseVersion, function (latestBuildNumber) {
        populateField('iframe', 'Comment', 'Available since ' + latestBuildNumber);
    }, true);
}

function populateComment (resolveIssueFormData) {
    var module = resolveIssueFormData.module;
    var releaseVersion = resolveIssueFormData.releaseVersion;
    var autofillComment = resolveIssueFormData.autofillComment;

    if (autofillComment === 'Yes') {
        chrome.storage.sync.get('options', function (data) {
            populateField('iframe', 'Comment', data.options.autofillCommentText.template);
        });
    } else {
        getLatestBuildNumber(module, releaseVersion, function (latestBuildNumber) {
            populateField('iframe', 'Comment', 'Available since ' + latestBuildNumber);
        }, true);
    }
}


function showMask (show) {
    $('#mask').prependTo($('html'))[show ? 'show' : 'hide']();
}


function searchFeatureFlag (featureId, resultContainer) {
    if (!featureId) return;

    sendMessageToCurrentWindow({ action : 'getFeatureFlagStatus', featureId }).then(response => {
        resultContainer.empty();

        const featureFlags = response.result
        if (!featureFlags || Object.keys(featureFlags).length === 0) {
            resultContainer.append("<p>No matching feature flag found.</p>");
            return;
        }

        Object.entries(featureFlags).forEach(([key, flag]) => {
            const statusClass = flag.currentTenantTreatment === true
                                ? "feature-flag-on" 
                                : flag.currentTenantTreatment === false ? "feature-flag-off" : "feature-flag-unknown";
            
            const flagElement = `
                <div class="feature-flag ${statusClass}">
                    <strong>${key.split('.split.')[1]}</strong><br>
                    Default: ${flag.defaultTreatment}<br>
                    Current Tenant: ${flag.currentTenantTreatment}
                </div>
            `;
            resultContainer.append(flagElement);
        });
    });
}