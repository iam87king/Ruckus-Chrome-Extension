chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
		case 'widenDescriptionArea':
			var width = document.body.clientWidth - 120;
			$('#description-val').css({width: width, maxWidth : width});
			break;
		case 'isResolveIssueFormOpen':
			sendResponse({ isOpen : getIssueWorkflowForm().length > 0 });
			break;
		case 'isDescAreaVisible':
			sendResponse({ isVisible : $('#description-val').length > 0 });
			break;
		case 'enablePerforceChange':
			getCommonIssueWorkflowFormField('Perforce Change').prop('disabled', false);
			break;
		case 'populateField':
			populateField(request.fieldType, request.fieldText, request.fieldValue);
			break;
		case 'copyMenuPath':
			copyMenuPath();
			break;
		case 'getDeployedServiceList':
			sendResponse({ deployedServiceList: getDeployedServiceList()});
			break;
	};
});
