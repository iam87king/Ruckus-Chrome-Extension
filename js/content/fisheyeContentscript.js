function getReviewers (reviewerTextPrefix, reviewerSeparator) {
    var result = [];
    var reviewers = $('#participant-table').find('.reviewer:not(:first):not(.completedReviewer)');

    reviewers.each(function (index, element) {
        result.push(reviewerTextPrefix + element.textContent.trim());
    });

    return result.join(reviewerSeparator);
}

function getDescription () {
    var desc = $('#objectives-markup .markup');
    desc.find('br').replaceWith(Rks.Constant.NEW_LINE);
    return desc.text().trim();
}

function generateFisheyeLazyText (callback) {
    chrome.storage.sync.get('options', function (data) {
        var template = data.options.fisheyeLazyText.template;
        var reviewerTextPrefix = data.options.fisheyeLazyText.reviewerTextPrefix;
        var reviewerSeparator = data.options.fisheyeLazyText.reviewerSeparator;
        var reviewersReplacement = data.options.fisheyeLazyText.reviewersReplacement;
        var urlReplacement = data.options.fisheyeLazyText.urlReplacement;
        var descReplacement = data.options.fisheyeLazyText.descReplacement;

        var reviewers = getReviewers(reviewerTextPrefix, reviewerSeparator);
        var url = location.href;
        var desc = getDescription();

        callback(template.replace(reviewersReplacement, reviewers).replace(urlReplacement, url).replace(descReplacement, desc));
    });
}

function copyTextToClipboard (text) {
    const input = document.createElement('textarea');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('Copy');
    document.body.removeChild(input);
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
		case 'copyGeneratedFisheyeLazyText':
            generateFisheyeLazyText(function (lazyText) {
                copyTextToClipboard(lazyText);
            });
			break;
	};
});
